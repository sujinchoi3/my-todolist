import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

interface Props {
  children: ReactNode
}

// 인증 필요 라우트: 미인증 사용자는 /login으로 리다이렉트
export function ProtectedRoute({ children }: Props) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

// 비인증 전용 라우트: 로그인된 사용자는 /로 리다이렉트
export function PublicOnlyRoute({ children }: Props) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (user) return <Navigate to="/" replace />

  return <>{children}</>
}
