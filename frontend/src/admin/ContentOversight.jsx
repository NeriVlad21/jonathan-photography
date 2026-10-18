import { useEffect, useMemo, useState } from 'react'
import AdminDialog, { AdminDialogField, AdminDialogSummary } from '../components/AdminDialog.jsx'
import { AlertTriangle, Flag, Search, ShieldCheck } from 'lucide-react'
import { assetUrl, contentOversightApi } from '../services/api.js'
import { DEFAULT_SITE_CONTENT, mergeSiteContent } from '../content/defaultSiteContent.js'
import { useToast } from '../context/ToastContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { formatDate } from '../utils/format.js'

const CONTENT_TABS = [
  { id: 'home', label: 'Home & About', description: 'Hero, introduction and homepage sections', keys: ['brand', 'navigation', 'hero', 'introduction', 'about', 'selectedWork', 'servicesHome', 'estimatorCta'] },
  { id: 'music', label: 'Music', description: 'Playlist heading and songs', keys: ['music'] },
  { id: 'faq', label: 'FAQ', description: 'Questions and answers', keys: ['faq'] },
  { id: 'services', label: 'Services', description: 'Page labels and service groups', keys: ['servicesPage'] },
  { id: 'contact', label: 'Contact & Footer', description: 'Contact page and footer copy', keys: ['contactPage', 'footer'] },
  { id: 'pages', label: 'Portfolio & Booking', description: 'Work page and booking guidance', keys: ['portfolioPage', 'bookingPage'] },
]

const SECTION_TITLES = {
  brand: 'Brand identity', navigation: 'Public navigation', hero: 'Brand & hero', introduction: 'Homepage introduction',
  about: 'About section', selectedWork: 'Selected work', servicesHome: 'Homepage services', estimatorCta: 'Estimator call to action',
  music: 'Playlist', faq: 'Frequently asked questions', servicesPage: 'Services page', contactPage: 'Contact page',
  footer: 'Footer', portfolioPage: 'Portfolio page & videos', bookingPage: 'Booking page copy',
}

function humanize(value) {
  return String(value).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase())
}

function ReadOnlyField({ label, value }) {
  const text = value == null ? '' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
  const multiline = text.length > 90 || text.includes('\n')
  return <label className="oversight-field"><span>{humanize(label)}</span>{multiline ? <textarea readOnly rows={Math.min(6, Math.max(3, text.split('\n').length + 1))} value={text} /> : <input readOnly value={text} />}</label>
}

function ReadOnlyContent({ value, path = '' }) {
  if (Array.isArray(value)) {
    if (!value.length) return <p className="oversight-empty-value">No entries added.</p>
    if (value.every((item) => item == null || typeof item !== 'object')) return <ReadOnlyField label={path} value={value.join('\n')} />
    return <div className="oversight-repeat">{value.map((item, index) => <div className="oversight-repeat__item" key={`${path}-${index}`}><strong>{humanize(path)} {index + 1}</strong><ReadOnlyContent value={item} path="" /></div>)}</div>
  }
  if (value && typeof value === 'object') {
    return <div className="oversight-fields">{Object.entries(value).map(([key, item]) => {
      if (key === 'image' && typeof item === 'string' && item) return <div className="oversight-image" key={key}><span>Hero image</span><img src={assetUrl(item)} alt="Owner-selected hero" /><small>{item}</small></div>
      if (Array.isArray(item) || (item && typeof item === 'object')) return <div className="oversight-nested" key={key}><ReadOnlyContent value={item} path={key} /></div>
      return <ReadOnlyField key={key} label={key} value={item} />
    })}</div>
  }
  return <ReadOnlyField label={path || 'Value'} value={value} />
}

