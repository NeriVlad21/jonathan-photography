import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { bookingsApi } from '../services/api.js'
import { peso, formatDate } from '../utils/format.js'
import { useToast } from '../context/ToastContext.jsx'

const SHOOT_TYPES = [
  'Wedding', 'Engagement', 'Birthday', 'Christening', 'Debut',
  'Burial', 'Event', 'Portrait', 'Photo Booth', 'Photo & Video', 'Other',
]

const initialState = {
  name: '', email: '', phone: '', facebook: '',
  shoot_type: '', preferred_date: '', location: '', guest_count: '', message: '',
  privacy_agreed: false,
  website: '', // honeypot
}

export default function BookingForm() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const estimate = location.state?.estimate || null

  const [form, setForm] = useState({
    ...initialState,
    shoot_type: estimate?.service_type || '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Please provide your full name.'
    if (!form.email.trim()) errs.email = 'Please provide your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email address.'
    if (!form.phone.trim()) errs.phone = 'Please provide your phone number.'
    if (!form.shoot_type) errs.shoot_type = 'Please select a shoot type.'
    if (!form.message.trim()) errs.message = 'Please tell us a little about what you need.'
    if (!form.privacy_agreed) errs.privacy_agreed = 'Please agree to the data privacy notice before continuing.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        estimate_total: estimate?.total ?? null,
        estimate_breakdown: estimate || null,
      }
      const data = await bookingsApi.create(payload)
      navigate('/booking/success', { state: { name: form.name, reference: data.reference } })
    } catch (err) {
      showToast(err.message, 'error')
      if (err.errors) setErrors((e2) => ({ ...e2, ...err.errors }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="booking-layout">
      <form onSubmit={handleSubmit} noValidate>
        {/* Honeypot — hidden from real visitors via CSS, bots often fill every field. */}
        <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
          <label htmlFor="website">Leave this field empty</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
        </div>

        <h4 className="fieldset-title display">Your Details</h4>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input id="name" className={errors.name ? 'has-error' : ''} value={form.name} onChange={update('name')} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className={errors.email ? 'has-error' : ''} value={form.email} onChange={update('email')} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" className={errors.phone ? 'has-error' : ''} value={form.phone} onChange={update('phone')} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
          <div className="field">
            <label htmlFor="facebook">Facebook Profile (optional)</label>
            <input id="facebook" value={form.facebook} onChange={update('facebook')} placeholder="facebook.com/yourname" />
          </div>
        </div>

        <h4 className="fieldset-title display">The Shoot</h4>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="shoot_type">Shoot Type</label>
            <select id="shoot_type" className={errors.shoot_type ? 'has-error' : ''} value={form.shoot_type} onChange={update('shoot_type')}>
              <option value="">Select one</option>
              {SHOOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.shoot_type && <span className="field-error">{errors.shoot_type}</span>}
          </div>
          <div className="field">
            <label htmlFor="preferred_date">Preferred Date</label>
            <input id="preferred_date" type="date" value={form.preferred_date} onChange={update('preferred_date')} />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="location">Location</label>
            <input id="location" value={form.location} onChange={update('location')} placeholder="Venue or city" />
          </div>
          <div className="field">
            <label htmlFor="guest_count">Estimated Guest Count</label>
            <input id="guest_count" value={form.guest_count} onChange={update('guest_count')} placeholder="e.g. 80–100" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="message">Message / Requirements</label>
          <textarea id="message" className={errors.message ? 'has-error' : ''} value={form.message} onChange={update('message')} placeholder="Tell us about the day, the vibe, anything we should know." />
          {errors.message && <span className="field-error">{errors.message}</span>}
        </div>

        <label className="checkbox-row" htmlFor="privacy_agreed" style={{ marginTop: 10, marginBottom: 24 }}>
          <input id="privacy_agreed" type="checkbox" checked={form.privacy_agreed} onChange={update('privacy_agreed')} />
          <span>
            I agree to the collection and use of my information for the purpose of responding to my booking request.
            {errors.privacy_agreed && <><br /><span className="field-error">{errors.privacy_agreed}</span></>}
          </span>
        </label>

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Sending Request…' : 'Send Booking Request'}
        </button>
      </form>

      <aside className="booking-summary-card">
        <h4>{estimate ? 'Your Estimate' : 'This is a request, not a reservation'}</h4>
        {estimate ? (
          <>
            {estimate.hours && (
              <div className="estimate-summary__line" style={{ color: '#1A1A1A', borderColor: 'var(--c-hairline)' }}>
                <span>{estimate.hours.label}</span><span>{peso(estimate.hours.price)}</span>
              </div>
            )}
            {estimate.addons.map((a) => (
              <div className="estimate-summary__line" style={{ color: '#1A1A1A', borderColor: 'var(--c-hairline)' }} key={a.label}>
                <span>{a.label}</span><span>{peso(a.price)}</span>
              </div>
            ))}
            <div className="estimate-summary__total" style={{ color: '#0A0A0A' }}>
              <span>Total</span><strong style={{ color: '#0A0A0A' }}>{peso(estimate.total)}</strong>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--c-gray)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Submitting this form sends us an inquiry — it doesn't lock in a date.
            We'll personally review your request and follow up to confirm availability.
          </p>
        )}
      </aside>
    </div>
  )
}
