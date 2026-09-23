import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Calculator, MessageCircleMore, Send } from 'lucide-react'
import BookingFormComponent from '../components/BookingForm.jsx'
import EstimatorComponent from '../components/Estimator.jsx'
import PageHero from '../components/PageHero.jsx'
import { useEstimator } from '../hooks/useEstimator.js'
import { clearBookingEstimate, isBookingEstimate, readBookingEstimate } from '../utils/bookingEstimate.js'
import { useSiteContent } from '../context/SiteContentContext.jsx'

const WORKFLOW_ICONS = [Calculator, Send, MessageCircleMore, BadgeCheck]

export default function Booking() {
  const { bookingPage } = useSiteContent()
  const location = useLocation()
  const navigate = useNavigate()
  const estimator = useEstimator()
  const routeEstimate = location.state?.estimate
  const [estimate, setEstimate] = useState(() => {
    const storedEstimate = readBookingEstimate()
    return isBookingEstimate(routeEstimate) && isBookingEstimate(storedEstimate)
      ? routeEstimate
      : null
  })

  useEffect(() => {
    if (isBookingEstimate(routeEstimate) && isBookingEstimate(readBookingEstimate())) {
      setEstimate(routeEstimate)
    }
  }, [routeEstimate])

  // The package is intentionally temporary. Once the visitor leaves this
  // page, returning through a nav link or browser history starts at Step 1.
  useEffect(() => () => clearBookingEstimate(), [])

  useEffect(() => {
    document.title = 'Jonathan Photography — Booking Request'
  }, [])

  const returnToStepOne = () => {
    clearBookingEstimate()
    setEstimate(null)
    navigate('/booking', { replace: true, state: null })
    window.requestAnimationFrame(() => {
      document.getElementById('estimator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <>
      <PageHero
        eyebrow={bookingPage.eyebrow}
        title={estimate ? bookingPage.requestTitle : bookingPage.estimateTitle}
        intro={estimate
          ? bookingPage.requestIntro
          : bookingPage.estimateIntro}
        note={estimate ? 'Step 2 of 2 · Booking request' : 'Step 1 of 2 · Package estimate'}
      />
      <section className="page-content" id="estimator">
        <div className="container">
          <section className="booking-workflow" aria-labelledby="booking-workflow-title">
            <div className="booking-workflow__intro">
              <span className="eyebrow">{bookingPage.workflowEyebrow}</span>
              <h2 className="display" id="booking-workflow-title">{bookingPage.workflowTitle}</h2>
              <p>{bookingPage.workflowIntro}</p>
            </div>

            <ol className="booking-workflow__steps">
              {bookingPage.steps.map((step, index) => {
                const Icon = WORKFLOW_ICONS[index] || BadgeCheck
                return <li key={`${step.title}-${index}`}>
                  <span className="booking-workflow__number">{String(index + 1).padStart(2, '0')}</span>
                  <Icon size={21} aria-hidden="true" />
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </li>
              })}
            </ol>

            <div className="booking-workflow__notice" role="note">
              <strong>Important:</strong>
              <span>{bookingPage.notice}</span>
            </div>
          </section>

          {estimate ? (
            <div className="booking-request-step">
              <button type="button" className="booking-back-button" onClick={returnToStepOne}>
                <ArrowLeft size={18} aria-hidden="true" />
                Back to Step 1 — Change Package
              </button>
              <BookingFormComponent estimate={estimate} onChangeEstimate={returnToStepOne} />
            </div>
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
