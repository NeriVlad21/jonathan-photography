import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { bookingsApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { notifyAdminDataChanged } from '../utils/adminDataSync.js'
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronRight,
  CheckCircle2,
  Clock3,
  XCircle
} from 'lucide-react'

const STATUSES = [
  'NEW',
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED'
]

const QUICK_ACTIONS = {
  NEW: [
    { status: 'PENDING', label: 'Pending', icon: Clock3 },
    { status: 'CONFIRMED', label: 'Confirm', icon: CheckCircle2 },
    { status: 'CANCELLED', label: 'Cancel', icon: XCircle }
  ],
  PENDING: [
    { status: 'CONFIRMED', label: 'Confirm', icon: CheckCircle2 },
    { status: 'CANCELLED', label: 'Cancel', icon: XCircle }
  ],
  CONFIRMED: [
    { status: 'COMPLETED', label: 'Complete', icon: CheckCircle2 },
    { status: 'CANCELLED', label: 'Cancel', icon: XCircle }
  ]
}

const TIMEFRAMES = [
  {
    value: 'today',
    label: 'Today'
  },
  {
    value: 'last_week',
    label: 'Last Week'
  },
  {
    value: 'last_month',
    label: 'Last Month'
  },
  {
    value: 'last_3_months',
    label: 'Last 3 Months'
  },
  {
    value: 'last_quarter',
    label: 'Last Quarter'
  },
  {
    value: 'last_year',
    label: 'Last Year'
  },
  {
    value: 'all',
    label: 'All Time / Archive'
  }
]

