import { useEffect } from 'react'
import BookingFormComponent from '../components/BookingForm.jsx'
import PageHero from '../components/PageHero.jsx'

export default function Booking() {
  useEffect(() => {
    document.title = 'Jonathan Photography — Booking Request'
  }, [])

  return (
    <>
      <PageHero
        eyebrow="Booking / 04"
        title="Tell us what you are planning."
        intro="Share the date, place, and feeling you have in mind. We review every request personally before confirming availability."
        note="Request, not reservation"
      />
      <section className="page-content">
        <div className="container">
          <BookingFormComponent />
        </div>
      </section>
    </>
  )
}
