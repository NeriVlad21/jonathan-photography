import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'

export default function AdminHome() {
  const { admin } = useAdminAuth()
  if (admin?.must_change_password) return <Navigate to="/admin/profile" replace state={{ passwordChangeRequired: true }} />
  return <Navigate to={admin?.role === 'SUPER_ADMIN' ? '/admin/super-admin' : '/admin/dashboard'} replace />
}

