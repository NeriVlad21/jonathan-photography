import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Mail } from 'lucide-react'
import { peso } from '../utils/format.js'
import { estimatorApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from './LoadingState.jsx'
import PrivacyModal from './PrivacyModal.jsx'

const SERVICE_TYPES = [
  'Wedding', 'Engagement', 'Birthday', 'Debut', 'Christening',
  'Portrait', 'Event', 'Photo Booth', 'Photo & Video',
]

export default function Estimator({ estimator }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [sendingLead, setSendingLead] = useState(false)

  const { config, loading, serviceType, setServiceType, hourId, setHourId, addonIds, toggleAddon, total, breakdown } = estimator

  if (loading) return <LoadingState label="Loading the estimator…" />
  if (!config) return null

  const handleBookEstimate = () => {
    navigate('/booking', { state: { estimate: breakdown } })
  }

  // Step 1: Intercept the form submission and open the Privacy Modal instead
  const handleFormSubmit = (e) => {
    e.preventDefault()
    setPrivacyModalOpen(true)
  }

  // Step 2: Actually send the data ONLY after they accept the privacy policy
  const handleFinalSubmit = async () => {
    setPrivacyModalOpen(false)
    setSendingLead(true)
    try {
      await estimatorApi.saveLead({
        name: leadName,
        email: leadEmail,
        hours: breakdown.hours?.hours || null,
        service_type: serviceType,
        addons: breakdown.addons,
        total,
      })
      showToast("Sent — check your inbox for the breakdown.")
      setEmailModalOpen(false)
      setLeadName('')
      setLeadEmail('')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSendingLead(false)
    }
  }

  return (
    <div className="estimator-layout">
      <div>
        <div className="estimator-block">
          <div className="estimator-block__label">
            <h3 className="display">What are we shooting?</h3>
          </div>
          <div className="option-grid">
            {SERVICE_TYPES.map((s) => (
              <button
                key={s}
                type="button"
                className={`option-card ${serviceType === s ? 'option-card--selected' : ''}`}
                onClick={() => setServiceType(s)}
              >
                <strong>{s}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="estimator-block">
          <div className="estimator-block__label">
            <h3 className="display">Coverage Hours</h3>
          </div>
          <div className="option-grid">
            {config.hours.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`option-card ${hourId === h.id ? 'option-card--selected' : ''}`}
                onClick={() => setHourId(h.id)}
              >
                <strong>{h.label}</strong>
                <span>{peso(h.price)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="estimator-block">
          <div className="estimator-block__label">
            <h3 className="display">Add-ons</h3>
          </div>
          <div>
            {config.addons.map((a) => {
              const checked = addonIds.has(a.id)
              return (
                <div key={a.id} className="addon-row" onClick={() => toggleAddon(a.id)}>
                  <div className="addon-row__left">
                    <span className={`addon-row__checkbox ${checked ? 'addon-row__checkbox--checked' : ''}`}>
                      {checked && <Check size={13} color="#0A0A0A" />}
                    </span>
                    <div>
                      <div className="addon-row__name">{a.label}</div>
                      {a.description && <div className="addon-row__desc">{a.description}</div>}
                    </div>
                  </div>
                  <span className="addon-row__price">+{peso(a.price)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="estimate-summary">
        <h3>Your Estimate</h3>
        {breakdown.hours && (
          <div className="estimate-summary__line">
            <span>{breakdown.hours.label}</span>
            <span>{peso(breakdown.hours.price)}</span>
          </div>
        )}
        {breakdown.addons.map((a) => (
          <div className="estimate-summary__line" key={a.label}>
            <span>{a.label}</span>
            <span>{peso(a.price)}</span>
          </div>
        ))}
        {breakdown.addons.length === 0 && !breakdown.hours && (
          <div className="estimate-summary__line"><span>Select options to begin</span></div>
        )}

        <div className="estimate-summary__total">
          <span>Estimated Total</span>
          <strong>{peso(total)}</strong>
        </div>

        <p className="estimate-summary__disclaimer">
          This is an estimated baseline. We're happy to customize this package
          and negotiate terms to fit your budget during a consultation.
        </p>

        <div className="estimate-summary__actions">
          <button className="btn btn--primary btn--block" onClick={handleBookEstimate}>
            Book This Estimate
          </button>
          <button className="btn btn--ghost-dark btn--block" onClick={() => setEmailModalOpen(true)}>
            <Mail size={15} /> Email Me This Estimate
          </button>
        </div>
      </div>

      {/* Email Collection Modal */}
      {emailModalOpen && (
        <div className="modal-backdrop" onClick={() => setEmailModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Email this estimate</h3>
            <p>We'll send the full breakdown to your inbox — no obligation to book.</p>
            <form onSubmit={handleFormSubmit}>
              <div className="field">
                <label htmlFor="lead-name">Name</label>
                <input id="lead-name" required value={leadName} onChange={(e) => setLeadName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="lead-email">Email</label>
                <input id="lead-email" type="email" required value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} />
              </div>
              <div className="modal-card__actions">
                <button type="button" className="btn btn--ghost-light btn--sm" onClick={() => setEmailModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={sendingLead}>
                  {sendingLead ? 'Sending…' : 'Send Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Data Privacy Popup */}
      <PrivacyModal 
        isOpen={privacyModalOpen} 
        onClose={() => setPrivacyModalOpen(false)} 
        onAccept={handleFinalSubmit} 
      />
    </div>
  )
}