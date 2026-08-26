import { useEffect } from 'react'
import BookingFormComponent from '../components/BookingForm.jsx'

export default function Booking() {
  useEffect(() => {
    document.title = 'Jonathan Photography — Booking Request'
  }, [])

  return (
    <section className="section" style={{ paddingTop: 'clamp(120px, 16vw, 180px)' }}>
      <div className="container">
        <span className="eyebrow">Request, Not Reservation</span>
        <h1 className="display" style={{ fontSize: 'var(--fluid-h1)', margin: '14px 0 20px' }}>Book a Session</h1>
        <p style={{ color: 'var(--c-gray)', maxWidth: '56ch', fontSize: '1.05rem', marginBottom: 56 }}>
          Tell us about your day. We personally review every request and follow
          up to confirm details and availability — this doesn't lock in a date yet.
        </p>
        <BookingFormComponent />
      </div>
    </section>
  )
}
