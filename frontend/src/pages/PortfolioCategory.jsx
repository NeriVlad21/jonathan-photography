import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EditorialImage from '../components/EditorialImage.jsx'
import LoadingState from '../components/LoadingState.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { portfolioApi } from '../services/api.js'

export default function PortfolioCategory() {
  const { category } = useParams()

  const [images, setImages] = useState(null)
  const [categories, setCategories] = useState([])

  const imageRefs = useRef([])

  useEffect(() => {
    let cancelled = false

    setImages(null)
    imageRefs.current = []

    portfolioApi
      .imagesByCategory(category)
      .then((data) => {
        if (cancelled) return

        setImages(
          Array.isArray(data)
            ? data
            : []
        )
      })
      .catch(() => {
        if (cancelled) return

        setImages([])
      })

    portfolioApi
      .categories()
      .then((data) => {
        if (cancelled) return

        setCategories(
          Array.isArray(data)
            ? data
            : []
        )
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [category])

  const currentName =
    categories.find(
      (c) => c.slug === category
    )?.name || category

  useEffect(() => {
    document.title =
      `Jonathan Photography — ${currentName}`
  }, [currentName])

  /*
    ============================================================
    RESPONSIVE COLUMNS
    ============================================================
    3 columns desktop
    2 columns tablet
    1 column mobile
  */

  const getColumnCount = () => {
    if (typeof window === 'undefined') {
      return 3
    }

    if (window.innerWidth <= 600) {
      return 1
    }

    if (window.innerWidth <= 900) {
      return 2
    }

    return 3
  }

  const [columnCount, setColumnCount] =
    useState(getColumnCount)

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount())
    }

    window.addEventListener(
      'resize',
      handleResize
    )

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      )
    }
  }, [])

  /*
    ============================================================
    DISTRIBUTE PHOTOS INTO INDEPENDENT STACKS
    ============================================================
  */

  const columns = useMemo(() => {
    if (!images || images.length === 0) {
      return []
    }

    const result = Array.from(
      { length: columnCount },
      () => []
    )

    images.forEach((image, index) => {
      result[
        index % columnCount
      ].push({
        image,
        originalIndex: index
      })
    })

    return result
  }, [images, columnCount])

  /*
    ============================================================
    SCROLL REVEAL
    ============================================================
  */

  useEffect(() => {
    if (!images || images.length === 0) {
      return
    }

    const elements =
      imageRefs.current.filter(Boolean)

    if (!elements.length) {
      return
    }

    if (
      !('IntersectionObserver' in window)
    ) {
      elements.forEach((element) => {
        element.classList.add(
          'portfolio-photo--visible'
        )
      })

      return
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting
            ) {
              entry.target.classList.add(
                'portfolio-photo--visible'
              )

              observer.unobserve(
                entry.target
              )
            }
          })
        },
        {
          threshold: 0.08,
          rootMargin:
            '0px 0px -8% 0px'
        }
      )

    elements.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
    }
  }, [images, columnCount])

  /*
    ============================================================
    PHOTO
    ============================================================
  */

  const renderPhoto = ({
    image,
    originalIndex
  }) => {
    return (
      <article
        key={image.id}
        ref={(element) => {
          imageRefs.current[
            originalIndex
          ] = element
        }}
        className="portfolio-photo"
      >
        <EditorialImage
          src={image.image_path}
          alt={
            image.title ||
            `${currentName} photograph ${
              originalIndex + 1
            }`
          }
        />

        <span className="portfolio-photo-index">
          {String(
            originalIndex + 1
          ).padStart(2, '0')}
        </span>
      </article>
    )
  }

  return (
    <section className="portfolio-category-page">
      <style>{`

        /*
        ============================================================
        PAGE
        ============================================================
        */

        .portfolio-category-page {
          width: 100%;
          min-height: 100vh;

          margin: 0;
          padding: 0;

          background:
            var(--c-bg, #fff);
        }

        /*
        ============================================================
        HEADER
        ============================================================
        */

        .portfolio-category-header {
          width: 100%;

          padding:
            clamp(95px, 10vw, 135px)
            28px
            26px;

          position: relative;
          z-index: 10;
        }

        .portfolio-category-header-inner {
          display: flex;

          align-items: flex-end;
          justify-content: space-between;

          gap: 30px;
        }

        /*
          Back link
        */

        .portfolio-category-back {
          display: inline-flex;

          align-items: center;

          color:
            var(--c-gray);

          text-decoration: none;

          text-transform: uppercase;

          font-size: 0.68rem;

          letter-spacing: 2.5px;

          white-space: nowrap;

          transition:
            color 0.25s ease;
        }

        .portfolio-category-back:hover {
          color:
            var(--c-text);
        }

        /*
        ============================================================
        GALLERY
        ============================================================
        */

        .portfolio-gallery {
          width: 100%;

          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );

          gap: 0;

          margin: 0;
          padding: 0;
        }

        /*
        ============================================================
        INDEPENDENT COLUMNS
        ============================================================
        */

        .portfolio-gallery-column {
          width: 100%;

          display: flex;

          flex-direction: column;

          gap: 0;

          margin: 0;
          padding: 0;
        }

        /*
        ============================================================
        PHOTO
        ============================================================
        */

        .portfolio-photo {
          width: 100%;

          position: relative;

          margin: 0;
          padding: 0;

          overflow: hidden;

          opacity: 0;

          transform:
            translateY(65px)
            scale(0.985);

          transition:
            opacity 1s
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              ),

            transform 1.15s
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              );

          will-change:
            opacity,
            transform;
        }

        .portfolio-photo--visible {
          opacity: 1;

          transform:
            translateY(0)
            scale(1);
        }

        /*
        ============================================================
        EDITORIAL IMAGE
        ============================================================
        */

        .portfolio-photo
        .editorial-image {
          width: 100%;

          margin: 0;
          padding: 0;
        }

        .portfolio-photo
        .editorial-image img {
          display: block;

          width: 100%;
          height: auto;

          margin: 0;
          padding: 0;

          object-fit: cover;

          transition:
            transform 1.4s
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              );

          will-change:
            transform;
        }

        /*
        ============================================================
        HOVER
        ============================================================
        */

        .portfolio-photo:hover
        .editorial-image img {
          transform:
            scale(1.025);
        }

        /*
        ============================================================
        NUMBER
        ============================================================
        */

        .portfolio-photo-index {
          position: absolute;

          left: 14px;
          bottom: 12px;

          z-index: 3;

          color: #fff;

          font-size: 0.62rem;

          letter-spacing: 2px;

          line-height: 1;

          opacity: 0;

          transform:
            translateY(8px);

          transition:
            opacity 0.35s ease,
            transform 0.35s ease;

          pointer-events: none;

          text-shadow:
            0 2px 10px
            rgba(
              0,
              0,
              0,
              0.45
            );
        }

        .portfolio-photo:hover
        .portfolio-photo-index {
          opacity: 1;

          transform:
            translateY(0);
        }

        /*
        ============================================================
        TABLET
        ============================================================
        */

        @media (max-width: 900px) {

          .portfolio-gallery {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .portfolio-category-header {
            padding-left: 20px;
            padding-right: 20px;
          }

        }

        /*
        ============================================================
        MOBILE
        ============================================================
        */

        @media (max-width: 600px) {

          .portfolio-category-header {
            padding-top: 100px;
            padding-bottom: 22px;
          }

          /*
            Keep your ORIGINAL display font.
          */

          .portfolio-category-header-inner {
            align-items: flex-start;

            flex-direction: column;

            gap: 18px;
          }

          .portfolio-gallery {
            grid-template-columns: 1fr;
          }

          .portfolio-photo-index {
            opacity: 1;
          }

        }

        /*
        ============================================================
        REDUCED MOTION
        ============================================================
        */

        @media (
          prefers-reduced-motion: reduce
        ) {

          .portfolio-photo {
            opacity: 1;

            transform: none;

            transition: none;
          }

          .portfolio-photo
          .editorial-image img {
            transition: none;
          }

          .portfolio-category-back {
            transition: none;
          }

        }

      `}</style>

      {/* =========================================================
          CATEGORY HEADER
          ========================================================= */}

      <header className="portfolio-category-header">
        <div className="portfolio-category-header-inner">

          <Link
            to="/portfolio"
            className="portfolio-category-back"
          >
            ← Work
          </Link>

          {/* ORIGINAL SITE DISPLAY FONT */}
          <h1
            className="display"
            style={{
              fontSize:
                'clamp(3rem, 6vw, 5.5rem)',
              margin:
                '10px 0 0 0',
              textTransform:
                'capitalize',
              lineHeight: '1.1'
            }}
          >
            {currentName}
          </h1>

        </div>
      </header>

      {/* =========================================================
          LOADING
          ========================================================= */}

      {images === null && (
        <div
          style={{
            padding:
              '60px 20px 120px'
          }}
        >
          <LoadingState
            label="Loading gallery…"
          />
        </div>
      )}

      {/* =========================================================
          EMPTY
          ========================================================= */}

      {images &&
        images.length === 0 && (
          <div
            style={{
              padding:
                '20px 20px 120px'
            }}
          >
            <EmptyState
              title="No photographs published yet."
              body="This gallery is being updated — check back soon."
            />
          </div>
        )}

      {/* =========================================================
          GALLERY
          ========================================================= */}

      {images &&
        images.length > 0 && (
          <div className="portfolio-gallery">

            {columns.map(
              (column, columnIndex) => (
                <div
                  key={columnIndex}
                  className="portfolio-gallery-column"
                >
                  {column.map(
                    renderPhoto
                  )}
                </div>
              )
            )}

          </div>
        )}

    </section>
  )
}