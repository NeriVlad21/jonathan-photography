import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import html2pdf from 'html2pdf.js'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [timeframe, setTimeframe] = useState('all')

  useEffect(() => {
    document.title = 'Admin — Dashboard'
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe])

  const loadStats = () => {
    setStats(null)
    // Passes the timeframe to the backend
    dashboardApi.stats(timeframe).then(setStats).catch(() => {})
  }

  const exportToPDF = () => {
    const element = document.getElementById('export-container')
    const opt = {
      margin: 0.5,
      filename: `Business_Dashboard_${timeframe}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    }
    html2pdf().set(opt).from(element).save()
  }

  if (!stats) return <LoadingState label="Loading dashboard…" />

  const { cards, recent_activity, chart_data } = stats

  return (
    <>
      <header className="admin-header"><h1>Dashboard</h1></header>
      <div className="admin-content">
        
        {/* Filters and Export Toolbar */}
        <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <div className="field" style={{ margin: 0 }}>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)} 
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--c-hairline)' }}
            >
              <option value="all">All Time / Archive</option>
              <option value="today">Today</option>
              <option value="last_week">Last Week</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="last_year">Last Year</option>
            </select>
          </div>
          <button onClick={exportToPDF} className="btn btn--primary" style={{ padding: '8px 16px' }}>
            Download PDF Report
          </button>
        </div>

        {/* PDF Export Container wrapping the stats, graph, and recent activity */}
        <div id="export-container" style={{ padding: '10px' }}>
          <h2 style={{ display: 'none', marginBottom: '15px' }} className="pdf-title">Business Dashboard Report</h2>
          
          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-card__label">Total Bookings</div>
              <div className="stat-card__value">{cards.total_bookings}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">New Bookings</div>
              <div className="stat-card__value">{cards.new_bookings}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Estimator Uses</div>
              <div className="stat-card__value">{cards.estimator_uses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Average Estimate</div>
              <div className="stat-card__value">{peso(cards.average_estimate)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">Estimate → Booking</div>
              <div className="stat-card__value">{cards.estimator_to_booking_rate}%</div>
            </div>
          </div>

          {/* Business Analytics Graph */}
          {chart_data && chart_data.length > 0 && (
            <div className="admin-panel" style={{ marginTop: '30px', padding: '20px' }}>
              <div className="admin-panel__head" style={{ marginBottom: '20px' }}>
                <h2>Lead Volume vs Bookings</h2>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={chart_data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="leads" name="Estimator Leads" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bookings" name="Confirmed Bookings" fill="#111827" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="admin-panel" style={{ marginTop: '30px' }}>
            <div className="admin-panel__head"><h2>Recent Activity</h2></div>
            <div className="admin-panel__body">
              {recent_activity.length === 0 && <p style={{ color: 'var(--c-gray)' }}>Nothing yet — new bookings and estimator leads will show up here.</p>}
              {recent_activity.map((item) => (
                <div key={`${item.type}-${item.id}`} className="inline-edit-row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ color: item.type === 'booking' ? '#111827' : '#6b7280' }}>
                      {item.type === 'booking' ? 'New booking' : 'Estimator lead'}
                    </strong>
                    {' — '}
                    {item.type === 'booking' ? (
                      <Link to={`/admin/bookings/${item.id}`} className="text-link" style={{ color: 'inherit', borderColor: 'var(--c-hairline)' }}>
                        {item.name} ({item.shoot_type})
                      </Link>
                    ) : (
                      <span>{item.name} — {peso(item.total)}</span>
                    )}
                  </div>
                  <span style={{ color: 'var(--c-gray)', fontSize: '0.82rem' }}>{formatDateTime(item.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}