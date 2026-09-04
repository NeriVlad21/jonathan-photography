import { useEffect, useState } from 'react'
import { Instagram, Facebook, Phone, Mail, Link as LinkIcon } from 'lucide-react'
import { contactsApi } from '../services/api.js'
import LoadingState from './LoadingState.jsx'
import EmptyState from './EmptyState.jsx'

const ICONS = { instagram: Instagram, facebook: Facebook, phone: Phone, mail: Mail, email: Mail, link: LinkIcon }

export default function ContactFilmStrip() {
  const [platforms, setPlatforms] = useState(null)

  useEffect(() => {
    contactsApi.list().then(setPlatforms).catch(() => setPlatforms([]))
  }, [])

  if (platforms === null) return <LoadingState label="Loading contact details…" />
  if (platforms.length === 0) {
    return <EmptyState title="No contact platforms yet." body="Check back soon." />
  }

  return (
    <div className="filmstrip">
      {platforms.map((p, i) => {
        const Icon = ICONS[p.icon] || LinkIcon
        return (
          <a
            key={p.id}
            href={p.link}
            target={p.link.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="filmstrip__frame"
          >
            <span className="filmstrip__index">{String(i + 1).padStart(2, '0')}</span>
            <div className="filmstrip__content">
              <div className="filmstrip__copy">
                <div className="filmstrip__label">
                  <Icon size={18} aria-hidden="true" />
                  {p.label}
                </div>
                {p.tagline && <p className="filmstrip__tagline">{p.tagline}</p>}
              </div>
              {p.handle && <p className="filmstrip__handle">{p.handle}</p>}
            </div>
            <span className="filmstrip__arrow" aria-hidden="true">↗</span>
          </a>
        )
      })}
    </div>
  )
}
