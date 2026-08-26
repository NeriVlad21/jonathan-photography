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
            <div className="filmstrip__sprockets" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
            <div>
              <span className="filmstrip__index">FRAME {String(i + 1).padStart(2, '0')}</span>
              <div className="filmstrip__label">
                <Icon size={22} style={{ marginRight: 12, verticalAlign: '-4px', color: '#F5D000' }} />
                {p.label}
              </div>
              {p.tagline && <p className="filmstrip__tagline">"{p.tagline}"</p>}
              {p.handle && <p className="filmstrip__handle">{p.handle}</p>}
              <span className="text-link" style={{ color: '#F7F7F5' }}>Open {p.label} →</span>
            </div>
          </a>
        )
      })}
    </div>
  )
}
