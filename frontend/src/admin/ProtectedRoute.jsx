import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import LoadingState from '../components/LoadingState.jsx'

export default function ProtectedRoute() {
  const location = useLocation()
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

  if (admin.must_change_password && location.pathname !== '/admin/profile') {
    return <Navigate
      to="/admin/profile"
      replace
      state={{
        passwordChangeRequired: true,
        returnTo: {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
          state: location.state
        }
      }}
    />
  }

  /*
  ============================================================
  PROTECTED CONTENT
  ============================================================
  */

  return <Outlet />
}
