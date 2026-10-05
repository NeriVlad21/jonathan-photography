import { useEffect, useState } from 'react'
import {
  useNavigate,
  useParams,
  useLocation
} from 'react-router-dom'

import {
  ArrowLeft,
  Check,
  User,
  Mail,
  Phone,
  Facebook,
  Camera,
  CalendarDays,
  MapPin,
  Users,
  MessageSquare,
  Receipt,
  Database,
  ShieldCheck,
  Pencil,
  CreditCard,
  Send
} from 'lucide-react'

import { bookingsApi } from '../services/api.js'
import {
  peso,
  formatDateTime,
  formatDate
} from '../utils/format.js'

import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'

const FINAL_STATUSES = ['CONFIRMED', 'CANCELLED']

export default function BookingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  const [booking, setBooking] =
    useState(null)

  const [updating, setUpdating] =
    useState(false)

  const [selectedStatus, setSelectedStatus] =
    useState('')

  const [finalAcknowledged, setFinalAcknowledged] =
    useState(false)

  const [editingDetails, setEditingDetails] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [detailsForm, setDetailsForm] = useState({ total: '', coverage: '', hours: '', date: '', notes: '', addonsText: '' })
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' })
  const backTarget = location.state?.from || '/admin/bookings'
  const goBack = () => {
    if (typeof backTarget === 'string') navigate(backTarget)
    else navigate({ pathname: backTarget.pathname, search: backTarget.search, hash: backTarget.hash }, { state: backTarget.state })
  }

  /*
  ============================================================
  LOAD BOOKING
  ============================================================
  */

  const load = () => {
    bookingsApi
      .details(id)
      .then((data) => {
        setBooking(data || false)
      })
      .catch(() => {
        setBooking(false)
      })
  }

  useEffect(() => {
    load()
  }, [id])

  useEffect(() => {
    document.title =
      'Admin — Booking Details'
  }, [])

  /*
  ============================================================
  CHANGE STATUS
  ============================================================
  */

  const changeStatus = async () => {
    if (!selectedStatus || !finalAcknowledged) {
      return
    }

    setUpdating(true)

    try {
      const updated = await bookingsApi.updateStatus(
        id,
        selectedStatus,
        true
      )

      showToast(
        `Booking and calendar updated to ${selectedStatus}.`
      )

      setSelectedStatus('')
      setFinalAcknowledged(false)
      setBooking((current) => ({ ...current, status: updated.status }))
    } catch (error) {
      showToast(
        error?.message ||
          'Unable to update booking status.',
        'error'
      )
    } finally {
      setUpdating(false)
    }
  }

  const openDetailsEditor = () => {
    const current = booking.confirmed_details || {}
    setDetailsForm({
      total: current.total ?? booking.estimate_total ?? '', coverage: current.coverage ?? '',
      hours: current.hours ?? '', date: current.date ?? booking.preferred_date ?? '', notes: current.notes ?? '',
      addonsText: (current.addons || []).map((item) => `${item.label}|${item.amount}|${item.quantity || 1}`).join('\n')
    })
    setEditingDetails(true)
  }

  const saveConfirmedDetails = async (event) => {
    event.preventDefault()
    const addons = detailsForm.addonsText.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [label, amount = '0', quantity = '1'] = line.split('|').map((value) => value.trim())
      return { label, amount, quantity }
    })
    setSavingDetails(true)
    try {
      const data = await bookingsApi.updateConfirmedDetails({ id, ...detailsForm, addons })
      setBooking((current) => ({ ...current, ...data }))
      setEditingDetails(false)
      showToast('Confirmed booking details saved.')
    } catch (error) { showToast(error?.message || 'Unable to save confirmed details.', 'error') }
    finally { setSavingDetails(false) }
  }

  const markDownPayment = async (event) => {
    event.preventDefault()
    setSavingPayment(true)
    try {
      const data = await bookingsApi.markDownPayment({ id, ...paymentForm })
      setBooking((current) => ({ ...current, ...data, invoice_sent_at: data.invoice_sent ? new Date().toISOString() : current.invoice_sent_at }))
      setPaymentOpen(false)
      showToast(data.message || 'Down payment recorded.')
    } catch (error) { showToast(error?.message || 'Unable to record down payment.', 'error') }
    finally { setSavingPayment(false) }
  }

  const resendInvoice = async () => {
    setSendingInvoice(true)
    try {
      const data = await bookingsApi.resendInvoice(id)
      setBooking((current) => ({ ...current, invoice_sent_at: data.invoice_sent_at }))
      showToast(data.message || 'Invoice sent successfully.')
    } catch (error) { showToast(error?.message || 'Unable to send invoice.', 'error') }
    finally { setSendingInvoice(false) }
  }

  /*
  ============================================================
  LOADING / NOT FOUND
  ============================================================
  */

  if (booking === null) {
    return (
      <LoadingState
        label="Loading booking…"
      />
    )
  }

  if (booking === false) {
    return (
      <div className="booking-details-empty">

        <style>{`

          .booking-details-empty {
            min-height: 40vh;

            display: flex;

            flex-direction: column;

            align-items: center;
            justify-content: center;

            padding:
              40px 20px;

            text-align:
              center;
          }

          .booking-details-empty__title {
            margin:
              0 0 8px;
          }

          .booking-details-empty__text {
            margin:
              0 0 18px;

            color:
              var(--c-gray);
          }

        `}</style>

        <h2 className="booking-details-empty__title">
          Booking not found.
        </h2>

        <p className="booking-details-empty__text">
          The booking may have been removed
          or is no longer available.
        </p>

        <button
          type="button"
          onClick={goBack}
          className="text-link"
        >
          <ArrowLeft
            size={15}
            style={{
              verticalAlign: 'middle',
              marginRight: 5
            }}
          />
          Go back
        </button>

      </div>
    )
  }

  const addons =
    Array.isArray(booking.addons)
      ? booking.addons
      : []

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <>
      <style>{`

        /*
        ============================================================
        BOOKING DETAILS
        ============================================================
        */

        .booking-details-page {
          width: 100%;
        }

        .booking-details-content {
          width: 100%;

          max-width:
            1000px;
        }

        /*
        ============================================================
        BACK NAVIGATION
        ============================================================
        */

        .booking-details-back {
          display: inline-flex;

          align-items: center;

          gap: 7px;

          margin-bottom:
            18px;

          color:
            var(--c-gray);

          text-decoration:
            none;

          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .booking-details-back:hover {
          color:
            var(--c-text);

          transform:
            translateX(-2px);
        }

        /*
        ============================================================
        RECORD HEADER
        ============================================================
        */

        .booking-details-hero {
          display: flex;

          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          margin-bottom:
            20px;

          padding:
            22px;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);
        }

        .booking-details-hero__copy {
          min-width: 0;
        }

        .booking-details-hero__eyebrow {
          display: block;

          margin-bottom:
            6px;

          color:
            var(--c-gray);

          text-transform:
            uppercase;
        }

        .booking-details-hero__title {
          margin:
            0;
        }

        .booking-details-hero__reference {
          margin:
            6px 0 0;

          color:
            var(--c-gray);
        }

        .booking-details-hero__status {
          flex: 0 0 auto;
        }

        /*
        ============================================================
        PANELS
        ============================================================
        */

        .booking-details-panel {
          margin-bottom:
            16px;

          border:
            1px solid
            var(--c-hairline, #e5e5e5);

          background:
            var(--c-bg, #fff);

          overflow:
            hidden;
        }

        .booking-details-panel__head {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 15px;

          padding:
            17px 20px;

          border-bottom:
            1px solid
            var(--c-hairline, #e5e5e5);
        }

        .booking-details-panel__title-wrap {
          display: flex;

          align-items: center;

          gap: 9px;

          min-width: 0;
        }

        .booking-details-panel__icon {
          display: inline-flex;

          align-items: center;
          justify-content: center;

          flex: 0 0 auto;

          color:
            #777;
        }

        .booking-details-panel__title {
          margin: 0;
        }

        .booking-details-panel__body {
          padding:
            20px;
        }

        /*
        ============================================================
        STATUS
        ============================================================
        */

        .booking-status-actions {
          display: flex;

          align-items: center;

          gap: 8px;

          flex-wrap:
            wrap;
        }

        .booking-status-button {
          min-height:
            38px;

          padding:
            0 13px;

          border:
            1px solid
            #d6d6d6;

          border-radius:
            7px;

          background:
            #fafafa;

          color:
            var(--c-text, #111);

          cursor:
            pointer;

          font:
            inherit;

          transition:
            background 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease,
            opacity 0.2s ease;
        }

        .booking-status-button:hover:not(:disabled) {
          background:
            #f0f0f0;

          border-color:
            #c8c8c8;
        }

        .booking-status-button--active {
          background:
            #111;

          border-color:
            #111;

          color:
            #fff;
        }

        .booking-status-button--active:hover:not(:disabled) {
          background:
            #111;

          border-color:
            #111;

          color:
            #fff;
        }

        .booking-status-button:disabled {
          cursor:
            default;

          opacity:
            0.55;
        }

        .booking-status-workflow {
          display: grid;
          gap: 18px;
        }

        .booking-status-workflow__intro {
          max-width: 680px;
        }

        .booking-status-workflow__intro > span {
          display: block;
          margin-bottom: 4px;
          color: var(--c-gray);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .booking-status-workflow__intro > strong {
          display: block;
          font-size: 1.15rem;
        }

        .booking-status-workflow__intro p,
        .booking-status-final p {
          margin: 5px 0 0;
          color: var(--c-gray);
          line-height: 1.55;
        }

        .booking-status-button {
          min-width: 230px;
          padding: 14px 16px;
          text-align: left;
        }

        .booking-status-button span,
        .booking-status-button small {
          display: block;
        }

        .booking-status-button span {
          font-weight: 700;
        }

        .booking-status-button small {
          margin-top: 3px;
          color: var(--c-gray);
          font-size: 0.74rem;
        }

        .booking-status-button--active {
          background: var(--c-yellow);
          border-color: var(--c-black);
          color: var(--c-black);
        }

        .booking-status-button--active small {
          color: rgba(17, 17, 15, 0.68);
        }

        .booking-final-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          width: fit-content;
          cursor: pointer;
        }

        .booking-final-toggle--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .booking-final-toggle input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .booking-final-toggle__track {
          position: relative;
          width: 42px;
          height: 24px;
          flex: 0 0 42px;
          border: 1px solid #aaa;
          border-radius: 999px;
          background: #dddcd7;
          transition: background 0.2s ease;
        }

        .booking-final-toggle__track::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s ease;
        }

        .booking-final-toggle input:checked + .booking-final-toggle__track {
          background: var(--c-black);
        }

        .booking-final-toggle input:checked + .booking-final-toggle__track::after {
          transform: translateX(18px);
        }

        .booking-final-toggle input:focus-visible + .booking-final-toggle__track {
          outline: 3px solid rgba(242, 203, 5, 0.42);
          outline-offset: 2px;
        }

        .booking-final-toggle strong,
        .booking-final-toggle small {
          display: block;
        }

        .booking-final-toggle small {
          margin-top: 2px;
          color: var(--c-gray);
        }

        .booking-status-submit {
          width: fit-content;
        }

        .booking-status-submit:disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }

        .booking-status-final {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 18px;
          border-left: 4px solid var(--c-yellow);
          background: #f5f4ef;
        }

        .booking-status-final__icon {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border-radius: 50%;
          background: var(--c-black);
          color: var(--c-yellow);
        }

        /*
        ============================================================
        INFORMATION GRID
        ============================================================
        */

        .booking-info-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap:
            20px 30px;
        }

        .booking-info-item {
          min-width: 0;
        }

        .booking-info-item__label {
          display: flex;

          align-items: center;

          gap: 7px;

          margin-bottom:
            5px;

          color:
            var(--c-gray);

          text-transform:
            uppercase;
        }

        .booking-info-item__value {
          margin: 0;

          color:
            var(--c-text);
        }

        .booking-info-item__value a {
          color:
            inherit;

          text-decoration:
            none;
        }

        .booking-info-item__value a:hover {
          text-decoration:
            underline;
        }

        /*
        ============================================================
        MESSAGE
        ============================================================
        */

        .booking-message {
          margin-top:
            20px;

          padding-top:
            20px;

          border-top:
            1px solid
            var(--c-hairline, #e5e5e5);
        }

        .booking-message__label {
          display: flex;

          align-items: center;

          gap: 7px;

          margin-bottom:
            8px;

          color:
            var(--c-gray);

          text-transform:
            uppercase;
        }

        .booking-message__text {
          margin: 0;

          color:
            var(--c-text);

          white-space:
            pre-wrap;

          line-height:
            1.65;
        }

        /*
        ============================================================
        ESTIMATE
        ============================================================
        */

        .booking-estimate-list {
          display: flex;

          flex-direction:
            column;
        }

        .booking-estimate-row {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 20px;

          padding:
            10px 0;

          border-bottom:
            1px solid
            var(--c-hairline, #ededed);
        }

        .booking-estimate-row:last-child {
          border-bottom:
            0;
        }

        .booking-estimate-row__label {
          min-width: 0;
        }

        .booking-estimate-row__price {
          flex: 0 0 auto;

          white-space:
            nowrap;
        }

        .booking-estimate-total {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 20px;

          margin-top:
            8px;

          padding-top:
            15px;

          border-top:
            2px solid
            var(--c-text);
        }

        .booking-estimate-total__label {
          font-weight:
            700;
        }

        .booking-estimate-total__price {
          font-weight:
            700;
        }

        /*
        ============================================================
        METADATA
        ============================================================
        */

        .booking-consent {
          display: inline-flex;

          align-items: center;

          gap: 6px;
        }

        .booking-consent--yes {
          color:
            #247447;
        }

        .booking-consent--no {
          color:
            #9a3838;
        }

        /*
        ============================================================
        TWO-COLUMN LAYOUT
        ============================================================
        */

        .booking-details-columns {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap:
            16px;
        }

        .booking-details-columns
        .booking-details-panel {
          margin-bottom:
            0;
        }

        /*
        ============================================================
        RESPONSIVE
        ============================================================
        */

        @media (max-width: 760px) {

          .booking-details-content {
            max-width:
              none;
          }

          .booking-details-hero {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .booking-details-hero__status {
            width:
              100%;
          }

          .booking-info-grid {
            grid-template-columns:
              1fr;
          }

          .booking-details-columns {
            grid-template-columns:
              1fr;
          }

          .booking-status-actions {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );

            width:
              100%;
          }

          .booking-status-button {
            width:
              100%;
          }

        }

        @media (max-width: 500px) {

          .booking-details-panel__head,
          .booking-details-panel__body,
          .booking-details-hero {
            padding:
              16px;
          }

          .booking-status-actions {
            grid-template-columns:
              1fr;
          }

          .booking-estimate-row,
          .booking-estimate-total {
            align-items:
              flex-start;

            flex-direction:
              column;

            gap:
              4px;
          }

        }

        /*
        ============================================================
        REDUCED MOTION
        ============================================================
        */

        @media (
          prefers-reduced-motion: reduce
        ) {

          .booking-details-back,
          .booking-status-button {
            transition:
              none;
          }

        }

      `}</style>

      <section className="booking-details-page">

        <div className="admin-content booking-details-content">

          {/* ====================================================
              BACK
              ==================================================== */}

          <button
            type="button"
            onClick={goBack}
            className="booking-details-back"
          >
            <ArrowLeft
              size={16}
              aria-hidden="true"
            />

            Go back
          </button>

          {/* ====================================================
              BOOKING HERO
              ==================================================== */}

          <div className="booking-details-hero">

            <div className="booking-details-hero__copy">

              <span className="booking-details-hero__eyebrow">
                Booking Record
              </span>

              <h2 className="booking-details-hero__title">
                {booking.name ||
                  'Unnamed Client'}
              </h2>

              <p className="booking-details-hero__reference">
                {booking.reference_code ||
                  `Booking #${booking.id}`}
              </p>

            </div>

            <div className="booking-details-hero__status">

              <span
                className={`
                  status-badge
                  status-badge--${booking.status}
                `}
              >
                {booking.status ||
                  'UNKNOWN'}
              </span>

            </div>

          </div>

          {/* ====================================================
              STATUS
              ==================================================== */}

          <section className="booking-details-panel">

            <div className="booking-details-panel__head">

              <div className="booking-details-panel__title-wrap">

                <span className="booking-details-panel__icon">
                  <Check size={17} />
                </span>

                <h2 className="booking-details-panel__title">
                  Booking Status
                </h2>

              </div>

            </div>

            <div className="booking-details-panel__body">

              {booking.status === 'CANCELLED' ? (
                <div className="booking-status-final">
                  <span className="booking-status-final__icon">
                    <ShieldCheck size={22} />
                  </span>
                  <div>
                    <strong>This booking request is closed.</strong>
                    <p>
                      The request was cancelled and its preferred date is available to the public again.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="booking-status-workflow">
                  <div className="booking-status-workflow__intro">
                    <span>Current stage</span>
                    <strong>{booking.status === 'CONFIRMED' ? 'Confirmed booking' : 'New booking request'}</strong>
                    <p>
                      {booking.status === 'CONFIRMED'
                        ? 'This date is booked. If the arrangement is cancelled outside the website, update it here to reopen the date.'
                        : 'The requested date is shown as pending and temporarily unavailable while you contact the client.'}
                    </p>
                  </div>

                  <div className="booking-status-actions" role="radiogroup" aria-label="Final booking outcome">
                    {(booking.status === 'CONFIRMED' ? ['CANCELLED'] : FINAL_STATUSES).map((item) => (
                      <button
                        key={item}
                        type="button"
                        role="radio"
                        aria-checked={selectedStatus === item}
                        className={`booking-status-button ${selectedStatus === item ? 'booking-status-button--active' : ''}`}
                        disabled={updating}
                        onClick={() => {
                          setSelectedStatus(item)
                          setFinalAcknowledged(false)
                        }}
                      >
                        <span>{item === 'CONFIRMED' ? 'Confirm booking' : 'Cancel booking'}</span>
                        <small>{item === 'CONFIRMED' ? 'The client accepted the booking.' : 'The booking will not proceed.'}</small>
                      </button>
                    ))}
                  </div>

                  <label className={`booking-final-toggle ${selectedStatus ? '' : 'booking-final-toggle--disabled'}`}>
                    <input
                      type="checkbox"
                      checked={finalAcknowledged}
                      disabled={!selectedStatus || updating}
                      onChange={(event) => setFinalAcknowledged(event.target.checked)}
                    />
                    <span className="booking-final-toggle__track" aria-hidden="true" />
                    <span>
                      <strong>I understand this updates the booking calendar.</strong>
                      <small>{selectedStatus === 'CANCELLED' ? 'Cancelling reopens the preferred date publicly.' : 'Confirming marks the date as booked.'}</small>
                    </span>
                  </label>

                  <button
                    type="button"
                    className="btn btn--primary booking-status-submit"
                    disabled={!selectedStatus || !finalAcknowledged || updating}
                    onClick={changeStatus}
                  >
                    <ShieldCheck size={16} />
                    {updating ? 'Updating…' : `Update to ${selectedStatus || 'selected status'}`}
                  </button>
                </div>
              )}

            </div>

          </section>

          {/* ====================================================
              CLIENT + SHOOT
              ==================================================== */}

          <section className="booking-details-panel booking-workflow-panel">
            <div className="booking-details-panel__head">
              <div className="booking-details-panel__title-wrap">
                <span className="booking-details-panel__icon"><Receipt size={17} /></span>
                <h2 className="booking-details-panel__title">Confirmed Details & Payment</h2>
              </div>
              {!editingDetails && booking.status !== 'CANCELLED' && (
                <button type="button" className="btn btn--secondary" onClick={openDetailsEditor}><Pencil size={15} /> Edit Details</button>
              )}
            </div>
            <div className="booking-details-panel__body">
              {editingDetails ? (
                <form className="booking-action-form" onSubmit={saveConfirmedDetails}>
                  <label>Final agreed price<input type="number" min="0.01" step="0.01" required value={detailsForm.total} onChange={(e) => setDetailsForm({ ...detailsForm, total: e.target.value })} /></label>
                  <label>Coverage description<input type="text" maxLength="160" value={detailsForm.coverage} onChange={(e) => setDetailsForm({ ...detailsForm, coverage: e.target.value })} placeholder="Full-day photo and video coverage" /></label>
                  <label>Coverage hours<input type="number" min="0.5" max="24" step="0.5" value={detailsForm.hours} onChange={(e) => setDetailsForm({ ...detailsForm, hours: e.target.value })} /></label>
                  <label>Final event date<input type="date" required value={detailsForm.date} onChange={(e) => setDetailsForm({ ...detailsForm, date: e.target.value })} /></label>
                  <label className="booking-action-form__wide">Add-ons <small>One per line: Name | Amount | Quantity</small><textarea rows="4" value={detailsForm.addonsText} onChange={(e) => setDetailsForm({ ...detailsForm, addonsText: e.target.value })} placeholder="Printed album | 3500 | 1" /></label>
                  <label className="booking-action-form__wide">Final notes<textarea rows="4" maxLength="2000" value={detailsForm.notes} onChange={(e) => setDetailsForm({ ...detailsForm, notes: e.target.value })} /></label>
                  <div className="booking-action-form__actions"><button type="button" className="btn btn--secondary" onClick={() => setEditingDetails(false)} disabled={savingDetails}>Cancel</button><button type="submit" className="btn btn--primary" disabled={savingDetails}>{savingDetails ? 'Saving…' : 'Save confirmed details'}</button></div>
                </form>
              ) : booking.confirmed_details ? (
                <div className="booking-confirmed-summary">
                  <div><span>Final total</span><strong>{peso(booking.confirmed_details.total)}</strong></div>
                  <div><span>Coverage</span><strong>{booking.confirmed_details.coverage || '—'}{booking.confirmed_details.hours ? ` · ${booking.confirmed_details.hours} hours` : ''}</strong></div>
                  <div><span>Final date</span><strong>{formatDate(booking.confirmed_details.date)}</strong></div>
                  <div><span>Last updated</span><strong>{booking.confirmed_details_updated_at ? formatDateTime(booking.confirmed_details_updated_at) : '—'}</strong></div>
                  {(booking.confirmed_details.addons || []).length > 0 && <div className="booking-confirmed-summary__wide"><span>Add-ons</span><strong>{booking.confirmed_details.addons.map((item) => `${item.quantity || 1}× ${item.label}`).join(', ')}</strong></div>}
                  {booking.confirmed_details.notes && <div className="booking-confirmed-summary__wide"><span>Notes</span><strong>{booking.confirmed_details.notes}</strong></div>}
                </div>
              ) : <p className="booking-workflow-note">No final terms have been recorded. The original client estimate remains unchanged.</p>}

              {booking.status === 'CONFIRMED' && booking.confirmed_details && !booking.down_payment_received_at && !paymentOpen && (
                <button type="button" className="btn btn--primary booking-payment-button" onClick={() => setPaymentOpen(true)}><CreditCard size={16} /> Mark Down Payment Received</button>
              )}
              {paymentOpen && (
                <form className="booking-action-form booking-payment-form" onSubmit={markDownPayment}>
                  <label>Amount received<input type="number" min="0.01" step="0.01" max={booking.confirmed_details?.total} required value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} /></label>
                  <label>Date received<input type="date" required value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} /></label>
                  <label className="booking-action-form__wide">Optional note<textarea maxLength="500" rows="3" value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} /></label>
                  <div className="booking-action-form__actions"><button type="button" className="btn btn--secondary" onClick={() => setPaymentOpen(false)} disabled={savingPayment}>Cancel</button><button type="submit" className="btn btn--primary" disabled={savingPayment}>{savingPayment ? 'Recording…' : 'Record payment & send invoice'}</button></div>
                </form>
              )}
              {booking.down_payment_received_at && (
                <div className="booking-payment-record"><div><span>Down payment received</span><strong>{peso(booking.down_payment_amount)} · {formatDate(booking.down_payment_received_at)}</strong></div><div><span>Invoice</span><strong>{booking.invoice_sent_at ? `Sent ${formatDateTime(booking.invoice_sent_at)}` : 'Not sent'}</strong></div><button type="button" className="btn btn--secondary" onClick={resendInvoice} disabled={sendingInvoice}><Send size={15} /> {sendingInvoice ? 'Sending…' : 'Resend Invoice'}</button></div>
              )}
            </div>
          </section>

          <div className="booking-details-columns">

            {/* CLIENT */}

            <section className="booking-details-panel">

              <div className="booking-details-panel__head">

                <div className="booking-details-panel__title-wrap">

                  <span className="booking-details-panel__icon">
                    <User size={17} />
                  </span>

                  <h2 className="booking-details-panel__title">
                    Client
                  </h2>

                </div>

              </div>

              <div className="booking-details-panel__body">

                <div className="booking-info-grid">

                  <div className="booking-info-item">

                    <div className="booking-info-item__label">
                      <User size={14} />
                      Name
                    </div>

                    <p className="booking-info-item__value">
                      {booking.name ||
                        '—'}
                    </p>

                  </div>

                  <div className="booking-info-item">

                    <div className="booking-info-item__label">
                      <Mail size={14} />
                      Email
                    </div>

                    <p className="booking-info-item__value">

                      {booking.email ? (
                        <a
                          href={`mailto:${booking.email}`}
                        >
                          {booking.email}
                        </a>
                      ) : (
                        '—'
                      )}

                    </p>

                  </div>

                  <div className="booking-info-item">

                    <div className="booking-info-item__label">
                      <Phone size={14} />
                      Phone
                    </div>

                    <p className="booking-info-item__value">

                      {booking.phone ? (
                        <a
                          href={`tel:${booking.phone}`}
                        >
                          {booking.phone}
                        </a>
                      ) : (
                        '—'
                      )}

                    </p>

                  </div>

                  <div className="booking-info-item">

                    <div className="booking-info-item__label">
                      <Facebook size={14} />
                      Facebook
                    </div>

                    <p className="booking-info-item__value">
                      {booking.facebook ||
                        '—'}
                    </p>

                  </div>

                </div>

              </div>

            </section>

            {/* SHOOT */}

            <section className="booking-details-panel">

              <div className="booking-details-panel__head">

                <div className="booking-details-panel__title-wrap">

                  <span className="booking-details-panel__icon">
                    <Camera size={17} />
                  </span>

                  <h2 className="booking-details-panel__title">
                    Shoot
                  </h2>

                </div>

              </div>

              <div className="booking-details-panel__body">

                <div className="booking-info-grid">

                  <div className="booking-info-item">

                    <div className="booking-info-item__label">
                      <Camera size={14} />
                      Type
                    </div>

                    <p className="booking-info-item__value">
                      {booking.shoot_type ||
                        '—'}
                    </p>

                  </div>

                  <div className="booking-info-item">

                    <div className="booking-info-item__label">
                      <CalendarDays size={14} />
                      Date
                    </div>

                    <p className="booking-info-item__value">
                      {booking.preferred_date
                        ? formatDate(
                            booking.preferred_date
                          )
                        : 'Not specified'}
                      {booking.preferred_time && ` · ${new Date(`2000-01-01T${booking.preferred_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                    </p>

                  </div>

                  <div className="booking-info-item">

                    <div className="booking-info-item__label">
                      <MapPin size={14} />
                      Location
                    </div>

                    <p className="booking-info-item__value">
                      {booking.location ||
                        '—'}
                    </p>

                  </div>

                  <div className="booking-info-item">

                    <div className="booking-info-item__label">
                      <Users size={14} />
                      Guests
                    </div>

                    <p className="booking-info-item__value">
                      {booking.guest_count ||
                        '—'}
                    </p>

                  </div>

                </div>

              </div>

              {/* MESSAGE */}

              <div className="booking-details-panel__body">

                <div className="booking-message">

                  <div className="booking-message__label">
                    <MessageSquare size={14} />
                    Message
                  </div>

                  <p className="booking-message__text">
                    {booking.message ||
                      'No message provided.'}
                  </p>

                </div>

              </div>

            </section>

          </div>

          {/* ====================================================
              ESTIMATE
              ==================================================== */}

          {booking.estimate_total && (
            <section className="booking-details-panel">

              <div className="booking-details-panel__head">

                <div className="booking-details-panel__title-wrap">

                  <span className="booking-details-panel__icon">
                    <Receipt size={17} />
                  </span>

                  <h2 className="booking-details-panel__title">
                    Estimate
                  </h2>

                </div>

                <strong>
                  {peso(
                    booking.estimate_total
                  )}
                </strong>

              </div>

              <div className="booking-details-panel__body">

                <div className="booking-estimate-list">

                  {addons.length > 0 &&
                    addons.map(
                      (addon, index) => (
                        <div
                          key={
                            addon.label ||
                            `addon-${index}`
                          }
                          className="booking-estimate-row"
                        >

                          <span className="booking-estimate-row__label">
                            {addon.label ||
                              'Add-on'}
                          </span>

                          <span className="booking-estimate-row__price">
                            {peso(
                              addon.price
                            )}
                          </span>

                        </div>
                      )
                    )}

                  {addons.length === 0 && (
                    <div className="booking-estimate-row">
                      <span className="booking-estimate-row__label">
                        No itemized add-ons
                      </span>

                      <span className="booking-estimate-row__price">
                        —
                      </span>
                    </div>
                  )}

                  <div className="booking-estimate-total">

                    <span className="booking-estimate-total__label">
                      Total
                    </span>

                    <span className="booking-estimate-total__price">
                      {peso(
                        booking.estimate_total
                      )}
                    </span>

                  </div>

                </div>

              </div>

            </section>
          )}

          {/* ====================================================
              METADATA
              ==================================================== */}

          <section className="booking-details-panel">

            <div className="booking-details-panel__head">

              <div className="booking-details-panel__title-wrap">

                <span className="booking-details-panel__icon">
                  <Database size={17} />
                </span>

                <h2 className="booking-details-panel__title">
                  Metadata
                </h2>

              </div>

            </div>

            <div className="booking-details-panel__body">

              <div className="booking-info-grid">

                <div className="booking-info-item">

                  <div className="booking-info-item__label">
                    <Database size={14} />
                    Booking ID
                  </div>

                  <p className="booking-info-item__value">
                    #{booking.id}
                  </p>

                </div>

                <div className="booking-info-item">

                  <div className="booking-info-item__label">
                    <CalendarDays size={14} />
                    Submitted
                  </div>

                  <p className="booking-info-item__value">
                    {formatDateTime(
                      booking.created_at
                    )}
                  </p>

                </div>

                <div className="booking-info-item">

                  <div className="booking-info-item__label">
                    <ShieldCheck size={14} />
                    Privacy Consent
                  </div>

                  <p className="booking-info-item__value">

                    <span
                      className={`
                        booking-consent
                        ${
                          booking.privacy_agreed
                            ? 'booking-consent--yes'
                            : 'booking-consent--no'
                        }
                      `}
                    >

                      <span>
                        {booking.privacy_agreed
                          ? 'Agreed'
                          : 'Not agreed'}
                      </span>

                    </span>

                  </p>

                </div>

                <div className="booking-info-item">

                  <div className="booking-info-item__label">
                    <ShieldCheck size={14} />
                    Consent Timestamp
                  </div>

                  <p className="booking-info-item__value">
                    {booking.privacy_agreed_at
                      ? formatDateTime(
                          booking.privacy_agreed_at
                        )
                      : '—'}
                  </p>

                </div>

              </div>

            </div>

          </section>

        </div>

      </section>
    </>
  )
}
