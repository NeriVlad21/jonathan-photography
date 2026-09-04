import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useParams
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
  ShieldCheck
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
  const { showToast } = useToast()

  const [booking, setBooking] =
    useState(null)

  const [updating, setUpdating] =
    useState(false)

  const [selectedStatus, setSelectedStatus] =
    useState('')

  const [finalAcknowledged, setFinalAcknowledged] =
    useState(false)

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
      await bookingsApi.updateStatus(
        id,
        selectedStatus,
        true
      )

      showToast(
        `Booking finalized as ${selectedStatus}.`
      )

      setSelectedStatus('')
      setFinalAcknowledged(false)
      load()
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

        <Link
          to="/admin/bookings"
          className="text-link"
        >
          <ArrowLeft
            size={15}
            style={{
              verticalAlign: 'middle',
              marginRight: 5
            }}
          />
          Back to Bookings
        </Link>

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

          <Link
            to="/admin/bookings"
            className="booking-details-back"
          >
            <ArrowLeft
              size={16}
              aria-hidden="true"
            />

            Back to Bookings
          </Link>

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

              {FINAL_STATUSES.includes(booking.status) ? (
                <div className="booking-status-final">
                  <span className="booking-status-final__icon">
                    <ShieldCheck size={22} />
                  </span>
                  <div>
                    <strong>This booking is finalized.</strong>
                    <p>
                      Its final outcome is {booking.status.toLowerCase()} and can no longer be changed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="booking-status-workflow">
                  <div className="booking-status-workflow__intro">
                    <span>Current stage</span>
                    <strong>New inquiry</strong>
                    <p>
                      Contact the client without changing this status. After they reply, choose the final outcome below.
                    </p>
                  </div>

                  <div className="booking-status-actions" role="radiogroup" aria-label="Final booking outcome">
                    {FINAL_STATUSES.map((item) => (
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
                      <strong>I understand this is the final status update.</strong>
                      <small>Confirmed or cancelled bookings cannot be changed afterward.</small>
                    </span>
                  </label>

                  <button
                    type="button"
                    className="btn btn--primary booking-status-submit"
                    disabled={!selectedStatus || !finalAcknowledged || updating}
                    onClick={changeStatus}
                  >
                    <ShieldCheck size={16} />
                    {updating ? 'Finalizing…' : `Finalize as ${selectedStatus || 'selected status'}`}
                  </button>
                </div>
              )}

            </div>

          </section>

          {/* ====================================================
              CLIENT + SHOOT
              ==================================================== */}

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
