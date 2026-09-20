import { useEffect } from 'react'
import ContactFilmStrip from '../components/ContactFilmStrip.jsx'
import PageHero from '../components/PageHero.jsx'
import { useSiteContent } from '../context/SiteContentContext.jsx'

export default function Contact() {
  const { contactPage } = useSiteContent()
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
        </div>
      </section>
    </>
  )
}
