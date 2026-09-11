import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BadgeCheck, Calculator, MessageCircleMore, Send } from 'lucide-react'
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
      <section className="page-content" id="estimator">
        <div className="container">
          <section className="booking-workflow" aria-labelledby="booking-workflow-title">
            <div className="booking-workflow__intro">
              <span className="eyebrow">Before you begin</span>
              <h2 className="display" id="booking-workflow-title">From estimate to a confirmed session.</h2>
              <p>This page helps you plan a package and send the studio the information needed to discuss your event. It does not instantly reserve a date or create a final agreement.</p>
            </div>

            <ol className="booking-workflow__steps">
              <li>
                <span className="booking-workflow__number">01</span>
                <Calculator size={21} aria-hidden="true" />
                <strong>Build an estimate</strong>
                <p>Choose an occasion, coverage time, and optional add-ons. The amount shown is a planning estimate—not a guaranteed final price.</p>
              </li>
              <li>
                <span className="booking-workflow__number">02</span>
                <Send size={21} aria-hidden="true" />
                <strong>Send a request</strong>
                <p>Add your preferred date and contact details, then submit. This sends a booking request for review; it is not yet a confirmed booking.</p>
              </li>
              <li>
                <span className="booking-workflow__number">03</span>
                <MessageCircleMore size={21} aria-hidden="true" />
                <strong>Discuss the details</strong>
                <p>The studio may contact you using the details provided, or you can reach the studio through any option on the <Link to="/contact">contact page</Link>.</p>
              </li>
              <li>
                <span className="booking-workflow__number">04</span>
                <BadgeCheck size={21} aria-hidden="true" />
                <strong>Confirm together</strong>
                <p>The final scope, schedule, price, availability, and payment arrangements are confirmed directly after both sides agree.</p>
              </li>
            </ol>

            <div className="booking-workflow__notice" role="note">
              <strong>Important:</strong>
              <span>An estimate is approximate, and submitting this form is only a booking request. Please wait for direct confirmation from Jonathan Photography before treating your date as reserved.</span>
            </div>
          </section>

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
