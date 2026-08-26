import { useEffect } from 'react'
import EstimatorComponent from '../components/Estimator.jsx'
import { useEstimator } from '../hooks/useEstimator.js'

export default function EstimatorPage() {
  const estimator = useEstimator()

  useEffect(() => {
    document.title = 'Jonathan Photography — Estimator'
  }, [])

  return (
    <section className="section" style={{ paddingTop: 'clamp(120px, 16vw, 180px)' }}>
      <div className="container">
        <span className="eyebrow">Build Your Package</span>
        <h1 className="display" style={{ fontSize: 'var(--fluid-h1)', margin: '14px 0 20px' }}>Estimator</h1>
        <p style={{ color: 'var(--c-gray)', maxWidth: '56ch', fontSize: '1.05rem', marginBottom: 56 }}>
          Choose your coverage and add-ons — the total updates instantly.
          This is a baseline; we're happy to fine-tune it during a consultation.
        </p>
        <EstimatorComponent estimator={estimator} />
      </div>
    </section>
  )
}
