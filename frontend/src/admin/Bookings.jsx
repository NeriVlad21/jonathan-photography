import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingsApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import html2pdf from 'html2pdf.js'
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronRight
} from 'lucide-react'

const STATUSES = [
  'NEW',
  'CONTACTED',
  'CONFIRMED',
  'DECLINED'
]

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

export default function Bookings() {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [timeframe, setTimeframe] = useState('today')
  const [isExporting, setIsExporting] = useState(false)

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

        const query =
          search.trim().toLowerCase()

        if (query) {
          filtered =
            filtered.filter((booking) => {
              return (
                (
                  booking.name &&
                  booking.name
                    .toLowerCase()
                    .includes(query)
                ) ||
                (
                  booking.email &&
                  booking.email
                    .toLowerCase()
                    .includes(query)
                ) ||
                (
                  booking.reference_code &&
                  booking.reference_code
                    .toLowerCase()
                    .includes(query)
                )
              )
            })
        }

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
    timeframe
  ])

  /*
  ============================================================
  PDF EXPORT
  ============================================================
  */

  const exportToPDF = async () => {
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

          transform:
            translateX(2px);
        }

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
                  placeholder="Search name, email, or reference..."
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
                          Estimate
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
                                `/admin/bookings/${booking.id}`
                              )
                            }
                          >

                            <td className="bookings-row__reference">
                              {booking.reference_code ||
                                '—'}
                            </td>

                            <td className="bookings-row__client">

                              <strong>
                                {booking.name ||
                                  'Unnamed Client'}
                              </strong>

                              <span className="bookings-row__email">
                                {booking.email ||
                                  'No email'}
                              </span>

                            </td>

                            <td className="bookings-row__shoot">
                              {booking.shoot_type ||
                                '—'}
                            </td>

                            <td>
                              {booking.preferred_date ||
                                '—'}
                            </td>

                            <td>
                              {booking.estimate_total
                                ? peso(
                                    booking.estimate_total
                                  )
                                : '—'}
                            </td>

                            <td>
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

                            <td>
                              {formatDateTime(
                                booking.created_at
                              )}
                            </td>

                            <td className="bookings-row__open">

                              <ChevronRight
                                size={16}
                                aria-hidden="true"
                              />

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