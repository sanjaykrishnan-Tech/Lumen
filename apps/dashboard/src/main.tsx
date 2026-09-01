import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Overview } from './routes/Overview.tsx'
import { Events } from './routes/Events.tsx'
import { Funnels } from './routes/Funnels.tsx'
import { Retention } from './routes/Retention.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'events', element: <Events /> },
      { path: 'funnels', element: <Funnels /> },
      { path: 'retention', element: <Retention /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
