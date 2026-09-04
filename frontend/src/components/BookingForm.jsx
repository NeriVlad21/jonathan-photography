import React, { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { bookingsApi } from '../services/api.js'
import { peso, formatDate } from '../utils/format.js'
import { useToast } from '../context/ToastContext.jsx'
import AvailabilityCalendar from './AvailabilityCalendar.jsx'

const SHOOT_TYPES = [
  'Wedding', 'Engagement', 'Birthday', 'Christening', 'Debut',
  'Burial', 'Event', 'Portrait', 'Photo Booth', 'Photo & Video', 'Other'
]

const initialState = {
  name: '', email: '', phone: '', facebook: '',
  shoot_type: '', preferred_date: '', location: '', guest_count: '', message: '',
  privacy_agreed: false,
  website: '' // honeypot
}

export default function BookingForm() {
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const estimate = location.state?.estimate || null

  const [form, setForm] = useState({
    ...initialState,
    shoot_type: estimate?.service_type || ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  
  // Privacy Scroll State
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)
  const privacyRef = useRef(null)

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handlePrivacyScroll = () => {
    if (!privacyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = privacyRef.current;
    // Check if user has scrolled to the bottom (with a 2px buffer for rendering decimals)
    if (scrollTop + clientHeight >= scrollHeight - 2) {
      setIsScrolledToBottom(true);
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Please provide your full name.'
    if (!form.email.trim()) errs.email = 'Please provide your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Please enter a valid email address.'
    if (!form.phone.trim()) errs.phone = 'Please provide your phone number.'
    if (!form.shoot_type) errs.shoot_type = 'Please select a shoot type.'
    if (!form.preferred_date) errs.preferred_date = 'Please choose an available preferred date.'
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
        estimate_total: estimate?.total || null,
        estimate_breakdown: estimate || null
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
        <div className="booking-schedule-row">
          <div className="booking-request-fields">
            <div className="field">
              <label htmlFor="shoot_type">Shoot Type</label>
              <select id="shoot_type" className={errors.shoot_type ? 'has-error' : ''} value={form.shoot_type} onChange={update('shoot_type')}>
                <option value="">Select one</option>
                {SHOOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.shoot_type && <span className="field-error">{errors.shoot_type}</span>}
            </div>
            <div className="booking-date-instruction">
              <span>Preferred date</span>
              <strong>{form.preferred_date ? formatDate(form.preferred_date) : 'Not selected'}</strong>
              <p>Select a green day from the calendar. Grey dates are already booked.</p>
            </div>
          </div>
          <AvailabilityCalendar
            value={form.preferred_date}
            onChange={(preferredDate) => {
              setForm((current) => ({ ...current, preferred_date: preferredDate }))
              setErrors((current) => ({ ...current, preferred_date: '' }))
            }}
            error={errors.preferred_date}
          />
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

        <h4 className="fieldset-title display">Data Privacy Agreement</h4>
        <div className="field">
          <div 
            ref={privacyRef} 
            onScroll={handlePrivacyScroll}
            style={{ 
              maxHeight: '150px', 
              overflowY: 'scroll', 
              padding: '1rem', 
              border: '1px solid var(--c-hairline, #e5e5e5)', 
              borderRadius: '4px',
              backgroundColor: '#fafafa',
              fontSize: '0.85rem',
              lineHeight: '1.6'
            }}
          >
            <strong>Data Privacy Policy</strong>
            <p style={{ marginTop: '0.5rem' }}>By submitting this form, you consent to the collection and processing of your personal information in accordance with the Data Privacy Act of 2012.</p>
            <p style={{ marginTop: '0.5rem' }}>We use this data solely to communicate with you regarding your booking inquiry, provide accurate estimates, and deliver our photography services.</p>
            <p style={{ marginTop: '0.5rem' }}>Your information will be securely stored within our internal system and will not be shared, sold, or distributed to any third parties without your explicit, written consent.</p>
            <br/><br/><br/>
            <p style={{ color: 'var(--c-gray)' }}><em>Please scroll to the bottom to acknowledge and enable the agreement checkbox.</em></p>
          </div>

          <label 
            className="checkbox-row" 
            htmlFor="privacy_agreed" 
            style={{ 
              marginTop: 12, 
              marginBottom: 24, 
              cursor: isScrolledToBottom ? 'pointer' : 'not-allowed',
              opacity: isScrolledToBottom ? 1 : 0.6 
            }}
          >
            <input 
              id="privacy_agreed" 
              type="checkbox" 
              disabled={!isScrolledToBottom}
              checked={form.privacy_agreed} 
              onChange={update('privacy_agreed')} 
            />
            <span>
              I have read and agree to the Data Privacy Policy.
              {!isScrolledToBottom && (
                <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '4px', color: '#dc2626' }}>
                  (Please scroll through the policy above to enable this checkbox)
                </span>
              )}
              {errors.privacy_agreed && (
                <span className="field-error" style={{ display: 'block', marginTop: '4px' }}>
                  {errors.privacy_agreed}
                </span>
              )}
            </span>
          </label>
        </div>

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Sending Request…' : 'Send Booking Request'}
        </button>
      </form>

      <aside className="booking-summary-card">
        <h4>{estimate ? 'Your Estimate' : 'This is a request, not a reservation'}</h4>
        {estimate ? (
          <div>
            {estimate.hours && (
              <div className="estimate-summary__line" style={{ color: '#1A1A1A', borderColor: 'var(--c-hairline)' }}>
                <span>{estimate.hours.label}</span><span>{peso(estimate.hours.price)}</span>
              </div>
            )}
            {estimate.addons && estimate.addons.map((a) => (
              <div className="estimate-summary__line" style={{ color: '#1A1A1A', borderColor: 'var(--c-hairline)' }} key={a.label}>
                <span>{a.label}</span><span>{peso(a.price)}</span>
              </div>
            ))}
            <div className="estimate-summary__total" style={{ color: '#0A0A0A' }}>
              <span>Total</span><strong style={{ color: '#0A0A0A' }}>{peso(estimate.total)}</strong>
            </div>
          </div>
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
