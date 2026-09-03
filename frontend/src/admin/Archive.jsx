import { useEffect, useState } from 'react'
import {
  bookingsApi,
  estimatorApi
} from '../services/api.js'

import {
  peso,
  formatDateTime
} from '../utils/format.js'

import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import html2pdf from 'html2pdf.js'

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

export default function Archive() {
  const [activeTab, setActiveTab] =
    useState('bookings')

  const [timeframe, setTimeframe] =
    useState('today')

  const [data, setData] =
    useState(null)

  const [isExporting, setIsExporting] =
    useState(false)

  /*
  ============================================================
  LOAD DATA
  ============================================================
  */

  useEffect(() => {
    document.title =
      'Admin — Archive & Storage'

    loadArchiveData()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    timeframe
  ])

  const loadArchiveData = async () => {
    setData(null)

    try {
      if (activeTab === 'bookings') {
        const result =
          await bookingsApi.list({
            timeframe
          })

        setData(
          Array.isArray(result)
            ? result
            : []
        )
      } else {
        const result =
          await estimatorApi.leads(
            timeframe
          )

        setData(
          Array.isArray(result)
            ? result
            : []
        )
      }
    } catch (error) {
      console.error(
        'Archive load failed:',
        error
      )

      setData([])
    }
  }

  /*
  ============================================================
  PDF EXPORT
  ============================================================
  */

  const exportToPDF = async () => {
    const element =
      document.getElementById(
        'archive-export-container'
      )

    const header =
      document.getElementById(
        'archive-pdf-header'
      )

    if (!element) return

    setIsExporting(true)

    if (header) {
      header.style.display = 'block'
    }

    const opt = {
      margin: 0.5,

      filename:
        `Archive_${activeTab}_${timeframe}.pdf`,

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
        ARCHIVE PAGE
        ============================================================
        */

        .archive-page {
          width: 100%;
        }

        /*
        ============================================================
        TOOLBAR
        ============================================================
        */

        .archive-toolbar {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 18px;

          margin-bottom: 20px;

          padding:
            14px;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);
        }

        /*
        ============================================================
        TABS
        ============================================================
        */

        .archive-tabs {
          display: flex;

          align-items: center;

          gap: 5px;

          min-width: 0;

          padding: 4px;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            #f7f7f7;

          border-radius:
            8px;
        }

        .archive-tab {
          min-height: 38px;

          padding:
            0 14px;

          border: 0;

          border-radius:
            6px;

          background:
            transparent;

          color:
            #777;

          cursor: pointer;

          white-space: nowrap;

          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .archive-tab:hover {
          color:
            var(--c-text, #111);

          background:
            #ececec;
        }

        .archive-tab--active {
          color:
            #fff;

          background:
            #111;
        }

        .archive-tab--active:hover {
          color:
            #fff;

          background:
            #111;
        }

        /*
        ============================================================
        FILTERS
        ============================================================
        */

        .archive-filters {
          display: flex;

          align-items: center;

          gap: 9px;

          flex: 0 0 auto;
        }

        .archive-filter-label {
          color:
            var(--c-gray, #777);
        }

        .archive-select {
          min-height: 40px;

          padding:
            0 34px 0 11px;

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

        .archive-select:hover {
          background:
            #fff;

          border-color:
            #c5c5c5;
        }

        .archive-select:focus {
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

        .archive-export {
          min-height: 40px;

          padding:
            0 15px;
        }

        .archive-export:disabled {
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

        .archive-panel {
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

        .archive-pdf-header {
          display: none;

          margin:
            22px;

          padding-bottom:
            15px;

          border-bottom:
            2px solid
            #111827;
        }

        .archive-pdf-header h2 {
          margin: 0;

          color:
            #111827;
        }

        .archive-pdf-header__meta {
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

        .archive-table-wrap {
          width: 100%;

          overflow-x: auto;
        }

        .archive-table {
          width: 100%;

          min-width: 880px;

          border-collapse:
            collapse;
        }

        .archive-table th {
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

        .archive-table td {
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

        .archive-table tbody tr {
          transition:
            background 0.18s ease;
        }

        .archive-table tbody tr:hover {
          background:
            #fafafa;
        }

        .archive-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .archive-table__secondary {
          display: block;

          margin-top: 3px;

          color:
            var(--c-gray, #777);
        }

        .archive-table__muted {
          color:
            #999;
        }

        .archive-table__addons {
          max-width:
            240px;

          line-height:
            1.45;
        }

        /*
        ============================================================
        RESPONSIVE
        ============================================================
        */

        @media (max-width: 900px) {

          .archive-toolbar {
            align-items:
              stretch;

            flex-direction:
              column;
          }

          .archive-tabs {
            width:
              fit-content;
          }

          .archive-filters {
            flex-wrap:
              wrap;
          }

        }

        @media (max-width: 600px) {

          .archive-toolbar {
            padding:
              11px;
          }

          .archive-tabs {
            width: 100%;

            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .archive-tab {
            width: 100%;

            padding:
              0 8px;
          }

          .archive-filters {
            display: grid;

            grid-template-columns:
              1fr;

            gap: 8px;
          }

          .archive-filter-label {
            display: none;
          }

          .archive-select,
          .archive-export {
            width: 100%;
          }

          .archive-pdf-header__meta {
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

          .archive-tab,
          .archive-select,
          .archive-table tbody tr {
            transition:
              none;
          }

        }

      `}</style>

      <section className="archive-page">

        {/* ======================================================
            CONTENT
        ====================================================== */}

        <div
          className="admin-content"
          style={{
            maxWidth: 1200
          }}
        >

          {/* ====================================================
              TOOLBAR
          ==================================================== */}

          <div className="archive-toolbar">

            {/* TABS */}

            <div className="archive-tabs">

              <button
                type="button"
                className={`
                  archive-tab
                  ${
                    activeTab === 'bookings'
                      ? 'archive-tab--active'
                      : ''
                  }
                `}
                onClick={() =>
                  setActiveTab(
                    'bookings'
                  )
                }
              >
                Archived Bookings
              </button>

              <button
                type="button"
                className={`
                  archive-tab
                  ${
                    activeTab === 'leads'
                      ? 'archive-tab--active'
                      : ''
                  }
                `}
                onClick={() =>
                  setActiveTab(
                    'leads'
                  )
                }
              >
                Archived Estimator Leads
              </button>

            </div>

            {/* FILTERS */}

            <div className="archive-filters">

              <span className="archive-filter-label">
                Period
              </span>

              <select
                className="archive-select"
                value={timeframe}
                onChange={(event) =>
                  setTimeframe(
                    event.target.value
                  )
                }
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

              <button
                type="button"
                onClick={exportToPDF}
                disabled={
                  isExporting ||
                  !data ||
                  data.length === 0
                }
                className="
                  btn
                  btn--primary
                  archive-export
                "
              >
                {isExporting
                  ? 'Preparing…'
                  : 'Download PDF'}
              </button>

            </div>

          </div>

          {/* ====================================================
              LOADING
          ==================================================== */}

          {data === null && (
            <LoadingState
              label="Loading archive data…"
            />
          )}

          {/* ====================================================
              EMPTY
          ==================================================== */}

          {data &&
            data.length === 0 && (
              <EmptyState
                title="No archived records found."
                body={`No results for ${timeframeLabel.toLowerCase()}.`}
              />
            )}

          {/* ====================================================
              DATA
          ==================================================== */}

          {data &&
            data.length > 0 && (
              <div
                className="admin-panel archive-panel"
                id="archive-export-container"
              >

                {/* PDF HEADER */}

                <div
                  id="archive-pdf-header"
                  className="archive-pdf-header"
                >

                  <h2>
                    Jonathan Photography —{' '}
                    {activeTab === 'bookings'
                      ? 'Bookings'
                      : 'Estimator Leads'}{' '}
                    Archive
                  </h2>

                  <div className="archive-pdf-header__meta">

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

                {/* TABLE */}

                <div className="archive-table-wrap">

                  <table className="archive-table">

                    {/* ==================================================
                        BOOKINGS
                        ================================================== */}

                    {activeTab === 'bookings' ? (
                      <>

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
                          </tr>

                        </thead>

                        <tbody>

                          {data.map(
                            (booking) => (
                              <tr
                                key={
                                  booking.id
                                }
                              >

                                <td>
                                  {booking.reference_code ||
                                    '—'}
                                </td>

                                <td>

                                  <strong>
                                    {booking.name ||
                                      'Unnamed Client'}
                                  </strong>

                                  <span className="archive-table__secondary">
                                    {booking.email ||
                                      'No email'}
                                  </span>

                                </td>

                                <td>
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

                              </tr>
                            )
                          )}

                        </tbody>

                      </>
                    ) : (

                      /* ==================================================
                         ESTIMATOR LEADS
                         ================================================== */

                      <>

                        <thead>

                          <tr>

                            <th>
                              Name
                            </th>

                            <th>
                              Email
                            </th>

                            <th>
                              Hours
                            </th>

                            <th>
                              Service
                            </th>

                            <th>
                              Add-ons
                            </th>

                            <th>
                              Total
                            </th>

                            <th>
                              Status
                            </th>

                            <th>
                              Submitted
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {data.map(
                            (lead) => {

                              let addons = []

                              try {
                                addons =
                                  JSON.parse(
                                    lead.addons ||
                                      '[]'
                                  )
                              } catch {
                                addons = []
                              }

                              const status =
                                lead.status ||
                                (
                                  lead.booked_live
                                    ? 'Booked'
                                    : 'New'
                                )

                              return (
                                <tr
                                  key={
                                    lead.id
                                  }
                                >

                                  <td>
                                    <strong>
                                      {lead.name ||
                                        'Unnamed Lead'}
                                    </strong>
                                  </td>

                                  <td>
                                    {lead.email ||
                                      '—'}
                                  </td>

                                  <td>
                                    {lead.hours ||
                                      '—'}
                                  </td>

                                  <td>
                                    {lead.service_type ||
                                      '—'}
                                  </td>

                                  <td>
                                    <span className="archive-table__addons">
                                      {addons.length
                                        ? addons
                                            .map(
                                              (
                                                addon
                                              ) =>
                                                addon.label
                                            )
                                            .join(
                                              ', '
                                            )
                                        : '—'}
                                    </span>
                                  </td>

                                  <td>
                                    {peso(
                                      lead.total
                                    )}
                                  </td>

                                  <td>
                                    <span className="status-badge">
                                      {status}
                                    </span>
                                  </td>

                                  <td>
                                    {formatDateTime(
                                      lead.created_at
                                    )}
                                  </td>

                                </tr>
                              )
                            }
                          )}

                        </tbody>

                      </>

                    )}

                  </table>

                </div>

              </div>
            )}

        </div>

      </section>
    </>
  )
}