import { useEffect, useState } from 'react'
import { CalendarCheck2 } from 'lucide-react'
import { bookingsApi } from '../services/api.js'
import { formatDate } from '../utils/format.js'
import MonthCalendar, { monthKey, toDateKey } from './MonthCalendar.jsx'

export default function AvailabilityCalendar({ value, onChange, error }) {
  const [month, setMonth] = useState(() => {
    if (value) {
      const [year, monthNumber] = value.split('-').map(Number)
      return new Date(year, monthNumber - 1, 1)
    }
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [unavailableDates, setUnavailableDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!value) return
    const [year, monthNumber] = value.split('-').map(Number)
    setMonth(new Date(year, monthNumber - 1, 1))
  }, [value])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(false)
    bookingsApi.availability(monthKey(month))
      .then((data) => {
        if (active) setUnavailableDates(data?.unavailable_dates || [])
      })
      .catch(() => {
        if (active) {
          setUnavailableDates([])
          setLoadError(true)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [month])

  return (
    <div className={`availability-picker ${error ? 'has-error' : ''}`}>
      <div className="availability-picker__heading">
        <div>
          <span>Preferred date</span>
          <strong>{value ? formatDate(value) : 'Choose an available day'}</strong>
        </div>
        <CalendarCheck2 size={22} />
      </div>

      {loading && <div className="availability-picker__loading">Checking availability…</div>}
      {loadError && <div className="availability-picker__loading availability-picker__loading--error">Availability could not refresh. You can still choose a preferred date; we will verify it before accepting the request.</div>}

      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        selectedDate={value}
        onDayClick={(date) => onChange(date)}
        unavailableDates={unavailableDates}
        minimumDate={toDateKey(new Date())}
        availabilityMode
        compact
        disabled={loading}
      />

      <div className="availability-picker__legend">
        <span><i className="is-available" /> Available</span>
        <span><i className="is-booked" /> Booked</span>
        <span><i className="is-selected" /> Selected</span>
      </div>

      <p className="availability-picker__note">
        Select an available day for your request. The date is reserved only after the studio confirms it.
      </p>
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
