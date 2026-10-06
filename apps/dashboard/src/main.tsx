import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Overview } from './routes/Overview.tsx'
import { Events } from './routes/Events.tsx'
import { Funnels } from './routes/Funnels.tsx'
import { Retention } from './routes/Retention.tsx'
import { Settings } from './routes/Settings.tsx'
import { Login } from './routes/Login.tsx'
import { Register } from './routes/Register.tsx'
import { AuthProvider } from './context/AuthProvider.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <App />,
        children: [
          { index: true, element: <Overview /> },
          { path: 'events', element: <Events /> },
          { path: 'funnels', element: <Funnels /> },
          { path: 'retention', element: <Retention /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
