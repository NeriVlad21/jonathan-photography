import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'

export default function AdminHome() {
  const { admin } = useAdminAuth()
  return <Navigate to={admin?.role === 'SUPER_ADMIN' ? '/admin/super-admin' : '/admin/dashboard'} replace />
}

