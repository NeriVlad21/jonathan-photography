import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import LoadingState from '../components/LoadingState.jsx'

export default function ProtectedRoute() {
  const { admin, loading } = useAdminAuth()

  if (loading) return <LoadingState label="Checking your session…" />
  if (!admin) return <Navigate to="/admin/login" replace />

  return <Outlet />
}
