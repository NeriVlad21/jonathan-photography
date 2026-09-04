import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Download, Mail, MapPin, Phone, Plus, X } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { bookingsApi } from '../services/api.js'
import { formatDate, peso } from '../utils/format.js'
import MonthCalendar, { addDays, monthBounds, toDateKey } from '../components/MonthCalendar.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useToast } from '../context/ToastContext.jsx'

const parseDateKey = (key) => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const eventProgress = (event) => {
  if (event.status === 'CANCELLED') return 'Cancelled'
  return event.preferred_date < toDateKey(new Date()) ? 'Finished' : 'Upcoming'
}

const rangeBounds = (range, month) => {
  if (range === 'monthly') return monthBounds(month)

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth()
  const focus = isCurrentMonth ? today : new Date(month.getFullYear(), month.getMonth(), 1)

  if (range === 'biweekly') {
    const startDay = focus.getDate() <= 14 ? 1 : 15
    const start = new Date(month.getFullYear(), month.getMonth(), startDay)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const end = addDays(start, 13) > monthEnd ? monthEnd : addDays(start, 13)
    return { start: toDateKey(start), end: toDateKey(end) }
  }

  const start = addDays(focus, -focus.getDay())
  return { start: toDateKey(start), end: toDateKey(addDays(start, 6)) }
}

