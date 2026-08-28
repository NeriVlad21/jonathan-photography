import { useEffect, useState } from 'react'
import { bookingsApi, estimatorApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import html2pdf from 'html2pdf.js'

const TIMEFRAMES = [
  { value: 'today', label: 'Today' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'all', label: 'All Time' }
]

export default function Archive() {
  const [activeTab, setActiveTab] = useState('bookings')
  const [timeframe, setTimeframe] = useState('last_year')
  const [data, setData] = useState(null)

  useEffect(() => {
    document.title = 'Admin — Archive & Storage'
    loadArchiveData()
  }, [activeTab, timeframe])

  const loadArchiveData = async () => {
    setData(null)

    try {
      if (activeTab === 'bookings') {
        const result = await bookingsApi.list({
          timeframe
        })

        setData(result || [])
      } else {
        const result = await estimatorApi.leads(
          timeframe
        )

        setData(result || [])
      }
    } catch (error) {
      console.error('Archive load failed:', error)
      setData([])
    }
  }

  const exportToPDF = () => {
    const element = document.getElementById(
      'archive-export-container'
    )

    if (!element) return

    const opt = {
      margin: 0.5,
      filename: `Archive_${activeTab}_${timeframe}.pdf`,
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

    html2pdf()
      .set(opt)
      .from(element)
      .save()
  }

  const timeframeLabel =
    TIMEFRAMES.find(
      (item) => item.value === timeframe
    )?.label || 'All Time'

  return (
    <>
      <header className="admin-header">
        <h1>Archive & Storage</h1>
      </header>

      <div
        className="admin-content"
        style={{ maxWidth: 1200 }}
      >
        <p
          style={{
            color: 'var(--c-gray)',
            marginBottom: 20
          }}
        >
          Central storage for historical studio
          records. Browse archived bookings and
          estimator leads by date range.
        </p>

        {/* Archive Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 15,
            marginBottom: 20,
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={() =>
                setActiveTab('bookings')
              }
              className={`btn ${
                activeTab === 'bookings'
                  ? 'btn--primary'
                  : 'btn--ghost-dark'
              }`}
            >
              Archived Bookings
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab('leads')
              }
              className={`btn ${
                activeTab === 'leads'
                  ? 'btn--primary'
                  : 'btn--ghost-dark'
              }`}
            >
              Archived Estimator Leads
            </button>
          </div>

          {/* Filter + PDF */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap'
            }}
          >
            <select
              value={timeframe}
              onChange={(e) =>
                setTimeframe(e.target.value)
              }
              style={{
                padding: '8px 12px',
                borderRadius: 4,
                border:
                  '1px solid var(--c-hairline)'
              }}
            >
              {TIMEFRAMES.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={exportToPDF}
              className="btn btn--primary"
            >
              Download PDF Report
            </button>
          </div>
        </div>

        {/* Storage Information */}
        <div
          className="admin-panel"
          style={{
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 15,
            flexWrap: 'wrap'
          }}
        >
          <div>
            <strong>
              {activeTab === 'bookings'
                ? 'Bookings Archive'
                : 'Estimator Leads Archive'}
            </strong>

            <div
              style={{
                color: 'var(--c-gray)',
                fontSize: '0.85rem',
                marginTop: 4
              }}
            >
              Showing records from:{' '}
              {timeframeLabel}
            </div>
          </div>

          <div
            style={{
              color: 'var(--c-gray)',
              fontSize: '0.85rem'
            }}
          >
            {data === null
              ? 'Loading...'
              : `${data.length} record${
                  data.length === 1 ? '' : 's'
                }`}
          </div>
        </div>

        {data === null && (
          <LoadingState label="Loading archive data…" />
        )}

        {data &&
          data.length === 0 && (
            <EmptyState
              title="No archived records found."
              body="Try selecting a broader timeframe."
            />
          )}

        {data &&
          data.length > 0 && (
            <div
              className="admin-panel"
              id="archive-export-container"
              style={{ padding: 10 }}
            >
              <h3
                className="pdf-title"
                style={{
                  marginBottom: 15,
                  display: 'none'
                }}
              >
                Jonathan Photography — Archive
                Report
              </h3>

              <div className="data-table-wrap">
                <table className="data-table">
                  {activeTab === 'bookings' ? (
                    <>
                      <thead>
                        <tr>
                          <th>Reference</th>
                          <th>Client</th>
                          <th>Shoot</th>
                          <th>Date</th>
                          <th>Estimate</th>
                          <th>Status</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.map((booking) => (
                          <tr
                            key={booking.id}
                          >
                            <td>
                              {
                                booking.reference_code
                              }
                            </td>

                            <td>
                              <strong>
                                {booking.name}
                              </strong>

                              <br />

                              <span
                                style={{
                                  color:
                                    'var(--c-gray)',
                                  fontSize:
                                    '0.8rem'
                                }}
                              >
                                {booking.email}
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
                                className={`status-badge status-badge--${booking.status}`}
                              >
                                {booking.status}
                              </span>
                            </td>

                            <td>
                              {formatDateTime(
                                booking.created_at
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  ) : (
                    <>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Hours</th>
                          <th>Service</th>
                          <th>Add-ons</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.map((lead) => {
                          let addons = []

                          try {
                            addons = JSON.parse(
                              lead.addons || '[]'
                            )
                          } catch {
                            addons = []
                          }

                          const status =
                            lead.status ||
                            (lead.booked_live
                              ? 'Booked'
                              : 'New')

                          return (
                            <tr key={lead.id}>
                              <td>
                                {lead.name}
                              </td>

                              <td>
                                {lead.email}
                              </td>

                              <td>
                                {lead.hours || '—'}
                              </td>

                              <td>
                                {lead.service_type ||
                                  '—'}
                              </td>

                              <td>
                                {addons.length
                                  ? addons
                                      .map(
                                        (addon) =>
                                          addon.label
                                      )
                                      .join(', ')
                                  : '—'}
                              </td>

                              <td>
                                {peso(lead.total)}
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
                        })}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            </div>
          )}
      </div>
    </>
  )
}