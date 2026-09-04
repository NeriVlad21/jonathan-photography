import { useEffect } from 'react'
import ContactFilmStrip from '../components/ContactFilmStrip.jsx'
import PageHero from '../components/PageHero.jsx'

export default function Contact() {
  useEffect(() => {
    document.title = 'Jonathan Photography — Contact'
  }, [])

  return (
    <>
      <PageHero
        eyebrow="Contact / 05"
        title="Let’s start a conversation."
        intro="Tell us what is happening, where it is, and when. Choose the channel that is easiest for you—we check them all."
        note="Usually replies within 1–2 days"
      />
      <section className="contact-directory">
        <div className="container">
          <ContactFilmStrip />
        </div>
      </section>
    </>
  )
}
