import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarCheck, ReceiptText } from 'lucide-react'
import Bookings from './Bookings.jsx'
import EstimatorLeads from './EstimatorLeads.jsx'

export default function ClientRequests() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') === 'estimates' ? 'estimates' : 'bookings'

  useEffect(() => {
    document.title = 'Admin — Client Requests'
  }, [view])

  const selectView = (nextView) => {
    const next = new URLSearchParams(searchParams)
    if (nextView === 'bookings') next.delete('view')
    else next.set('view', 'estimates')
    setSearchParams(next, { replace: true })
  }

  return (
    <section className="client-requests-page">
      <div className="admin-content client-requests-content">
        <header className="client-requests-hero">
          <div>
            <span className="client-requests-eyebrow">One client journey</span>
            <h2 className="display">Client Requests</h2>
            <p>Review saved estimates and complete booking requests without losing where each client is in the process.</p>
          </div>

          <div className="client-requests-legend" aria-label="Request stages">
            <span>Estimate saved</span><i aria-hidden="true" />
            <span>Booking requested</span><i aria-hidden="true" />
            <span>Confirmed</span>
          </div>
        </header>

        <div className="client-requests-tabs" role="tablist" aria-label="Client request type">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'bookings'}
            className={view === 'bookings' ? 'is-active' : ''}
            onClick={() => selectView('bookings')}
          >
            <CalendarCheck size={18} />
            <span><strong>Booking requests</strong><small>Clients who selected a date and submitted their details</small></span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'estimates'}
            className={view === 'estimates' ? 'is-active' : ''}
            onClick={() => selectView('estimates')}
          >
            <ReceiptText size={18} />
            <span><strong>Saved estimates</strong><small>Potential clients who emailed themselves a package</small></span>
          </button>
        </div>

        <div className="client-requests-view" role="tabpanel">
          {view === 'bookings' ? <Bookings /> : <EstimatorLeads />}
        </div>
      </div>
    </section>
  )
}
