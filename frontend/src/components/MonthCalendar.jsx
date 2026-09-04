import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const pad = (value) => String(value).padStart(2, '0')

export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const monthKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`

export const monthBounds = (date) => ({
  start: `${monthKey(date)}-01`,
  end: toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0))
})

export const addDays = (date, amount) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export default function MonthCalendar({
  month,
  onMonthChange,
  selectedDate = '',
  onDayClick,
  unavailableDates = [],
  events = [],
  minimumDate = '',
  maximumMonth = null,
  availabilityMode = false,
  compact = false,
  disabled = false,
  readOnly = false
}) {
  const unavailable = useMemo(() => new Set(unavailableDates), [unavailableDates])
  const eventsByDate = useMemo(() => {
    return events.reduce((groups, event) => {
      const key = event.preferred_date
      if (!key) return groups
      if (!groups[key]) groups[key] = []
      groups[key].push(event)
      return groups
    }, {})
  }, [events])

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const cursor = new Date(month.getFullYear(), month.getMonth(), 1 - first.getDay())
    return Array.from({ length: 42 }, (_, index) => addDays(cursor, index))
  }, [month])

  const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1)
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const todayMonth = new Date()
  todayMonth.setDate(1)
  todayMonth.setHours(0, 0, 0, 0)
  const canGoPrevious = !availabilityMode || previousMonth >= todayMonth
  const canGoNext = !maximumMonth || nextMonth <= maximumMonth

  return (
    <div className={`month-calendar ${compact ? 'month-calendar--compact' : ''} ${availabilityMode ? 'month-calendar--availability' : ''}`}>
      <div className="month-calendar__header">
        <div>
          <span className="month-calendar__eyebrow">Calendar</span>
          <h3>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        </div>
        <div className="month-calendar__nav">
          <button type="button" disabled={!canGoPrevious} onClick={() => onMonthChange(previousMonth)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <button type="button" disabled={!canGoNext} onClick={() => onMonthChange(nextMonth)} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="month-calendar__weekdays">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>

      <div className="month-calendar__grid">
        {days.map((date) => {
          const key = toDateKey(date)
          const outside = date.getMonth() !== month.getMonth()
          const unavailableDay = unavailable.has(key)
          const past = minimumDate && key < minimumDate
          const dayEvents = eventsByDate[key] || []
          const dayDisabled = disabled || readOnly || outside || past || (availabilityMode && unavailableDay)

          return (
            <button
              type="button"
              key={key}
              className={`month-calendar__day ${outside ? 'is-outside' : ''} ${unavailableDay ? 'is-unavailable' : ''} ${selectedDate === key ? 'is-selected' : ''} ${dayEvents.length ? 'has-events' : ''}`}
              disabled={dayDisabled}
              aria-pressed={selectedDate === key}
              aria-label={`${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}${unavailableDay ? ', unavailable' : availabilityMode ? ', available' : ''}`}
              onClick={() => onDayClick?.(key, dayEvents)}
            >
              <span className="month-calendar__number">{date.getDate()}</span>

              {availabilityMode && !outside && !past && (
                <small>{unavailableDay ? 'Booked' : 'Available'}</small>
              )}

              {!availabilityMode && dayEvents.length > 0 && (
                <span className="month-calendar__events">
                  {dayEvents.slice(0, 2).map((event) => (
                    <span key={event.id} className={`month-calendar__event month-calendar__event--${event.status.toLowerCase()}`}>
                      {event.name}
                    </span>
                  ))}
                  {dayEvents.length > 2 && <small>+{dayEvents.length - 2} more</small>}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
