import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/appContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useApp()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
