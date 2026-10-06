import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { AuthForm } from '../components/AuthForm'

export function Register() {
  const { status, register } = useAuth()
  const navigate = useNavigate()

  if (status === 'authenticated') return <Navigate to="/" replace />

  return (
    <AuthForm
      title="Create your account"
      subtitle="Start tracking events with Lumen."
      submitLabel="Create account"
      fields={[
        { name: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autoComplete: 'new-password',
          hint: 'At least 8 characters',
        },
      ]}
      onSubmit={async (v) => {
        await register(v.name, v.email, v.password)
        navigate('/', { replace: true })
      }}
      footer={{ text: 'Already have an account?', linkLabel: 'Sign in', to: '/login' }}
    />
  )
}
