import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/events', label: 'Events', end: false },
]

export function Nav() {
  return (
    <nav className="mx-auto flex max-w-6xl gap-1 px-6">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `-mb-px border-b-2 px-3 py-3 text-sm font-medium transition ${
              isActive
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
