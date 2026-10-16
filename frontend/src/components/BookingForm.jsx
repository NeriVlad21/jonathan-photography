import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { bookingsApi } from '../services/api.js'
import { peso, formatDate } from '../utils/format.js'
import { useToast } from '../context/ToastContext.jsx'
import AvailabilityCalendar from './AvailabilityCalendar.jsx'
import { clearBookingEstimate } from '../utils/bookingEstimate.js'
import { clearBookingDraft, readBookingDraft, saveBookingDraft } from '../utils/bookingDraft.js'

const initialState = {
  name: '', email: '', phone: '', facebook: '',
  shoot_type: '', preferred_date: '', preferred_time: '', location: '', guest_count: '', message: '',
  privacy_agreed: false,
  website: ''
}

export default function BookingForm({ estimate, onChangeEstimate, onReviewChange }) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState(() => ({
    ...initialState,
    ...readBookingDraft(),
    shoot_type: estimate.service.name,
    privacy_agreed: false
  }))
  const [errors, setErrors] = useState({})
  const [reviewing, setReviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionNote, setSubmissionNote] = useState('')
  const submissionToken = useRef(
    globalThis.crypto?.randomUUID?.() || `${Date.now().toString(16)}${Array.from(globalThis.crypto?.getRandomValues?.(new Uint32Array(4)) || [1, 2, 3, 4], (value) => value.toString(16)).join('')}`
  )

  useEffect(() => {
    saveBookingDraft(form)
  }, [form])

  useEffect(() => () => onReviewChange?.(false), [onReviewChange])

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.preferred_date) nextErrors.preferred_date = 'Please choose an available preferred date.'
    if (!form.name.trim()) nextErrors.name = 'Please provide your full name.'
    if (!form.email.trim()) nextErrors.email = 'Please provide your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Please enter a valid email address.'
    if (!form.phone.trim()) nextErrors.phone = 'Please provide your phone number.'
    if (!form.facebook.trim()) nextErrors.facebook = 'Please provide your Facebook profile link.'
    if (!form.privacy_agreed) nextErrors.privacy_agreed = 'Please agree to the data privacy notice before continuing.'
    return nextErrors
  }

  const openReview = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      showToast('Please complete the highlighted required fields.', 'error')
      // Take keyboard and screen-reader users straight to the first problem.
      const firstField = ['preferred_date', 'name', 'email', 'phone', 'facebook', 'privacy_agreed'].find((key) => nextErrors[key])
      window.requestAnimationFrame(() => {
        const target = firstField === 'preferred_date' ? document.querySelector('.availability-picker') : document.getElementById(firstField)
        target?.scrollIntoView({ block: 'center' })
        const focusTarget = firstField === 'preferred_date' ? target?.querySelector('button:not([disabled])') : target
        focusTarget?.focus({ preventScroll: true })
      })
      return
    }
    setReviewing(true)
    onReviewChange?.(true)
    // Land on the review itself so "Send Booking Request" is in view.
    window.requestAnimationFrame(() => {
      document.querySelector('.booking-review')?.scrollIntoView({ block: 'start' })
      document.getElementById('booking-review-title')?.focus({ preventScroll: true })
    })
  }

  const editDetails = () => {
    setReviewing(false)
    onReviewChange?.(false)
    window.requestAnimationFrame(() => document.getElementById('booking-details')?.scrollIntoView({ behavior: 'smooth' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!reviewing) return openReview(event)

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return editDetails()

    setSubmitting(true)
    setSubmissionNote('Saving your request… Please keep this page open.')
    try {
      const data = await bookingsApi.create({
        ...form,
        submission_token: submissionToken.current,
        estimate_total: estimate?.total || null,
        estimate_breakdown: estimate || null
      })
      clearBookingDraft()
      clearBookingEstimate()
      navigate('/booking/success', { state: { name: form.name, reference: data.reference } })
    } catch (err) {
      let recovered = null
      if (err.status === 0) {
        setSubmissionNote('Checking whether your request was saved…')
        for (let attempt = 0; attempt < 3 && !recovered?.saved; attempt += 1) {
          if (attempt > 0) await new Promise((resolve) => window.setTimeout(resolve, 900))
          try {
            recovered = await bookingsApi.requestStatus(submissionToken.current)
          } catch { /* Preserve the original request error. */ }
        }
      }

      if (recovered?.saved) {
        clearBookingDraft()
        clearBookingEstimate()
        navigate('/booking/success', { state: { name: form.name, reference: recovered.reference } })
        return
      }

      setSubmissionNote('')
      showToast(err.message, 'error')
      if (err.errors) setErrors((current) => ({ ...current, ...err.errors }))
    } finally {
      setSubmitting(false)
    }
  }

  const estimateLines = [
    estimate.service && { label: estimate.service.name, value: peso(estimate.service.price) },
    estimate.hours && { label: `${estimate.hours.label} coverage`, value: Number(estimate.hours.price || 0) > 0 ? `+${peso(estimate.hours.price)}` : 'Included' },
    ...(estimate.addons || []).map((addon) => ({
      label: `${Number(addon.quantity || 1) > 1 ? `${addon.quantity}× ` : ''}${addon.label}`,
      value: peso(addon.total ?? addon.price)
    }))
  ].filter(Boolean)

  return (
    <div className="booking-layout" id="booking-details">
      <form onSubmit={handleSubmit} noValidate>
        <div className="booking-honeypot" aria-hidden="true">
          <label htmlFor="website">Leave this field empty</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
        </div>

        {reviewing ? (
          <section className="booking-review" aria-labelledby="booking-review-title">
            <div className="booking-review__heading">
              <CheckCircle2 size={28} aria-hidden="true" />
              <div>
                <span className="eyebrow">Final check</span>
                <h3 className="display" id="booking-review-title" tabIndex={-1}>Review Your Request</h3>
                <p>Nothing is sent until you select “Send Booking Request.”</p>
              </div>
            </div>

            <div className="booking-review__grid">
              <article>
                <h4>Event</h4>
                <dl>
                  <div><dt>Service</dt><dd>{form.shoot_type}</dd></div>
                  <div><dt>Date</dt><dd>{formatDate(form.preferred_date)}</dd></div>
                  <div><dt>Time</dt><dd>{form.preferred_time || 'To be discussed'}</dd></div>
                  <div><dt>Location</dt><dd>{form.location || 'To be discussed'}</dd></div>
                  <div><dt>Guests</dt><dd>{form.guest_count || 'Not provided'}</dd></div>
                  <div><dt>Notes</dt><dd>{form.message || 'No additional notes'}</dd></div>
                </dl>
              </article>
              <article>
                <h4>Contact</h4>
                <dl>
                  <div><dt>Name</dt><dd>{form.name}</dd></div>
                  <div><dt>Email</dt><dd>{form.email}</dd></div>
                  <div><dt>Phone</dt><dd>{form.phone}</dd></div>
                  <div><dt>Facebook</dt><dd>{form.facebook}</dd></div>
                </dl>
              </article>
            </div>

            <div className="booking-review__notice">
              This submits a booking request, not a confirmed reservation. The studio will contact you to discuss and confirm the final details.
            </div>
            <div className="booking-review__actions">
              <button type="button" className="btn btn--outline" onClick={editDetails} disabled={submitting}>
                <ArrowLeft size={17} aria-hidden="true" /> Edit Details
              </button>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                <Send size={17} aria-hidden="true" /> {submitting ? 'Saving Request…' : 'Send Booking Request'}
              </button>
            </div>
            {submissionNote && <p className="booking-submit-note" role="status" aria-live="polite">{submissionNote}</p>}
          </section>
        ) : (
          <>
            <h4 className="fieldset-title display">Choose Your Date</h4>
            <p className="booking-section-intro">Check availability first. Your selected date will stay saved while you complete the remaining details.</p>
            <div className="booking-schedule-row">
              <div className="booking-request-fields">
                <div className="field">
                  <label htmlFor="shoot_type">Shoot Type (from your estimate)</label>
                  <input id="shoot_type" value={form.shoot_type} readOnly />
                  <button type="button" className="field-help-link" onClick={onChangeEstimate}>Change estimate</button>
                </div>
                <div className="booking-date-instruction">
                  <span>Preferred date</span>
                  <strong>{form.preferred_date ? formatDate(form.preferred_date) : 'Not selected'}</strong>
                  <p>Select a green day. Grey dates already have a scheduled or pending request.</p>
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

            <h4 className="fieldset-title display">Event Details</h4>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="preferred_time">Preferred Start Time <span className="field-optional">Optional</span></label>
                <input id="preferred_time" type="time" value={form.preferred_time} onChange={update('preferred_time')} />
                <small>The studio will confirm the exact schedule with you.</small>
              </div>
              <div className="field">
                <label htmlFor="location">Location <span className="field-optional">Optional</span></label>
                <input id="location" value={form.location} onChange={update('location')} placeholder="Venue or city" />
              </div>
              <div className="field">
                <label htmlFor="guest_count">Estimated Guest Count <span className="field-optional">Optional</span></label>
                <input id="guest_count" value={form.guest_count} onChange={update('guest_count')} placeholder="e.g. 80–100" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="message">Message / Requirements <span className="field-optional">Optional</span></label>
              <textarea id="message" value={form.message} onChange={update('message')} placeholder="Tell us anything useful about the event or the photographs you want." />
            </div>

            <h4 className="fieldset-title display">Your Contact Details</h4>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="name">Full Name</label>
                <input id="name" autoComplete="name" className={errors.name ? 'has-error' : ''} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} value={form.name} onChange={update('name')} />
                {errors.name && <span className="field-error" id="name-error">{errors.name}</span>}
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" className={errors.email ? 'has-error' : ''} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} value={form.email} onChange={update('email')} />
                {errors.email && <span className="field-error" id="email-error">{errors.email}</span>}
              </div>
              <div className="field">
                <label htmlFor="phone">Phone Number</label>
                <input id="phone" type="tel" autoComplete="tel" className={errors.phone ? 'has-error' : ''} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} value={form.phone} onChange={update('phone')} />
                {errors.phone && <span className="field-error" id="phone-error">{errors.phone}</span>}
              </div>
              <div className="field">
                <label htmlFor="facebook">Facebook Profile Link</label>
                <input id="facebook" type="url" required className={errors.facebook ? 'has-error' : ''} aria-invalid={Boolean(errors.facebook)} aria-describedby={errors.facebook ? 'facebook-error' : undefined} value={form.facebook} onChange={update('facebook')} placeholder="https://facebook.com/yourname" />
                {errors.facebook && <span className="field-error" id="facebook-error">{errors.facebook}</span>}
              </div>
            </div>

            <h4 className="fieldset-title display">Data Privacy Agreement</h4>
            <div className="field">
              <div className="booking-privacy-policy">
                <strong>Data Privacy Policy</strong>
                <p>By submitting this form, you consent to the collection and processing of your personal information in accordance with the Data Privacy Act of 2012.</p>
                <p>We use this data solely to communicate with you regarding your booking inquiry, provide accurate estimates, and deliver our photography services.</p>
                <p>Your information is stored in the studio system. Authorized studio personnel and the platform operator may access request and booking records when necessary for service delivery, security, technical support, and accountable platform oversight. Contact details are masked by default during platform oversight and every reveal is logged.</p>
              </div>
              <label className="checkbox-row booking-privacy-consent" htmlFor="privacy_agreed">
                <input id="privacy_agreed" type="checkbox" checked={form.privacy_agreed} onChange={update('privacy_agreed')} aria-invalid={Boolean(errors.privacy_agreed)} aria-describedby={errors.privacy_agreed ? 'privacy_agreed-error' : undefined} />
                <span>
                  I have read and agree to the Data Privacy Policy.
                  {errors.privacy_agreed && <span className="field-error" id="privacy_agreed-error">{errors.privacy_agreed}</span>}
                </span>
              </label>
            </div>

            <button type="submit" className="btn btn--primary">Review Your Request</button>
            <p className="booking-draft-note" role="status">Your unfinished details are saved temporarily in this browser tab.</p>
          </>
        )}
      </form>

      <aside className="booking-summary-card">
        <h4>Your Estimate</h4>
        <div>
          {estimateLines.map((line) => (
            <div className="estimate-summary__line" key={line.label}>
              <span>{line.label}</span><span>{line.value}</span>
            </div>
          ))}
          <div className="estimate-summary__total">
            <span>Total</span><strong>{peso(estimate.total)}</strong>
          </div>
          <p className="booking-summary-card__note">This is a preliminary estimate. The studio will review it before confirming the final quotation.</p>
        </div>
      </aside>
    </div>
  )
}
