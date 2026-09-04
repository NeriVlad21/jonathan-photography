import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import html2pdf from 'html2pdf.js'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

const TIMEFRAME_LABELS = {
  today: 'Today',
  last_week: 'Last Week',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  last_quarter: 'Last Quarter',
  last_year: 'Last Year',
  all: 'All Time / Archive'
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [timeframe, setTimeframe] = useState('today')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    document.title = 'Admin — Dashboard'
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe])

  const loadStats = () => {
    setStats(null)

    dashboardApi
      .stats(timeframe)
      .then(setStats)
      .catch(() => {})
  }

  const exportToPDF = async () => {
    const element =
      document.getElementById(
        'export-container'
      )

    const header =
      document.getElementById(
        'pdf-header'
      )

    if (!element) return

    setIsExporting(true)

    if (header) {
      header.style.display = 'block'
    }

    const opt = {
      margin: 0.5,
      filename:
        `Business_Dashboard_${timeframe}.pdf`,
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

  if (!stats) {
    return (
      <LoadingState
        label="Loading dashboard…"
      />
    )
  }

  const {
    cards,
    recent_activity,
    chart_data
  } = stats

  const graphData = chart_data?.length === 1
    ? [
        { name: 'Earlier', leads: 0, bookings: 0 },
        chart_data[0],
        { name: 'Now', leads: 0, bookings: 0 }
      ]
    : chart_data

  return (
    <>
      <style>{`

        /*
        ============================================================
        DASHBOARD
        ============================================================
        */

        .dashboard-page {
          width: 100%;
        }

        /*
        ============================================================
        HEADER
        ============================================================
        */

        .dashboard-header {
          display: flex;

          align-items: flex-end;
          justify-content: space-between;

          gap: 24px;

          margin-bottom: 28px;
        }

        .dashboard-header__copy {
          min-width: 0;
        }

        .dashboard-header__subtitle {
          margin: 6px 0 0;

          color:
            var(--c-gray);

          max-width: 60ch;
        }

        /*
        ============================================================
        ACTIONS
        ============================================================
        */

        .dashboard-header__actions {
          display: flex;

          align-items: center;

          gap: 8px;

          flex: 0 0 auto;
        }

        .dashboard-filter {
          display: flex;

          align-items: center;

          min-height: 40px;

          border:
            1px solid
            var(--c-hairline);

          background:
            var(--c-bg, #fff);
        }

        .dashboard-filter__label {
          padding:
            0 10px;

          color:
            var(--c-gray);
        }

        .dashboard-filter select {
          min-height: 38px;

          padding:
            0 30px 0 4px;

          border: 0;

          background:
            transparent;

          color:
            var(--c-text);

          outline: none;

          cursor: pointer;

          font: inherit;
        }

        .dashboard-export {
          min-height: 40px;

          padding:
            0 16px;
        }

        .dashboard-export:disabled {
          opacity: 0.6;

          cursor:
            wait;
        }

        /*
        ============================================================
        PDF HEADER
        ============================================================
        */

        .dashboard-pdf-header {
          display: none;

          margin-bottom: 25px;

          padding-bottom: 15px;

          border-bottom:
            2px solid
            #111827;
        }

        .dashboard-pdf-header__meta {
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
        STAT CARDS
        ============================================================
        */

        .dashboard-stat-grid {
          display: grid;

          grid-template-columns:
            repeat(
              5,
              minmax(0, 1fr)
            );

          gap: 12px;
        }

        .dashboard-stat {
          min-width: 0;

          padding:
            20px;

          border:
            1px solid
            var(--c-hairline);

          background:
            var(--c-bg, #fff);

          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .dashboard-stat:hover {
          transform:
            translateY(-2px);

          border-color:
            #cfcfcf;

          box-shadow:
            0 8px 24px
            rgba(
              0,
              0,
              0,
              0.06
            );
        }

        .dashboard-stat__top {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 10px;

          margin-bottom: 18px;
        }

        .dashboard-stat__label {
          color:
            var(--c-gray);

          text-transform:
            uppercase;
        }

        .dashboard-stat__marker {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background:
            #111827;
        }

        .dashboard-stat__value {
          margin: 0;

          color:
            var(--c-text);
        }

        /*
        ============================================================
        MAIN PANELS
        ============================================================
        */

        .dashboard-panel {
          margin-top: 18px;

          border:
            1px solid
            var(--c-hairline);

          background:
            var(--c-bg, #fff);

          overflow: hidden;
        }

        .dashboard-panel__header {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 20px;

          padding:
            18px 20px;

          border-bottom:
            1px solid
            var(--c-hairline);
        }

        .dashboard-panel__title {
          margin: 0;
        }

        .dashboard-panel__meta {
          color:
            var(--c-gray);
        }

        /*
        ============================================================
        CHART
        ============================================================
        */

        .dashboard-chart {
          width: 100%;
          height: 340px;

          padding:
            20px;
        }

        /*
        ============================================================
        RECENT ACTIVITY
        ============================================================
        */

        .dashboard-activity {
          display: flex;

          flex-direction: column;
        }

        .dashboard-activity__row {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 20px;

          padding:
            15px 20px;

          border-bottom:
            1px solid
            var(--c-hairline);

          transition:
            background 0.2s ease;
        }

        .dashboard-activity__row:last-child {
          border-bottom: 0;
        }

        .dashboard-activity__row:hover {
          background:
            rgba(
              0,
              0,
              0,
              0.018
            );
        }

        .dashboard-activity__main {
          min-width: 0;

          display: flex;

          align-items: center;

          gap: 12px;
        }

        .dashboard-activity__badge {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          flex: 0 0 auto;

          min-width: 72px;

          min-height: 25px;

          padding:
            0 8px;

          border:
            1px solid
            var(--c-hairline);

          text-transform:
            uppercase;
        }

        .dashboard-activity__badge--booking {
          border-color:
            #111827;

          background:
            #111827;

          color:
            #fff;
        }

        .dashboard-activity__link {
          min-width: 0;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;

          color:
            var(--c-text);

          text-decoration: none;
        }

        .dashboard-activity__link:hover {
          text-decoration:
            underline;
        }

        .dashboard-activity__lead {
          min-width: 0;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;

          color:
            #4b5563;
        }

        .dashboard-activity__date {
          flex: 0 0 auto;

          color:
            #999;
        }

        .dashboard-empty {
          padding:
            40px 25px;

          color:
            var(--c-gray);

          text-align:
            center;
        }

        /*
        ============================================================
        RESPONSIVE
        ============================================================
        */

        @media (max-width: 1150px) {

          .dashboard-stat-grid {
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );
          }

        }

        @media (max-width: 850px) {

          .dashboard-header {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .dashboard-header__actions {
            width: 100%;

            justify-content:
              space-between;
          }

          .dashboard-filter {
            flex: 1;
          }

          .dashboard-filter select {
            width: 100%;
          }

          .dashboard-export {
            flex: 0 0 auto;
          }

          .dashboard-stat-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

        }

        @media (max-width: 600px) {

          .dashboard-header__actions {
            align-items:
              stretch;

            flex-direction:
              column;
          }

          .dashboard-filter {
            width: 100%;
          }

          .dashboard-export {
            width: 100%;
          }

          .dashboard-stat-grid {
            grid-template-columns:
              1fr;
          }

          .dashboard-stat {
            padding:
              16px;
          }

          .dashboard-panel__header {
            align-items:
              flex-start;

            flex-direction:
              column;

            gap: 6px;
          }

          .dashboard-chart {
            height: 270px;

            padding:
              10px;
          }

          .dashboard-activity__row {
            align-items:
              flex-start;

            flex-direction:
              column;

            gap: 8px;
          }

          .dashboard-activity__main {
            width: 100%;
          }

          .dashboard-activity__date {
            padding-left:
              84px;
          }

        }

        @media (
          prefers-reduced-motion: reduce
        ) {

          .dashboard-stat,
          .dashboard-activity__row {
            transition: none;
          }

          .dashboard-stat:hover {
            transform: none;

            box-shadow: none;
          }

        }

      `}</style>

      <section className="dashboard-page">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="admin-header dashboard-header">

          <div className="dashboard-header__copy">

            <p className="dashboard-header__subtitle">
              Overview of your studio's performance.
            </p>

          </div>

          <div className="dashboard-header__actions">

            {/* TIMEFRAME */}

            <div className="dashboard-filter">

              <span className="dashboard-filter__label">
                Period
              </span>

              <select
                value={timeframe}
                onChange={(e) =>
                  setTimeframe(
                    e.target.value
                  )
                }
              >
                <option value="today">
                  Today
                </option>

                <option value="last_week">
                  Last Week
                </option>

                <option value="last_month">
                  Last Month
                </option>

                <option value="last_3_months">
                  Last 3 Months
                </option>

                <option value="last_quarter">
                  Last Quarter
                </option>

                <option value="last_year">
                  Last Year
                </option>

                <option value="all">
                  All Time / Archive
                </option>
              </select>

            </div>

            {/* PDF */}

            <button
              type="button"
              onClick={exportToPDF}
              disabled={isExporting}
              className="
                btn
                btn--primary
                dashboard-export
              "
            >
              {isExporting
                ? 'Preparing…'
                : 'Download PDF'}
            </button>

          </div>

        </header>

        <div className="admin-content">

          {/* ====================================================
              PDF EXPORT AREA
          ==================================================== */}

          <div
            id="export-container"
          >

            {/* PDF HEADER */}

            <div
              id="pdf-header"
              className="dashboard-pdf-header"
            >

              <h2>
                Business Dashboard Report
              </h2>

              <div className="dashboard-pdf-header__meta">

                <span>
                  <strong>
                    Timeframe:
                  </strong>{' '}
                  {TIMEFRAME_LABELS[
                    timeframe
                  ]}
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

            {/* ==================================================
                STATISTICS
            ================================================== */}

            <div className="dashboard-stat-grid">

              <div className="dashboard-stat">

                <div className="dashboard-stat__top">

                  <div className="dashboard-stat__label">
                    Total Bookings
                  </div>

                  <span className="dashboard-stat__marker" />

                </div>

                <div className="dashboard-stat__value">
                  {cards.total_bookings}
                </div>

              </div>

              <div className="dashboard-stat">

                <div className="dashboard-stat__top">

                  <div className="dashboard-stat__label">
                    New Bookings
                  </div>

                  <span className="dashboard-stat__marker" />

                </div>

                <div className="dashboard-stat__value">
                  {cards.new_bookings}
                </div>

              </div>

              <div className="dashboard-stat">

                <div className="dashboard-stat__top">

                  <div className="dashboard-stat__label">
                    Estimator Uses
                  </div>

                  <span className="dashboard-stat__marker" />

                </div>

                <div className="dashboard-stat__value">
                  {cards.estimator_uses}
                </div>

              </div>

              <div className="dashboard-stat">

                <div className="dashboard-stat__top">

                  <div className="dashboard-stat__label">
                    Average Estimate
                  </div>

                  <span className="dashboard-stat__marker" />

                </div>

                <div className="dashboard-stat__value">
                  {peso(
                    cards.average_estimate
                  )}
                </div>

              </div>

              <div className="dashboard-stat">

                <div className="dashboard-stat__top">

                  <div className="dashboard-stat__label">
                    Estimate → Booking
                  </div>

                  <span className="dashboard-stat__marker" />

                </div>

                <div className="dashboard-stat__value">
                  {
                    cards.estimator_to_booking_rate
                  }%
                </div>

              </div>

            </div>

            {/* ==================================================
                CHART
            ================================================== */}

            {graphData &&
              graphData.length > 0 && (
                <section className="dashboard-panel">

                  <div className="dashboard-panel__header">

                    <h2 className="dashboard-panel__title">
                      Lead Volume vs Bookings
                    </h2>

                    <span className="dashboard-panel__meta">
                      {
                        TIMEFRAME_LABELS[
                          timeframe
                        ]
                      }
                    </span>

                  </div>

                  <div className="dashboard-chart">

                    <ResponsiveContainer>
                      <AreaChart
                        data={graphData}
                        margin={{
                          top: 10,
                          right: 20,
                          left: 0,
                          bottom: 10
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />

                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill:
                              '#6b7280'
                          }}
                          dy={8}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill:
                              '#6b7280'
                          }}
                        />

                        <Tooltip
                          cursor={{
                            fill:
                              '#f3f4f6'
                          }}
                          contentStyle={{
                            borderRadius: 8,
                            border:
                              '1px solid #e5e7eb',
                            boxShadow:
                              '0 10px 25px rgba(0,0,0,0.08)'
                          }}
                        />

                        <Legend />

                        <Area
                          dataKey="leads"
                          name="Estimator Leads"
                          type="monotone"
                          stroke="#6f6d65"
                          fill="#b9b7ae"
                          fillOpacity={0.35}
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#6f6d65' }}
                        />

                        <Area
                          dataKey="bookings"
                          name="Confirmed Bookings"
                          type="monotone"
                          stroke="#11110f"
                          fill="#f2cb05"
                          fillOpacity={0.38}
                          strokeWidth={2.5}
                          dot={{ r: 3.5, fill: '#f2cb05', stroke: '#11110f', strokeWidth: 1.5 }}
                        />

                      </AreaChart>
                    </ResponsiveContainer>

                  </div>

                </section>
              )}

            {/* ==================================================
                RECENT ACTIVITY
            ================================================== */}

            <section className="dashboard-panel">

              <div className="dashboard-panel__header">

                <h2 className="dashboard-panel__title">
                  Recent Activity
                </h2>

                <span className="dashboard-panel__meta">
                  Latest studio activity
                </span>

              </div>

              <div className="dashboard-activity">

                {recent_activity.length === 0 && (
                  <div className="dashboard-empty">
                    Nothing yet — new bookings
                    and estimator leads will
                    show up here.
                  </div>
                )}

                {recent_activity.map(
                  (item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="dashboard-activity__row"
                    >

                      <div className="dashboard-activity__main">

                        <span
                          className={`
                            dashboard-activity__badge
                            ${
                              item.type ===
                              'booking'
                                ? 'dashboard-activity__badge--booking'
                                : ''
                            }
                          `}
                        >
                          {item.type ===
                          'booking'
                            ? 'Booking'
                            : 'Lead'}
                        </span>

                        {item.type ===
                        'booking' ? (
                          <Link
                            to={`/admin/bookings/${item.id}`}
                            className="dashboard-activity__link"
                          >
                            {item.name}
                            {' · '}
                            {item.shoot_type}
                          </Link>
                        ) : (
                          <span className="dashboard-activity__lead">
                            {item.name}
                            {' · '}
                            {peso(
                              item.total
                            )}
                          </span>
                        )}

                      </div>

                      <span className="dashboard-activity__date">
                        {formatDateTime(
                          item.created_at
                        )}
                      </span>

                    </div>
                  )
                )}

              </div>

            </section>

          </div>

        </div>

      </section>
    </>
  )
}
