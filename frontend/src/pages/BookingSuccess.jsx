import { useEffect } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'

export default function BookingSuccess() {
  const location = useLocation()
  const { name, reference } = location.state || {}

  useEffect(() => {
    document.title = 'Jonathan Photography — Request Received'
  }, [])

  if (!reference) {
    // Direct navigation without a real submission — send them back gracefully.
    return <Navigate to="/booking" replace />
  }

  return (
    <div className="success-page">
      <div>
        <div className="success-page__ref">REFERENCE {reference}</div>
        <h1 className="display success-page__title">
          REQUEST<br /><em>RECEIVED.</em>
        </h1>
        <p className="success-page__body">
          Looks like we have something to photograph. Thanks, {name || 'friend'}.
          We've received your request and will get back to you soon.
        </p>
        <Link to="/" className="btn btn--primary">Return Home</Link>
      </div>
    </div>
  )
}
