import { useEffect } from 'react'
import EstimatorComponent from '../components/Estimator.jsx'
import { useEstimator } from '../hooks/useEstimator.js'
import PageHero from '../components/PageHero.jsx'

export default function EstimatorPage() {
  const estimator = useEstimator()

  useEffect(() => {
    document.title = 'Jonathan Photography — Estimator'
  }, [])

  return (
    <>
      <PageHero
        eyebrow="Estimate / 03"
        title="Build a package that fits."
        intro="Choose the coverage and extras you need. Your working estimate updates instantly and can be refined with us later."
        note="Plan with confidence"
      />
      <section className="page-content">
        <div className="container">
          <EstimatorComponent estimator={estimator} />
        </div>
      </section>
    </>
  )
}
