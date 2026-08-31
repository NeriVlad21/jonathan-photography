import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Mail } from 'lucide-react'
import { peso } from '../utils/format.js'
import { estimatorApi } from '../services/api.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from './LoadingState.jsx'
import PrivacyModal from './PrivacyModal.jsx'

export default function Estimator({ estimator }) {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [sendingLead, setSendingLead] = useState(false)
  const [margin, setMargin] = useState(15)

  const {
    config,
    loading,
    serviceType,
    setServiceType,
    hourId,
    setHourId,
    addonIds,
    toggleAddon,
    breakdown
  } = estimator

  // ============================================================
  // LOAD ESTIMATOR RANGE MARGIN
  // ============================================================

  useEffect(() => {
    const savedMargin =
      localStorage.getItem('estimator_margin')

    if (savedMargin !== null) {
      const parsed = parseFloat(savedMargin)

      if (!Number.isNaN(parsed)) {
        setMargin(parsed)
      }
    }
  }, [])

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <LoadingState
        label="Loading the estimator…"
      />
    )
  }

  if (!config) {
    return null
  }

  // ============================================================
  // SERVICE TYPES
  // ============================================================

  const services = Array.isArray(config.services)
    ? config.services
    : []

  const selectedService =
    services.find(
      (service) =>
        service.name === serviceType
    ) || null

  // ============================================================
  // COVERAGE HOURS
  // ============================================================

  const selectedHour =
    Array.isArray(config.hours)
      ? config.hours.find(
          (hour) =>
            Number(hour.id) ===
            Number(hourId)
        )
      : null

  // ============================================================
  // ADD-ONS
  // ============================================================

  const selectedAddons =
    Array.isArray(config.addons)
      ? config.addons.filter((addon) =>
          addonIds.has(addon.id)
        )
      : []

  // ============================================================
  // DYNAMIC PRICING
  // ============================================================
  //
  // This is now the actual public estimator calculation:
  //
  // service starting_price
  // + selected coverage hour price
  // + selected add-ons
  //
  // This deliberately does NOT use the old flat service
  // pricing from the previous estimator calculation.
  // ============================================================

  const servicePrice = Number(
    selectedService?.starting_price || 0
  )

  const hourPrice = Number(
    selectedHour?.price || 0
  )

  const addonsPrice =
    selectedAddons.reduce(
      (sum, addon) =>
        sum +
        Number(addon.price || 0),
      0
    )

  const dynamicTotal =
    servicePrice +
    hourPrice +
    addonsPrice

  const maxTotal =
    dynamicTotal +
    dynamicTotal *
      (margin / 100)

  // ============================================================
  // BUILD DISPLAY BREAKDOWN
  // ============================================================

  const dynamicBreakdown = {
    service: selectedService
      ? {
          id: selectedService.id,
          name: selectedService.name,
          price: servicePrice
        }
      : null,

    hours: selectedHour
      ? {
          id: selectedHour.id,
          label: selectedHour.label,
          hours: selectedHour.hours,
          price: hourPrice
        }
      : null,

    addons: selectedAddons.map(
      (addon) => ({
        id: addon.id,
        label: addon.label,
        description:
          addon.description || '',
        price: Number(
          addon.price || 0
        )
      })
    ),

    total: dynamicTotal,

    max_total: maxTotal
  }

  // ============================================================
  // BOOK ESTIMATE
  // ============================================================

  const handleBookEstimate = () => {
    navigate(
      '/booking',
      {
        state: {
          estimate:
            dynamicBreakdown
        }
      }
    )
  }

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

  const handleFormSubmit = (e) => {
    e.preventDefault()
    setPrivacyModalOpen(true)
  }

  // ============================================================
  // FINAL LEAD SUBMISSION
  // ============================================================

  const handleFinalSubmit = async () => {
    setPrivacyModalOpen(false)
    setSendingLead(true)

    try {
      await estimatorApi.saveLead({
        name: leadName,
        email: leadEmail,

        hours:
          selectedHour?.hours ||
          null,

        service_type:
          selectedService?.name ||
          serviceType,

        service_type_id:
          selectedService?.id ||
          null,

        service_price:
          servicePrice,

        addons:
          dynamicBreakdown.addons,

        total:
          dynamicTotal
      })

      showToast(
        'Sent — check your inbox for the breakdown.'
      )

      setEmailModalOpen(false)
      setLeadName('')
      setLeadEmail('')
    } catch (err) {
      showToast(
        err.message,
        'error'
      )
    } finally {
      setSendingLead(false)
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="estimator-layout">

      {/* ========================================================
          SERVICE TYPE
          ======================================================== */}

      <div>

        <div className="estimator-block">
          <div className="estimator-block__label">
            <h3 className="display">
              What are we shooting?
            </h3>
          </div>

          <div className="option-grid">

            {services.length === 0 ? (
              <div
                style={{
                  color: '#6b7280',
                  fontSize: '0.9rem'
                }}
              >
                No services are currently
                available.
              </div>
            ) : (
              services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={`option-card ${
                    serviceType === service.name
                      ? 'option-card--selected'
                      : ''
                  }`}
                  onClick={() =>
                    setServiceType(
                      service.name
                    )
                  }
                >
                  <strong>
                    {service.name}
                  </strong>

                  <span>
                    {peso(
                      Number(
                        service.starting_price ||
                          0
                      )
                    )}
                  </span>
                </button>
              ))
            )}

          </div>
        </div>

        {/* ======================================================
            COVERAGE HOURS
            ====================================================== */}

        <div className="estimator-block">
          <div className="estimator-block__label">
            <h3 className="display">
              Coverage Hours
            </h3>
          </div>

          <div className="option-grid">
            {config.hours.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`option-card ${
                  Number(hourId) ===
                  Number(h.id)
                    ? 'option-card--selected'
                    : ''
                }`}
                onClick={() =>
                  setHourId(h.id)
                }
              >
                <strong>
                  {h.label}
                </strong>

                <span>
                  {peso(
                    Number(
                      h.price || 0
                    )
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================
            ADD-ONS
            ====================================================== */}

        <div className="estimator-block">
          <div className="estimator-block__label">
            <h3 className="display">
              Add-ons
            </h3>
          </div>

          <div>
            {config.addons.map((a) => {
              const checked =
                addonIds.has(a.id)

              return (
                <div
                  key={a.id}
                  className="addon-row"
                  onClick={() =>
                    toggleAddon(a.id)
                  }
                >
                  <div className="addon-row__left">

                    <span
                      className={`addon-row__checkbox ${
                        checked
                          ? 'addon-row__checkbox--checked'
                          : ''
                      }`}
                    >
                      {checked && (
                        <Check
                          size={13}
                          color="#0A0A0A"
                        />
                      )}
                    </span>

                    <div>
                      <div className="addon-row__name">
                        {a.label}
                      </div>

                      {a.description && (
                        <div className="addon-row__desc">
                          {a.description}
                        </div>
                      )}
                    </div>

                  </div>

                  <span className="addon-row__price">
                    +
                    {peso(
                      Number(
                        a.price || 0
                      )
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ========================================================
          ESTIMATE SUMMARY
          ======================================================== */}

      <div className="estimate-summary">

        <h3>
          Your Estimate
        </h3>

        {/* SERVICE BASE PRICE */}
        {selectedService && (
          <div className="estimate-summary__line">
            <span>
              {selectedService.name}
            </span>

            <span>
              {peso(
                servicePrice
              )}
            </span>
          </div>
        )}

        {/* COVERAGE */}
        {selectedHour && (
          <div className="estimate-summary__line">
            <span>
              {selectedHour.label}
            </span>

            <span>
              {peso(
                hourPrice
              )}
            </span>
          </div>
        )}

        {/* ADD-ONS */}
        {selectedAddons.map(
          (addon) => (
            <div
              className="estimate-summary__line"
              key={addon.id}
            >
              <span>
                {addon.label}
              </span>

              <span>
                {peso(
                  Number(
                    addon.price || 0
                  )
                )}
              </span>
            </div>
          )
        )}

        {/* EMPTY STATE */}
        {!selectedService &&
          !selectedHour &&
          selectedAddons.length === 0 && (
            <div className="estimate-summary__line">
              <span>
                Select options to begin
              </span>
            </div>
          )}

        {/* TOTAL */}
        <div className="estimate-summary__total">

          <span>
            Estimated Range
          </span>

          <strong>
            {dynamicTotal > 0
              ? `${peso(
                  dynamicTotal
                )} - ${peso(
                  maxTotal
                )}`
              : peso(0)}
          </strong>

        </div>

        {/* DISCLAIMER */}
        <p className="estimate-summary__disclaimer">
          Please note: This is an
          estimated baseline. We are
          happy to customize this
          package and negotiate terms
          to better fit your budget
          during our consultation
          meeting.
        </p>

        {/* ACTIONS */}
        <div className="estimate-summary__actions">

          <button
            className="btn btn--primary btn--block"
            onClick={
              handleBookEstimate
            }
            disabled={
              dynamicTotal <= 0
            }
          >
            Book This Estimate
          </button>

          <button
            className="btn btn--ghost-dark btn--block"
            onClick={() =>
              setEmailModalOpen(true)
            }
            disabled={
              dynamicTotal <= 0
            }
          >
            <Mail size={15} />

            Email Me This Estimate
          </button>

        </div>

      </div>

      {/* ========================================================
          EMAIL COLLECTION MODAL
          ======================================================== */}

      {emailModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setEmailModalOpen(false)
          }
        >
          <div
            className="modal-card"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3>
              Email this estimate
            </h3>

            <p>
              We'll send the full
              breakdown to your inbox —
              no obligation to book.
            </p>

            <form
              onSubmit={
                handleFormSubmit
              }
            >

              <div className="field">

                <label htmlFor="lead-name">
                  Name
                </label>

                <input
                  id="lead-name"
                  required
                  value={leadName}
                  onChange={(e) =>
                    setLeadName(
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="field">

                <label htmlFor="lead-email">
                  Email
                </label>

                <input
                  id="lead-email"
                  type="email"
                  required
                  value={leadEmail}
                  onChange={(e) =>
                    setLeadEmail(
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="modal-card__actions">

                <button
                  type="button"
                  className="btn btn--ghost-light btn--sm"
                  onClick={() =>
                    setEmailModalOpen(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={
                    sendingLead
                  }
                >
                  {sendingLead
                    ? 'Sending…'
                    : 'Send Estimate'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================
          PRIVACY MODAL
          ======================================================== */}

      <PrivacyModal
        isOpen={
          privacyModalOpen
        }
        onClose={() =>
          setPrivacyModalOpen(
            false
          )
        }
        onAccept={
          handleFinalSubmit
        }
      />

    </div>
  )
}