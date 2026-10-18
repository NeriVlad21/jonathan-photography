// One status vocabulary for support reports: list, review dialog, archives and
// overview summaries all read from here. Every badge carries visible text, and
// tones differ in lightness as well as hue so they survive grayscale.
export const SUPPORT_STATUSES = [
  { value: 'OPEN', label: 'New', tone: 'new' },
  { value: 'IN_PROGRESS', label: 'In progress', tone: 'progress' },
  { value: 'RESOLVED', label: 'Resolved', tone: 'resolved' },
  { value: 'CLOSED', label: 'Closed', tone: 'closed' },
]

const BY_VALUE = Object.fromEntries([...SUPPORT_STATUSES, { value: 'ARCHIVED', label: 'Archived', tone: 'archived' }].map((item) => [item.value, item]))

export const supportStatusKey = (report) => (report?.archived_at ? 'ARCHIVED' : report?.status || 'OPEN')

export function SupportStatusBadge({ report, status }) {
  const key = status || supportStatusKey(report)
  const item = BY_VALUE[key] || { label: String(key).replace('_', ' ').toLowerCase(), tone: 'closed' }
  return <span className={`support-status support-status--${item.tone}`}>{item.label}</span>
}

export function SupportPriorityBadge({ priority }) {
  if (priority !== 'URGENT') return null
  return <span className="support-status support-status--urgent">Urgent</span>
}
