import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { LoadingState } from './LoadingState'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState />
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
