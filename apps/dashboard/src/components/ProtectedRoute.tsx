import { lazy, Suspense } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { LoadingState } from './LoadingState'

// the marketing page is its own chunk, so signed-in users never download it
const Landing = lazy(() => import('../routes/Landing').then((m) => ({ default: m.Landing })))

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState />
  if (status === 'anonymous') {
    // signed-out visitors to the root see the landing page; deeper links go to sign-in
    if (location.pathname === '/') {
      return (
        <Suspense fallback={<LoadingState />}>
          <Landing />
        </Suspense>
      )
    }
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
