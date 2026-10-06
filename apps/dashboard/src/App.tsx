import { Outlet } from 'react-router-dom'
import { EventsProvider } from './context/EventsProvider'
import { useEventsContext } from './context/eventsContext'
import { Nav } from './components/Nav'
import { useAuth } from './context/authContext'

function ConnectionIndicator() {
  const { connected } = useEventsContext()

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${connected ? 'bg-green-600' : 'bg-gray-400'}`}
        />
      </span>
      {connected ? 'Live' : 'Reconnecting…'}
    </div>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  if (!user) return null
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2" title={user.email}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
          {initials}
        </span>
        <span className="hidden text-sm text-gray-700 sm:inline">{user.name}</span>
      </div>
      <button
        onClick={() => void logout()}
        className="rounded-md border border-gray-200 px-2.5 py-1 text-sm text-gray-600 transition hover:bg-gray-50"
      >
        Sign out
      </button>
    </div>
  )
}

function App() {
  return (
    <EventsProvider>
      <div className="min-h-screen bg-[#f7f8f7]">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-green-600" />
              <h1 className="text-lg font-semibold text-gray-900">Lumen</h1>
            </div>
            <div className="flex items-center gap-5">
              <ConnectionIndicator />
              <UserMenu />
            </div>
          </div>
          <Nav />
        </header>

        <main className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </main>
      </div>
    </EventsProvider>
  )
}

export default App
