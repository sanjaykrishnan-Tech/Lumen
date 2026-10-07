import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthProvider.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { LoadingState } from './components/LoadingState.tsx'

// Each screen is its own chunk, so the sign-in page doesn't download the charts
// library and a visit to Settings doesn't download Funnels or Retention.
const router = createBrowserRouter([
  {
    HydrateFallback: LoadingState,
    children: [
      { path: '/login', lazy: async () => ({ Component: (await import('./routes/Login.tsx')).Login }) },
      { path: '/register', lazy: async () => ({ Component: (await import('./routes/Register.tsx')).Register }) },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/',
            element: <App />,
            children: [
              { index: true, lazy: async () => ({ Component: (await import('./routes/Overview.tsx')).Overview }) },
              { path: 'events', lazy: async () => ({ Component: (await import('./routes/Events.tsx')).Events }) },
              { path: 'funnels', lazy: async () => ({ Component: (await import('./routes/Funnels.tsx')).Funnels }) },
              {
                path: 'retention',
                lazy: async () => ({ Component: (await import('./routes/Retention.tsx')).Retention }),
              },
              { path: 'settings', lazy: async () => ({ Component: (await import('./routes/Settings.tsx')).Settings }) },
            ],
          },
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