function CalendarEventDialog({ date, events, onClose, onEventUpdated }) {
  if (!date) return null

  return (
    <div className="calendar-event-modal" role="presentation" onMouseDown={onClose}>
      <section className="calendar-event-dialog" role="dialog" aria-modal="true" aria-labelledby="calendar-event-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="calendar-event-dialog__close" onClick={onClose} aria-label="Close event details"><X size={18} /></button>
        <span className="calendar-event-dialog__eyebrow">Booking schedule</span>
        <h2 id="calendar-event-title">{formatDate(date)}</h2>

        <div className="calendar-event-dialog__list">
          {events.map((event) => {
            const progress = eventProgress(event)
            return (
              <article className="calendar-event-card" key={event.id}>
                <div className="calendar-event-card__head">
                  <div>
                    <span>{event.reference_code}</span>
                    <h3>{event.name}</h3>
                  </div>
                  <span className={`calendar-progress calendar-progress--${progress.toLowerCase()}`}>{progress}</span>
                </div>
                <dl>
                  <div><dt>Service</dt><dd>{event.shoot_type || '—'}</dd></div>
                  <div><dt><MapPin size={13} /> Location</dt><dd>{event.location || 'To be confirmed'}</dd></div>
                  <div><dt><Mail size={13} /> Email</dt><dd>{event.email ? <a href={`mailto:${event.email}`}>{event.email}</a> : '—'}</dd></div>
                  <div><dt><Phone size={13} /> Phone</dt><dd>{event.phone ? <a href={`tel:${event.phone}`}>{event.phone}</a> : '—'}</dd></div>
                  <div><dt>Estimate</dt><dd>{event.estimate_total ? peso(event.estimate_total) : '—'}</dd></div>
                </dl>
                {event.message && <p>{event.message}</p>}
                <div className="calendar-event-card__actions">
                  {event.booking_id && <Link to={`/admin/bookings/${event.booking_id}`} className="text-link">Open booking request →</Link>}
                  {event.status === 'BOOKED' && event.calendar_event_id && (
                    <button type="button" className="calendar-event-cancel" onClick={() => onEventUpdated(event.calendar_event_id, 'CANCELLED')}>
                      Mark event cancelled
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

const emptySchedule = (date = '') => ({
  booking_id: '', event_date: date, name: '', email: '', phone: '',
  shoot_type: '', location: '', notes: ''
})

function AddScheduleDialog({ initialDate, requests, onClose, onSaved }) {
  const [form, setForm] = useState(() => emptySchedule(initialDate))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const selectRequest = (event) => {
    const bookingId = event.target.value
    const request = requests.find((item) => String(item.id) === bookingId)
    setForm(request ? {
      booking_id: bookingId,
      event_date: request.preferred_date || form.event_date,
      name: request.name || '',
      email: request.email || '',
      phone: request.phone || '',
      shoot_type: request.shoot_type || '',
      location: request.location || '',
      notes: ''
    } : emptySchedule(form.event_date))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await bookingsApi.createCalendarEvent(form)
      onSaved()
    } catch (err) {
      setError(err.message || 'Unable to add this booked schedule.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="calendar-event-modal" role="presentation" onMouseDown={onClose}>
      <form className="calendar-schedule-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="calendar-event-dialog__close" onClick={onClose} aria-label="Close add schedule form"><X size={18} /></button>
        <span className="calendar-event-dialog__eyebrow">Admin schedule</span>
        <h2>Add booked work</h2>
        <p>Add this only after the client has agreed outside the website. Saving it blocks the date on the public availability guide.</p>

        <label className="calendar-schedule-field calendar-schedule-field--wide">
          <span>Booking request (optional)</span>
          <select value={form.booking_id} onChange={selectRequest}>
            <option value="">Manual entry — no linked request</option>
            {requests.map((request) => <option value={request.id} key={request.id}>{request.reference_code} · {request.name}</option>)}
          </select>
        </label>

        <div className="calendar-schedule-grid">
          <label className="calendar-schedule-field"><span>Event date</span><input type="date" required value={form.event_date} onChange={update('event_date')} /></label>
          <label className="calendar-schedule-field"><span>Client name</span><input required value={form.name} onChange={update('name')} /></label>
          <label className="calendar-schedule-field"><span>Service / shoot</span><input required value={form.shoot_type} onChange={update('shoot_type')} /></label>
          <label className="calendar-schedule-field"><span>Location</span><input value={form.location} onChange={update('location')} /></label>
          <label className="calendar-schedule-field"><span>Email (optional)</span><input type="email" value={form.email} onChange={update('email')} /></label>
          <label className="calendar-schedule-field"><span>Phone (optional)</span><input value={form.phone} onChange={update('phone')} /></label>
          <label className="calendar-schedule-field calendar-schedule-field--wide"><span>Schedule notes</span><textarea value={form.notes} onChange={update('notes')} /></label>
        </div>

        {error && <div className="calendar-schedule-error" role="alert">{error}</div>}
        <button type="submit" className="btn btn--primary calendar-schedule-submit" disabled={saving}>{saving ? 'Saving…' : 'Add to booked schedule'}</button>
      </form>
    </div>
  )
}

function SchedulePrint({ bounds, events, label }) {
  const days = useMemo(() => {
    if (!bounds) return []
    const start = parseDateKey(bounds.start)
    const end = parseDateKey(bounds.end)
    const result = []
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) result.push(cursor)
    return result
  }, [bounds])

  const eventMap = useMemo(() => events.reduce((groups, event) => {
    if (!groups[event.preferred_date]) groups[event.preferred_date] = []
    groups[event.preferred_date].push(event)
    return groups
  }, {}), [events])

  return (
    <div id="booking-calendar-print" className="booking-calendar-print">
      <header>
        <span>JONATHAN PHOTOGRAPHY / STUDIO CALENDAR</span>
        <h2>{label}</h2>
        <p>{bounds ? `${formatDate(bounds.start)} — ${formatDate(bounds.end)}` : ''}</p>
      </header>
      <div className="booking-calendar-print__grid">
        {days.map((day) => {
          const key = toDateKey(day)
          return (
            <div className="booking-calendar-print__day" key={key}>
              <strong>{day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
              {(eventMap[key] || []).map((event) => (
                <div className="booking-calendar-print__event" key={event.id}>
                  <b>{event.name}</b>
                  <span>{event.shoot_type} · {eventProgress(event)}</span>
                  <small>{event.location || 'Location pending'}</small>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CalendarWorkspace({ archive = false }) {
  const { showToast } = useToast()
  const now = new Date()
  const [month, setMonth] = useState(() => archive
    ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1))
  const [events, setEvents] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [exportRange, setExportRange] = useState('monthly')
  const [exporting, setExporting] = useState(false)
  const [printData, setPrintData] = useState({ bounds: null, events: [], label: '' })
  const [requests, setRequests] = useState([])
  const [addDate, setAddDate] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    setEvents(null)
    const bounds = monthBounds(month)
    bookingsApi.calendar(bounds.start, bounds.end)
      .then((data) => { if (active) setEvents(Array.isArray(data) ? data : []) })
      .catch(() => { if (active) setEvents([]) })
    return () => { active = false }
  }, [month, refreshKey])

  useEffect(() => {
    if (archive) return
    bookingsApi.list({ status: 'NEW' })
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]))
  }, [archive, refreshKey])

  const eventUpdated = async (id, status) => {
    try {
      await bookingsApi.updateCalendarEvent(id, status)
      setSelectedDay(null)
      setRefreshKey((key) => key + 1)
      showToast('Calendar event updated.', 'success')
    } catch (err) {
      showToast(err.message || 'Unable to update this calendar event.', 'error')
    }
  }

  const exportCalendar = async () => {
    const range = archive ? 'monthly' : exportRange
    const bounds = rangeBounds(range, month)
    setExporting(true)
    try {
      const data = await bookingsApi.calendar(bounds.start, bounds.end)
      const label = `${range.charAt(0).toUpperCase() + range.slice(1)} booking calendar`
      setPrintData({ bounds, events: Array.isArray(data) ? data : [], label })
      await new Promise((resolve) => setTimeout(resolve, 80))
      const element = document.getElementById('booking-calendar-print')
      await html2pdf().set({
        margin: 0.35,
        filename: `Booking_Calendar_${range}_${bounds.start}_${bounds.end}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
      }).from(element).save()
    } finally {
      setExporting(false)
    }
  }

  const totals = (events || []).reduce((counts, event) => {
    counts[eventProgress(event).toLowerCase()] += 1
    return counts
  }, { upcoming: 0, finished: 0, cancelled: 0 })

  return (
    <div className={`booking-calendar-workspace ${archive ? 'booking-calendar-workspace--archive' : ''}`}>
      <div className="booking-calendar-toolbar">
        <div>
          <span>{archive ? 'Monthly records' : 'Confirmed schedule'}</span>
          <strong>{archive ? 'Calendar archive' : 'Studio booking calendar'}</strong>
        </div>
        <div className="booking-calendar-toolbar__actions">
          {!archive && (
            <button type="button" className="btn booking-calendar-add" onClick={() => setAddDate(toDateKey(new Date()))}>
              <Plus size={16} /> Add booked work
            </button>
          )}
          {!archive && (
            <select value={exportRange} onChange={(event) => setExportRange(event.target.value)} aria-label="PDF calendar range">
              <option value="weekly">Weekly PDF</option>
              <option value="biweekly">Bi-weekly PDF</option>
              <option value="monthly">Monthly PDF</option>
            </select>
          )}
          <button type="button" className="btn btn--primary" disabled={exporting} onClick={exportCalendar}>
            <Download size={16} /> {exporting ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="booking-calendar-summary">
        <span><i className="upcoming" /> Upcoming <strong>{totals.upcoming}</strong></span>
        <span><i className="finished" /> Finished <strong>{totals.finished}</strong></span>
        <span><i className="cancelled" /> Cancelled <strong>{totals.cancelled}</strong></span>
      </div>

      {events === null ? <LoadingState label="Loading booking calendar…" /> : (
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          events={events}
          maximumMonth={archive ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : null}
          onDayClick={(date, dayEvents) => {
            if (dayEvents.length) setSelectedDay({ date, events: dayEvents })
            else if (!archive) setAddDate(date)
          }}
        />
      )}

      {!archive && <Link to="/admin/archive" className="booking-calendar-archive-link">Browse past monthly calendars →</Link>}

      <div className="booking-calendar-print-host" aria-hidden="true">
        <SchedulePrint {...printData} />
      </div>

      <CalendarEventDialog date={selectedDay?.date} events={selectedDay?.events || []} onClose={() => setSelectedDay(null)} onEventUpdated={eventUpdated} />
      {addDate && (
        <AddScheduleDialog
          initialDate={addDate}
          requests={requests}
          onClose={() => setAddDate(null)}
          onSaved={() => {
            setAddDate(null)
            setRefreshKey((key) => key + 1)
            showToast('Booked work added to the calendar.', 'success')
          }}
        />
      )}
    </div>
  )
}

export function CalendarArchivePanel() {
  return <CalendarWorkspace archive />
}

export default function AdminBookingCalendar() {
  useEffect(() => { document.title = 'Admin — Booking Calendar' }, [])

  return (
    <section className="admin-booking-calendar-page">
      <div className="admin-content admin-booking-calendar-content">
        <header className="admin-booking-calendar-hero">
          <div>
            <span>Bookings / Schedule</span>
            <h2>Calendar</h2>
            <p>Confirmed work, completed events, and cancellations in one monthly view.</p>
          </div>
          <CalendarDays size={34} />
        </header>
        <CalendarWorkspace />
      </div>
    </section>
  )
}
