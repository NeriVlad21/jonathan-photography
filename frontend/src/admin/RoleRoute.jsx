import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'

export default function RoleRoute({ roles, children }) {
  const { admin } = useAdminAuth()

  if (!admin || !roles.includes(admin.role)) {
    return <Navigate to={admin?.role === 'SUPER_ADMIN' ? '/admin/super-admin' : '/admin/dashboard'} replace />
  }

  return children
}