export default function ContentOversight() {
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [review, setReview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [reasonError, setReasonError] = useState('')
  const [filters, setFilters] = useState({ q: '', status: 'ALL', from: '', to: '' })

  const load = () => contentOversightApi.list().then((result) => setData({ ...result, content: mergeSiteContent(result.content) })).catch((error) => showToast(error.message || 'Unable to load website content.', 'error'))
  useEffect(() => { document.title = 'Super Admin — Content Oversight'; load() }, [])

  const activeDefinition = CONTENT_TABS.find((tab) => tab.id === activeTab) || CONTENT_TABS[0]
  const sections = useMemo(() => {
    if (!data) return []
    const updatedDate = (data.content_updated_at || '').slice(0, 10)
    return activeDefinition.keys.map((key) => ({
      key,
      title: SECTION_TITLES[key] || humanize(key),
      value: data.content?.[key] ?? DEFAULT_SITE_CONTENT[key] ?? {},
      warning: data.warnings?.[key] || null,
    })).filter((section) => {
      const text = `${section.title} ${JSON.stringify(section.value)} ${section.warning?.reason || ''}`.toLowerCase()
      const warningMatch = filters.status === 'ALL' || (filters.status === 'FLAGGED' ? Boolean(section.warning) : !section.warning)
      return (!filters.q || text.includes(filters.q.toLowerCase())) && warningMatch && (!filters.from || updatedDate >= filters.from) && (!filters.to || updatedDate <= filters.to)
    })
  }, [activeDefinition, data, filters])

  const openReview = (section, status) => { setReasonError(''); setReview({ ...section, status, reason: '' }) }

  const saveWarning = async () => {
    const reason = review.reason.trim()
    if (review.status === 'FLAGGED' && reason.length < 5) {
      setReasonError(reason ? 'Enter at least 5 characters.' : 'Enter a reason for this warning.')
      return
    }
    setSaving(true)
    try {
      const result = await contentOversightApi.update({ entity_key: review.key, status: review.status, reason })
      // Update the affected section in place; no reload of the workspace.
      setData((current) => {
        const warnings = { ...(current.warnings || {}) }
        if (result.moderation_status === 'FLAGGED') warnings[review.key] = { ...(warnings[review.key] || {}), reason: result.moderation_reason, updated_at: new Date().toISOString() }
        else delete warnings[review.key]
        return { ...current, warnings }
      })
      setSaving(false)
      setReview(null)
      showToast(result.message)
    } catch (error) {
      setReasonError(error.message || 'Unable to update the warning.')
      showToast(error.message || 'Unable to update the warning.', 'error')
    } finally { setSaving(false) }
  }

  if (!data) return <LoadingState label="Loading content oversight…" />

  return <section className="admin-content super-admin-content">
    <header className="platform-fees-hero"><div><span>Website / Read-only review</span><h2>Content Oversight</h2><p>Review the same website copy managed by the Owner. Issue a warning when a section may be inappropriate or unsafe; only the Owner can edit and publish the content.</p></div><ShieldCheck size={34} /></header>
    <div className="content-safety-note"><ShieldCheck size={18} /><span>{data.sanitization_note}</span></div>

    <div className="super-filterbar support-filterbar oversight-filterbar"><label className="support-filterbar__search"><Search size={16} aria-hidden="true" /><input aria-label="Search website content" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Search website content…" /></label><select aria-label="Filter by review state" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="ALL">All review states</option><option value="CLEAR">No warning</option><option value="FLAGGED">Warning issued</option></select><input type="date" aria-label="Updated from" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /><input type="date" aria-label="Updated to" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></div>

    <div className="oversight-workspace">
      <nav className="oversight-tabs" aria-label="Website content sections"><span>Choose a section</span>{CONTENT_TABS.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)}><strong>{tab.label}</strong><small>{tab.description}</small></button>)}</nav>
      <div className="oversight-content">
        <header><div><span>Read-only owner content</span><h3>{activeDefinition.label}</h3></div><time>Last updated {formatDate(data.content_updated_at)}</time></header>
        {sections.length ? sections.map((section) => <article className={`oversight-section ${section.warning ? 'has-warning' : ''}`} key={section.key}>
          <div className="oversight-section__head"><div><h4>{section.title}</h4>{section.warning && <p><AlertTriangle size={16} /><span><strong>Review warning:</strong> {section.warning.reason}</span></p>}</div>{section.warning ? <button className="btn admin-btn--secondary" type="button" onClick={() => openReview(section, 'CLEAR')}>Clear warning</button> : <button className="btn admin-btn--warning" type="button" onClick={() => openReview(section, 'FLAGGED')}><Flag size={16} aria-hidden="true" /> Issue warning</button>}</div>
          <ReadOnlyContent value={section.value} />
        </article>) : <div className="support-empty">No content in this section matches the current filters.</div>}
      </div>
    </div>

    <AdminDialog
      open={Boolean(review)}
      title={review?.status === 'CLEAR' ? 'Clear content warning' : 'Issue content warning'}
      description={review?.status === 'CLEAR' ? 'Removes the advisory warning from this section. The Owner’s content is not changed.' : 'Asks the Owner to review this section. The content is never changed or hidden by this action.'}
      onClose={() => { if (!saving) setReview(null) }}
      onSubmit={saveWarning}
      busy={saving}
      submitLabel={review?.status === 'CLEAR' ? 'Clear warning' : 'Send warning'}
      submitTone={review?.status === 'CLEAR' ? 'primary' : 'warning'}
    >
      <AdminDialogSummary items={review ? [
        { label: 'Section', value: review.title },
        { label: 'Current state', value: review.warning ? `Warning issued: ${review.warning.reason}` : 'No warning' },
      ] : []} />
      {review?.status === 'FLAGGED' && <AdminDialogField
        label="Warning reason"
        value={review.reason}
        onChange={(value) => { setReview((current) => ({ ...current, reason: value })); if (reasonError) setReasonError('') }}
        required
        multiline
        maxLength={500}
        hint="At least 5 characters. The Owner sees this reason."
        error={reasonError}
      />}
    </AdminDialog>
  </section>
}
