import { useEffect } from 'react'
import ContactFilmStrip from '../components/ContactFilmStrip.jsx'

export default function Contact() {
  useEffect(() => {
    document.title = 'Jonathan Photography — Contact'
  }, [])

  return (
    <>
      <section className="section" style={{ paddingTop: 'clamp(120px, 16vw, 180px)', paddingBottom: 40 }}>
        <div className="container">
          <span className="eyebrow">Get In Touch</span>
          <h1 className="display" style={{ fontSize: 'var(--fluid-h1)', margin: '14px 0 20px' }}>How to Find Us</h1>
          <p style={{ color: 'var(--c-gray)', maxWidth: '56ch', fontSize: '1.05rem' }}>
            Pick whichever platform suits the moment. We check all of them.
          </p>
        </div>
      </section>
      <section className="section--dark section--tight">
        <div className="container">
          <ContactFilmStrip />
        </div>
      </section>
    </>
  )
}
