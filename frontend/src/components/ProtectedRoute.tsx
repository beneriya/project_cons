import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/appContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useApp()
  const location = useLocation()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#8A93A8]">Loading...</div>
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