export default function Bookings({ readOnly = false, detailBase = '/admin/bookings' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [bookings, setBookings] = useState(null)
  // Returning from Booking Details: restore the list position once the rows exist.
  const pendingScrollY = useRef(location.state?.scrollY ?? null)
  useEffect(() => {
    if (!bookings || pendingScrollY.current === null) return
    const top = Number(pendingScrollY.current) || 0
    pendingScrollY.current = null
    window.requestAnimationFrame(() => window.scrollTo({ top, behavior: 'auto' }))
  }, [bookings])
  const [status, setStatus] = useState(() => location.state?.bookingFilters?.status || '')
  const [search, setSearch] = useState(() => location.state?.bookingFilters?.search || '')
  const [timeframe, setTimeframe] = useState(() => location.state?.bookingFilters?.timeframe || 'today')
  const [priorityOnly, setPriorityOnly] = useState(() => Boolean(location.state?.bookingFilters?.priorityOnly))
  const [isExporting, setIsExporting] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [priorityCount, setPriorityCount] = useState(0)

  /*
  ============================================================
  LOAD BOOKINGS
  ============================================================
  */

  const load = () => {
    setBookings(null)

    const params = {}

    if (status) {
      params.status = status
    }

    if (search.trim()) params.search = search.trim()

    if (
      timeframe &&
      timeframe !== 'all'
    ) {
      params.timeframe = timeframe
    }

    bookingsApi
      .list(params)
      .then((data) => {
        let filtered =
          Array.isArray(data)
            ? data
            : []

        setPriorityCount(filtered.filter((booking) => ['NEW', 'PENDING'].includes(booking.status)).length)
        if (priorityOnly) filtered = filtered.filter((booking) => ['NEW', 'PENDING'].includes(booking.status))

        setBookings(filtered)
      })
      .catch(() => {
        setBookings([])
      })
  }

  /*
  ============================================================
  PAGE TITLE
  ============================================================
  */

  useEffect(() => {
    document.title =
      'Admin — Bookings'
  }, [])

  /*
  ============================================================
  FILTER / SEARCH
  ============================================================
  */

  useEffect(() => {
    const timer =
      setTimeout(load, 250)

    return () =>
      clearTimeout(timer)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    status,
    search,
    timeframe,
    priorityOnly
  ])

  const updateBookingStatus = async (event, booking, nextStatus) => {
    event.stopPropagation()
    if (['CANCELLED', 'COMPLETED'].includes(nextStatus) && !window.confirm(`Mark this booking as ${nextStatus.toLowerCase()}?`)) return
    setUpdatingId(booking.id)
    try {
      const updated = await bookingsApi.updateStatus(booking.id, nextStatus, true)
      setBookings((current) => current.flatMap((item) => {
        if (item.id !== booking.id) return [item]
        if ((status && status !== updated.status) || (priorityOnly && !['NEW', 'PENDING'].includes(updated.status))) return []
        return [{ ...item, status: updated.status }]
      }))
      setPriorityCount((current) => {
        const wasPriority = ['NEW', 'PENDING'].includes(booking.status)
        const isPriority = ['NEW', 'PENDING'].includes(updated.status)
        return Math.max(0, current + (isPriority ? 1 : 0) - (wasPriority ? 1 : 0))
      })
      showToast(`Booking updated to ${nextStatus}.`)
      notifyAdminDataChanged({ bookingId: booking.id, type: 'status' })
    } catch (error) {
      showToast(error?.message || 'Unable to update this booking.', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  /*
  ============================================================
  PDF EXPORT
  ============================================================
  */

  const exportToPDF = async () => {
    const { default: html2pdf } = await import('html2pdf.js')
    const element =
      document.getElementById(
        'bookings-export-container'
      )

    const header =
      document.getElementById(
        'bookings-pdf-header'
      )

    if (
      !element ||
      !bookings ||
      bookings.length === 0
    ) {
      return
    }

    setIsExporting(true)

    if (header) {
      header.style.display = 'block'
    }

    const opt = {
      margin: 0.5,

      filename:
        `Bookings_Report_${timeframe}.pdf`,

      image: {
        type: 'jpeg',
        quality: 0.98
      },

      html2canvas: {
        scale: 2
      },

      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'landscape'
      }
    }

    try {
      await html2pdf()
        .set(opt)
        .from(element)
        .save()
    } finally {
      if (header) {
        header.style.display = 'none'
      }

      setIsExporting(false)
    }
  }

  const timeframeLabel =
    TIMEFRAMES.find(
      (item) =>
        item.value === timeframe
    )?.label ||
    'All Time / Archive'

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <>
      <style>{`

        /*
        ============================================================
        BOOKINGS PAGE
        ============================================================
        */

        .bookings-page {
          width: 100%;
        }

        /*
        ============================================================
        CONTENT
        ============================================================
        */

        .bookings-content {
          width: 100%;
          max-width: 1200px;
        }

        /*
        ============================================================
        TOOLBAR
        ============================================================
        */

        .bookings-toolbar {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 12px;

          margin-bottom: 20px;

          padding: 12px;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);
        }

        .bookings-toolbar__filters {
          min-width: 0;

          flex: 1;

          display: flex;

          align-items: center;

          gap: 8px;

          flex-wrap: wrap;
        }

        /*
        ============================================================
        SEARCH
        ============================================================
        */

        .bookings-search {
          position: relative;

          flex: 1 1 280px;

          min-width: 220px;
        }

        .bookings-search__icon {
          position: absolute;

          left: 13px;

          top: 50%;

          transform:
            translateY(-50%);

          color:
            #999;

          pointer-events: none;
        }

        .bookings-search__input {
          width: 100%;

          min-height: 40px;

          box-sizing: border-box;

          padding:
            0 13px 0 40px;

          border:
            1px solid
            #d8d8d8;

          border-radius:
            7px;

          outline: none;

          background:
            #fafafa;

          color:
            var(--c-text, #111);

          font: inherit;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .bookings-search__input:hover {
          background:
            #fff;
        }

        .bookings-search__input:focus {
          background:
            #fff;

          border-color:
            var(--c-text, #111);

          box-shadow:
            0 0 0 3px
            rgba(
              0,
              0,
              0,
              0.04
            );
        }

        /*
        ============================================================
        SELECTS
        ============================================================
        */

        .bookings-select-wrap {
          position: relative;

          flex: 0 0 auto;

          display: flex;

          align-items: center;
        }

        .bookings-select-icon {
          position: absolute;

          left: 11px;

          color:
            #888;

          pointer-events: none;
        }

        .bookings-select {
          min-height: 40px;

          padding:
            0 12px 0 34px;

          border:
            1px solid
            #d8d8d8;

          border-radius:
            7px;

          background:
            #fafafa;

          color:
            var(--c-text, #111);

          outline: none;

          cursor: pointer;

          font: inherit;

          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .bookings-select:hover {
          background:
            #fff;

          border-color:
            #c5c5c5;
        }

        .bookings-select:focus {
          background:
            #fff;

          border-color:
            var(--c-text, #111);

          box-shadow:
            0 0 0 3px
            rgba(
              0,
              0,
              0,
              0.04
            );
        }

        /*
        ============================================================
        EXPORT
        ============================================================
        */

        .bookings-export {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          gap: 8px;

          min-height: 40px;

          padding:
            0 14px;

          white-space: nowrap;
        }

        .bookings-export:disabled {
          opacity:
            0.6;

          cursor:
            wait;
        }

        .bookings-priority-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin: -8px 0 20px;
          padding: 14px 16px;
          border-left: 4px solid var(--c-yellow, #f6ce00);
          background: #fff;
        }

        .bookings-priority-strip div { display: grid; gap: 3px; }
        .bookings-priority-strip span { color: #6b6b6b; font-size: .82rem; }
        .bookings-priority-toggle { border: 0; background: transparent; font: inherit; font-size: .8rem; font-weight: 800; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; white-space: nowrap; }
        .bookings-priority-toggle.is-active { color: #8a6e00; }

        /*
        ============================================================
        DATA PANEL
        ============================================================
        */

        .bookings-panel {
          overflow: hidden;

          padding: 0;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);
        }

        /*
        ============================================================
        PDF HEADER
        ============================================================
        */

        .bookings-pdf-header {
          display: none;

          margin:
            22px;

          padding-bottom:
            15px;

          border-bottom:
            2px solid
            #111827;
        }

        .bookings-pdf-header h2 {
          margin: 0;

          color:
            #111827;
        }

        .bookings-pdf-header__meta {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 20px;

          margin-top: 8px;

          color:
            #4b5563;
        }

        /*
        ============================================================
        TABLE
        ============================================================
        */

        .bookings-table-wrap {
          width: 100%;

          overflow-x: auto;
        }

        .bookings-table {
          width: 100%;

          min-width: 850px;

          border-collapse:
            collapse;
        }

        .bookings-table th {
          padding:
            13px 16px;

          border-bottom:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            #fafafa;

          color:
            #777;

          text-align:
            left;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }

        .bookings-table td {
          padding:
            14px 16px;

          border-bottom:
            1px solid
            var(--c-hairline, #ededed);

          color:
            var(--c-text, #111);

          vertical-align:
            middle;
        }

        /*
        ============================================================
        BOOKING ROW
        ============================================================
        */

        .bookings-row {
          position: relative;

          cursor: pointer;

          transition:
            background 0.18s ease;
        }

        .bookings-row:hover {
          background:
            #fafafa;
        }

        .bookings-row:last-child td {
          border-bottom: 0;
        }

        .bookings-row__client {
          min-width:
            170px;
        }

        .bookings-row__email {
          display: block;

          margin-top: 3px;

          color:
            var(--c-gray, #777);
        }

        .bookings-row__shoot {
          min-width:
            120px;
        }

        .bookings-row__reference {
          white-space:
            nowrap;
        }

        .bookings-row__open {
          width: 32px;

          padding:
            0 8px;

          color:
            #aaa;

          transition:
            color 0.18s ease,
            transform 0.18s ease;
        }

        .bookings-row:hover
        .bookings-row__open {
          color:
            var(--c-text, #111);
        }

        .bookings-quick-actions { display: flex; align-items: center; justify-content: flex-end; gap: 5px; }
        .bookings-quick-actions button { display: inline-flex; align-items: center; gap: 5px; min-height: 30px; padding: 0 8px; border: 1px solid #d7d7d7; border-radius: 5px; background: #fff; color: #222; font: inherit; font-size: .7rem; font-weight: 750; cursor: pointer; white-space: nowrap; }
        .bookings-quick-actions button:hover:not(:disabled) { border-color: #111; background: #111; color: #fff; }
        .bookings-quick-actions button:disabled { opacity: .5; cursor: wait; }

        /*
        ============================================================
        MOBILE
        ============================================================
        */

        @media (max-width: 900px) {

          .bookings-toolbar {
            align-items:
              stretch;

            flex-direction:
              column;
          }

          .bookings-toolbar__filters {
            width: 100%;
          }

          .bookings-search {
            flex-basis:
              100%;
          }

          .bookings-select-wrap {
            flex: 1;
          }

          .bookings-select {
            width: 100%;
          }

          .bookings-export {
            width: 100%;
          }

          .bookings-priority-strip { align-items: flex-start; flex-direction: column; }

        }

        @media (max-width: 600px) {

          .bookings-toolbar {
            padding:
              10px;
          }

          .bookings-toolbar__filters {
            display: grid;

            grid-template-columns:
              1fr;

            gap: 8px;
          }

          .bookings-search {
            width: 100%;

            min-width: 0;
          }

          .bookings-select-wrap {
            width: 100%;
          }

          .bookings-pdf-header__meta {
            align-items:
              flex-start;

            flex-direction:
              column;

            gap: 5px;
          }

        }

        /*
        ============================================================
        REDUCED MOTION
        ============================================================
        */

        @media (
          prefers-reduced-motion: reduce
        ) {

          .bookings-search__input,
          .bookings-select,
          .bookings-row,
          .bookings-row__open {
            transition:
              none;
          }

        }

      `}</style>

      <section className="bookings-page">

        <div className="admin-content bookings-content">

          {/* ====================================================
              FILTER TOOLBAR
              ==================================================== */}

          <div className="bookings-toolbar">

            <div className="bookings-toolbar__filters">

              {/* SEARCH */}

              <div className="bookings-search">

                <Search
                  size={17}
                  className="bookings-search__icon"
                  aria-hidden="true"
                />

                <input
                  type="text"
                  className="bookings-search__input"
                  placeholder="Search client, reference, service, or event date..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  aria-label="Search bookings"
                />

              </div>

              {/* STATUS */}

              <div className="bookings-select-wrap">

                <SlidersHorizontal
                  size={15}
                  className="bookings-select-icon"
                  aria-hidden="true"
                />

                <select
                  className="bookings-select"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                  aria-label="Filter by status"
                >

                  <option value="">
                    All statuses
                  </option>

                  {STATUSES.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* TIMEFRAME */}

              <div className="bookings-select-wrap">

                <select
                  className="bookings-select"
                  value={timeframe}
                  onChange={(event) =>
                    setTimeframe(
                      event.target.value
                    )
                  }
                  aria-label="Filter by timeframe"
                  style={{
                    paddingLeft: 12
                  }}
                >

                  {TIMEFRAMES.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

            {/* EXPORT */}

            <button
              type="button"
              onClick={exportToPDF}
              disabled={
                isExporting ||
                !bookings ||
                bookings.length === 0
              }
              className="
                btn
                btn--primary
                bookings-export
              "
            >

              <Download
                size={16}
                aria-hidden="true"
              />

              {isExporting
                ? 'Preparing…'
                : 'Download PDF'}

            </button>

          </div>

          <div className="bookings-priority-strip">
            <div>
              <strong>{priorityCount} {priorityCount === 1 ? 'request needs' : 'requests need'} attention</strong>
              <span>New and pending requests that still need an owner decision.</span>
            </div>
            <button
              type="button"
              className={`bookings-priority-toggle${priorityOnly ? ' is-active' : ''}`}
              onClick={() => {
                setStatus('')
                setPriorityOnly((current) => !current)
              }}
            >
              {priorityOnly ? 'Show all requests' : 'Show priority only'}
            </button>
          </div>

          {/* ====================================================
              LOADING
              ==================================================== */}

          {bookings === null && (
            <LoadingState
              label="Loading bookings…"
            />
          )}

          {/* ====================================================
              EMPTY
              ==================================================== */}

          {bookings &&
            bookings.length === 0 && (
              <EmptyState
                title="No bookings found."
                body="Try adjusting your search or date filters."
              />
            )}

          {/* ====================================================
              BOOKING TABLE
              ==================================================== */}

          {bookings &&
            bookings.length > 0 && (
              <div
                className="
                  admin-panel
                  bookings-panel
                "
                id="bookings-export-container"
              >

                {/* PDF HEADER */}

                <div
                  id="bookings-pdf-header"
                  className="bookings-pdf-header"
                >

                  <h2>
                    Jonathan Photography —
                    Bookings Report
                  </h2>

                  <div className="bookings-pdf-header__meta">

                    <span>
                      <strong>
                        Timeframe:
                      </strong>{' '}
                      {timeframeLabel}
                    </span>

                    <span>
                      <strong>
                        Generated:
                      </strong>{' '}
                      {new Date().toLocaleDateString()}{' '}
                      at{' '}
                      {new Date().toLocaleTimeString()}
                    </span>

                  </div>

                </div>

                <div className="bookings-table-wrap">

                  <table className="bookings-table">

                    <thead>

                      <tr>

                        <th>
                          Reference
                        </th>

                        <th>
                          Client
                        </th>

                        <th>
                          Shoot
                        </th>

                        <th>
                          Date
                        </th>

                        <th>
                          Agreed / Estimate
                        </th>

                        <th>
                          Balance
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Submitted
                        </th>

                        <th />

                      </tr>

                    </thead>

                    <tbody>

                      {bookings.map(
                        (booking) => (
                          <tr
                            key={
                              booking.id
                            }
                            className="bookings-row"
                            onClick={() =>
                              navigate(
                                `${detailBase}/${booking.id}`,
                                { state: { from: { ...location, state: { ...(location.state || {}), bookingFilters: { status, search, timeframe, priorityOnly }, scrollY: window.scrollY } } } }
                              )
                            }
                          >

                            <td className="bookings-row__reference" data-label="Reference">
                              {booking.reference_code ||
                                '—'}
                            </td>

                            <td className="bookings-row__client" data-label="Client">

                              <strong>
                                {booking.name ||
                                  'Unnamed Client'}
                              </strong>

                              {Number(booking.open_flag_count) > 0 && <span className="status-badge status-badge--PENDING" title={booking.latest_flag_reason || 'Oversight warning'}>Flagged</span>}

                              <span className="bookings-row__email">
                                {booking.email ||
                                  'No email'}
                              </span>

                            </td>

                            <td className="bookings-row__shoot" data-label="Shoot">
                              {booking.shoot_type ||
                                '—'}
                            </td>

                            <td data-label="Date">
                              {booking.agreed_date || booking.preferred_date ||
                                '—'}
                            </td>

                            <td data-label="Agreed / Estimate">
                              {booking.agreed_total || booking.estimate_total
                                ? peso(
                                    booking.agreed_total || booking.estimate_total
                                  )
                                : '—'}
                            </td>

                            <td data-label="Balance">
                              {booking.agreed_total
                                ? peso(booking.balance_due)
                                : '—'}
                            </td>

                            <td data-label="Status">
                              <span
                                className={`
                                  status-badge
                                  status-badge--${booking.status}
                                `}
                              >
                                {booking.status ||
                                  'Unknown'}
                              </span>
                            </td>

                            <td data-label="Submitted">
                              {formatDateTime(
                                booking.created_at
                              )}
                            </td>

                            <td className="bookings-row__open" data-label="Actions">
                              {!readOnly && QUICK_ACTIONS[booking.status]?.length ? (
                                <div className="bookings-quick-actions" aria-label={`Actions for ${booking.name}`}>
                                  {QUICK_ACTIONS[booking.status].map((action) => {
                                    const Icon = action.icon
                                    return (
                                      <button
                                        key={action.status}
                                        type="button"
                                        onClick={(event) => updateBookingStatus(event, booking, action.status)}
                                        disabled={updatingId === booking.id}
                                        title={action.label}
                                        aria-label={`${action.label} ${booking.name}`}
                                      >
                                        <Icon size={14} aria-hidden="true" />
                                        <span>{action.label}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              ) : <ChevronRight size={16} aria-hidden="true" />}
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            )}

        </div>

      </section>
    </>
  )
}
