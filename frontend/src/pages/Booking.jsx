import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BookingFormComponent from '../components/BookingForm.jsx'
import EstimatorComponent from '../components/Estimator.jsx'
import PageHero from '../components/PageHero.jsx'
import { useEstimator } from '../hooks/useEstimator.js'
import { clearBookingEstimate, isBookingEstimate, readBookingEstimate } from '../utils/bookingEstimate.js'

export default function Booking() {
  const location = useLocation()
  const navigate = useNavigate()
  const estimator = useEstimator()
  const routeEstimate = location.state?.estimate
  const [estimate, setEstimate] = useState(() => isBookingEstimate(routeEstimate)
    ? routeEstimate
    : readBookingEstimate())

  useEffect(() => {
    if (isBookingEstimate(routeEstimate)) setEstimate(routeEstimate)
  }, [routeEstimate])

  useEffect(() => {
    document.title = 'Jonathan Photography — Booking Request'
  }, [])

  return (
    <>
      <PageHero
        eyebrow="Estimate + Booking / 04"
        title={estimate ? 'Tell us what you are planning.' : 'Build your package, then request a date.'}
        intro={estimate
          ? 'Your estimate is ready. Add your contact and event details so the studio can review the complete request.'
          : 'Choose your service, coverage, and extras. Continue only if you want to request a session—the estimate remains yours with no obligation to book.'}
        note={estimate ? 'Step 2 of 2 · Booking request' : 'Step 1 of 2 · Package estimate'}
      />
      <section className="page-content">
        <div className="container">
          {estimate ? (
            <BookingFormComponent
              estimate={estimate}
              onChangeEstimate={() => {
                clearBookingEstimate()
                setEstimate(null)
                navigate('/booking', { replace: true, state: null })
              }}
            />
          ) : (
            <div className="combined-booking-estimator">
              <div className="combined-booking-estimator__note">
                <strong>Estimate freely.</strong>
                <span>Email the result to yourself or continue to a booking request when you are ready.</span>
              </div>
              <EstimatorComponent estimator={estimator} />
            </div>
          )}
        </div>
      </section>
    </>
  )
}
