import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import LoadingState from '../components/LoadingState.jsx'

export default function ProtectedRoute() {
  const {
    admin,
    loading
  } = useAdminAuth()

  /*
  ============================================================
  CHECK SESSION
  ============================================================
  */

  if (loading) {
    return (
      <div aria-live="polite">
        <LoadingState
          label="Checking your session…"
        />
      </div>
    )
  }

  /*
  ============================================================
  AUTHENTICATION
  ============================================================
  */

  if (!admin) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    )
  }

  /*
  ============================================================
  PROTECTED CONTENT
  ============================================================
  */

  return <Outlet />
}