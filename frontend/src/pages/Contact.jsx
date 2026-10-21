import { useEffect } from 'react'
import ContactFilmStrip from '../components/ContactFilmStrip.jsx'
import PageHero from '../components/PageHero.jsx'
import { MapPin } from 'lucide-react'
import { useSiteContent } from '../context/SiteContentContext.jsx'
import { getStudioAddress, getStudioMapUrls } from '../utils/studioLocation.js'

export default function Contact() {
  const content = useSiteContent()
  const { contactPage } = content
  const studioAddress = getStudioAddress(content)
  const map = getStudioMapUrls(studioAddress, content.brand?.mapLatitude, content.brand?.mapLongitude, content.brand?.mapLink)
  useEffect(() => {
    document.title = 'Jonathan Photography — Contact'
  }, [])

  return (
    <>
      <PageHero
        eyebrow={contactPage.eyebrow}
        title={contactPage.title}
        intro={contactPage.intro}
        note={contactPage.note}
      />
      <section className="contact-directory">
        <div className="container">
          <ContactFilmStrip />
          {studioAddress && <div className="contact-studio">
            <MapPin size={18} aria-hidden="true" />
            <div>
              <h2 className="contact-studio__label">{content.about.studioLocationLabel}</h2>
              <address className="studio-address">{studioAddress}</address>
            </div>
            <a className="text-link" href={map.link} target="_blank" rel="noreferrer">View on Google Maps<span className="visually-hidden"> (opens in a new tab)</span></a>
          </div>}
        </div>
      </section>
    </>
  )
}
