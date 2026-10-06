import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { AuthForm } from '../components/AuthForm'

export function Login() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from
  const destination = from ? `${from.pathname}${from.search}` : '/'

  if (status === 'authenticated') return <Navigate to={destination} replace />

  return (
    <AuthForm
      title="Sign in"
      subtitle="Welcome back to Lumen."
      submitLabel="Sign in"
      fields={[
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
        { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' },
      ]}
      onSubmit={async (v) => {
        await login(v.email, v.password)
        navigate(destination, { replace: true })
      }}
      footer={{ text: "Don't have an account?", linkLabel: 'Sign up', to: '/register' }}
    />
  )
}
