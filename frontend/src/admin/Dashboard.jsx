import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api.js'
import { peso, formatDateTime } from '../utils/format.js'
import LoadingState from '../components/LoadingState.jsx'
import html2pdf from 'html2pdf.js'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
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

  useEffect(() => {
    document.title = 'Admin — Dashboard'
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe])

  const loadStats = () => {
    setStats(null)
    dashboardApi.stats(timeframe).then(setStats).catch(() => {})
  }

  const exportToPDF = () => {
    const element = document.getElementById('export-container')
    const header = document.getElementById('pdf-header')
    
    // Briefly show the header so html2canvas can capture it
    if (header) header.style.display = 'block'

    const opt = {
      margin: 0.5,
      filename: `Business_Dashboard_${timeframe}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    }
    
    html2pdf().set(opt).from(element).save().then(() => {
      // Hide it again immediately after processing
      if (header) header.style.display = 'none'
    })
  }

  if (!stats) return <LoadingState label="Loading dashboard…" />

  const { cards, recent_activity, chart_data } = stats

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>Overview of your studio's performance.</p>
        </div>
      </header>
      
      <div className="admin-content">
        
        {/* Filters and Export Toolbar */}
        <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '8px', border: '1px solid var(--c-hairline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#4b5563' }}>Filter Data:</span>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)} 
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#f9fafb', outline: 'none', cursor: 'pointer' }}
            >
              <option value="today">Today</option>
              <option value="last_week">Last Week</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="last_year">Last Year</option>
              <option value="all">All Time / Archive</option>
            </select>
          </div>
          <button onClick={exportToPDF} className="btn btn--primary" style={{ padding: '8px 20px' }}>
            Download PDF Report
          </button>
        </div>

        {/* PDF Export Container */}
        <div id="export-container" style={{ padding: '10px' }}>
          
          {/* Dynamic PDF Header */}
          <div id="pdf-header" style={{ display: 'none', marginBottom: '25px', borderBottom: '2px solid #111827', paddingBottom: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#111827' }}>Business Dashboard Report</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#4b5563', fontSize: '0.95rem' }}>
              <span><strong>Timeframe:</strong> {TIMEFRAME_LABELS[timeframe]}</span>
              <span><strong>Generated:</strong> {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          
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
            <div className="admin-panel" style={{ marginTop: '30px', padding: '25px' }}>
              <div className="admin-panel__head" style={{ marginBottom: '25px' }}>
                <h2 style={{ fontSize: '1.2rem' }}>Lead Volume vs Bookings</h2>
              </div>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={chart_data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
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
            <div className="admin-panel__head" style={{ padding: '20px 25px' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Recent Activity</h2>
            </div>
            <div className="admin-panel__body" style={{ padding: 0 }}>
              {recent_activity.length === 0 && (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
                  Nothing yet — new bookings and estimator leads will show up here.
                </div>
              )}
              {recent_activity.map((item) => (
                <div key={`${item.type}-${item.id}`} className="inline-edit-row" style={{ padding: '15px 25px', borderBottom: '1px solid #f3f4f6', margin: 0 }}>
                  <div>
                    <span style={{ 
                      display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginRight: '12px',
                      background: item.type === 'booking' ? '#111827' : '#f3f4f6', color: item.type === 'booking' ? '#fff' : '#4b5563'
                    }}>
                      {item.type === 'booking' ? 'Booking' : 'Lead'}
                    </span>
                    {item.type === 'booking' ? (
                      <Link to={`/admin/bookings/${item.id}`} className="text-link" style={{ color: '#111827', fontWeight: '500', textDecoration: 'none' }}>
                        {item.name} ({item.shoot_type})
                      </Link>
                    ) : (
                      <span style={{ color: '#4b5563' }}>{item.name} — {peso(item.total)}</span>
                    )}
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{formatDateTime(item.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}