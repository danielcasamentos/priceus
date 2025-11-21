import React, { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTrialStatus } from '../hooks/useTrialStatus'
import { isPrivilegedUser } from '../config/privilegedUsers'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const trialStatus = useTrialStatus(user?.id)
  const navigate = useNavigate()

  const isUserPrivileged = isPrivilegedUser(user?.email)

  useEffect(() => {
    // Usuários privilegiados não são redirecionados
    if (isUserPrivileged) return

    if (!trialStatus.loading && trialStatus.isExpired && trialStatus.status === 'trial') {
      navigate('/pricing')
    }
  }, [trialStatus.isExpired, trialStatus.loading, trialStatus.status, navigate, isUserPrivileged])

  if (loading || trialStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Usuários privilegiados não são redirecionados para pricing
  if (!isUserPrivileged && trialStatus.isExpired && trialStatus.status === 'trial') {
    return <Navigate to="/pricing" replace />
  }

  return <>{children}</>
}