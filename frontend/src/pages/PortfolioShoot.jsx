import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EditorialImage from '../components/EditorialImage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { portfolioApi, assetUrl } from '../services/api.js'
import { formatDate } from '../utils/format.js'

export default function PortfolioShoot() {
  const { category, shoot } = useParams()
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    setData(null)
    setNotFound(false)
    portfolioApi.shoot(category, shoot)
      .then((d) => { setData(d); document.title = `Jonathan Photography — ${d.title}` })
      .catch(() => setNotFound(true))
  }, [category, shoot])

  // Allow users to press "Escape" to close the high-res lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxImage(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (notFound) {
    return (
      <section className="section" style={{ paddingTop: 160, textAlign: 'center' }}>
        <div className="container">
          <h1 className="display" style={{ fontSize: '2rem' }}>Story not found.</h1>
          <Link to="/portfolio" className="text-link" style={{ marginTop: 20, display: 'inline-flex' }}>← Back to Portfolio</Link>
        </div>
      </section>
    )
  }

  if (!data) return <LoadingState label="Loading the exhibition…" />

  const images = data.images || []
  const totalImages = images.length

  return (
    <article style={{ paddingBottom: 0, backgroundColor: '#FAFAFA' }}>
      {/* 
        Justin Le Inspired "Formal Exhibition" Styles 
      */}
      <style>{`
        .exhibition-header {
          padding: clamp(120px, 16vw, 180px) 0 80px 0;
          border-bottom: 1px solid #E5E5E5;
          margin-bottom: 80px;
        }

        .exhibition-container {
          display: flex;
          flex-direction: column;
          gap: 15vh; /* Massive breathing room between photos */
          padding: 0 5%;
          max-width: 1400px;
          margin: 0 auto;
        }

        .exhibition-item {
          display: flex;
          flex-direction: column;
          position: relative;
          width: 100%;
          max-width: 900px;
        }

        /* Artistic staggered alignment */
        .exhibition-item:nth-child(3n+1) { align-self: flex-start; }
        .exhibition-item:nth-child(3n+2) { align-self: flex-end; }
        .exhibition-item:nth-child(3n) { align-self: center; max-width: 1100px; }

        .exhibition-counter {
          font-family: monospace;
          font-size: 0.85rem;
          color: #999;
          letter-spacing: 2px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .exhibition-counter::after {
          content: '';
          display: block;
          width: 40px;
          height: 1px;
          background-color: #D1D1D1;
        }

        .exhibition-image-wrapper {
          position: relative;
          cursor: zoom-in;
          overflow: hidden;
          background-color: #F0F0F0;
        }

        .exhibition-image-wrapper img {
          width: 100%;
          display: block;
          object-fit: cover;
          transition: transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.5s ease;
        }

        .exhibition-image-wrapper:hover img {
          transform: scale(1.02);
          filter: brightness(0.95);
        }
        
        .exhibition-caption {
          margin-top: 16px;
          font-size: 0.9rem;
          color: #666;
          font-weight: 300;
          letter-spacing: 0.5px;
        }

        /* Justin Le Style Marquee */
        .marquee-wrapper {
          overflow: hidden;
          white-space: nowrap;
          border-top: 1px solid #E5E5E5;
          border-bottom: 1px solid #E5E5E5;
          padding: 24px 0;
          margin-top: 15vh;
          background: #fff;
        }
        
        .marquee-content {
          display: inline-block;
          animation: marquee 25s linear infinite;
          font-family: serif;
          font-size: 1.5rem;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 4px;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* Lightbox (Unchanged - Keeps the 100MB viewing experience intact) */
        .lightbox-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(250, 250, 250, 0.98);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 40px; cursor: zoom-out;
        }
        .lightbox-image {
          max-width: 100%; max-height: 90vh;
          object-fit: contain; box-shadow: 0 30px 80px rgba(0,0,0,0.1);
          cursor: default;
        }
        .lightbox-close {
          position: absolute; top: 30px; right: 40px;
          background: none; border: none; font-size: 12px;
          font-weight: 600; text-transform: uppercase; letter-spacing: 2px;
          cursor: pointer; color: #000;
        }
      `}</style>

      {/* =========================================
          1. STARK EDITORIAL HEADER
      ========================================= */}
      <header className="exhibition-header">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to={`/portfolio/${category}`} className="text-link" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '4px', color: '#999', marginBottom: '20px' }}>
            ← {data.category_name}
          </Link>
          
          <h1 className="display" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', margin: 0, fontWeight: 400, letterSpacing: '-1px' }}>
            {data.title}
          </h1>
          
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginTop: '32px' }}>
            {data.shoot_date && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#999' }}>Date</span> 
                <span style={{ fontSize: '0.9rem', color: '#000', marginTop: '4px' }}>{formatDate(data.shoot_date)}</span>
              </div>
            )}
            {data.location && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#999' }}>Location</span> 
                <span style={{ fontSize: '0.9rem', color: '#000', marginTop: '4px' }}>{data.location}</span>
              </div>
            )}
          </div>
          
          {data.description && (
            <p style={{ maxWidth: '600px', marginTop: 48, fontSize: '1.05rem', color: '#555', lineHeight: 1.8, fontWeight: 300 }}>
              {data.description}
            </p>
          )}
        </div>
      </header>

      {/* =========================================
          2. THE EXHIBITION SCROLL
      ========================================= */}
      <div className="exhibition-container">
        {images.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', fontStyle: 'italic' }}>Archive empty.</p>
        ) : (
          images.map((img, index) => {
            // Format number as 01, 02, etc.
            const currentNum = String(index + 1).padStart(2, '0');
            const totalNum = String(totalImages).padStart(2, '0');

            return (
              <div key={img.id} className="exhibition-item">
                
                {/* Minimalist Fractional Counter */}
                <div className="exhibition-counter">
                  {currentNum} / {totalNum}
                </div>

                <div 
                  className="exhibition-image-wrapper"
                  onClick={() => setLightboxImage(img)}
                >
                  <EditorialImage 
                    src={img.image_path} 
                    alt={img.title || data.title} 
                  />
                </div>
                
                {(img.title || img.caption) && (
                  <div className="exhibition-caption">
                    {img.title && <strong style={{ color: '#000', marginRight: '10px' }}>{img.title}</strong>}
                    {img.caption}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* =========================================
          3. THE MARQUEE FOOTER
      ========================================= */}
      <div className="marquee-wrapper">
        <div className="marquee-content">
          {/* We repeat the text to ensure a seamless infinite scroll loop */}
          BOOK A SESSION AT JONATHAN PHOTOGRAPHY • INQUIRE FOR AVAILABILITY • BOOK A SESSION AT JONATHAN PHOTOGRAPHY • INQUIRE FOR AVAILABILITY • BOOK A SESSION AT JONATHAN PHOTOGRAPHY • INQUIRE FOR AVAILABILITY • BOOK A SESSION AT JONATHAN PHOTOGRAPHY • INQUIRE FOR AVAILABILITY • 
        </div>
      </div>

      {/* =========================================
          4. FULL SCREEN HIGH-RES LIGHTBOX
      ========================================= */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
            Close [ESC]
          </button>
          
          <img 
            src={assetUrl(lightboxImage.image_path)} 
            alt={lightboxImage.title || data.title} 
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </article>
  )
}