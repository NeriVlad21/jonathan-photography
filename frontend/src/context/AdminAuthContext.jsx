import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi, setCsrfToken } from '../services/api.js'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await authApi.check()
      if (data.authenticated) {
        setCsrfToken(data.csrf_token)
        setAdmin(data.admin)
      } else {
        setAdmin(null)
      }
    } catch {
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (username, password) => {
    const data = await authApi.login(username, password)
    setCsrfToken(data.csrf_token)
    setAdmin(data.admin)
    return data
  }

  const logout = async () => {
    await authApi.logout()
    setCsrfToken(null)
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, refresh }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
