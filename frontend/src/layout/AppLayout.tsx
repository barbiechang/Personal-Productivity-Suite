import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/todos', label: 'Todo List' },
  { to: '/notebook', label: 'Digital Notebook' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/expenses', label: 'Expense Tracker' },
  { to: '/files', label: 'File Manager' },
  { to: '/english', label: 'English Practice' },
  { to: '/travel', label: 'Travel Planner' },
]

export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-pink-50/40 text-gray-900">
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white p-4">
        <h1 className="mb-6 px-2 text-lg font-semibold">Little Buddy</h1>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-pink-100 text-pink-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
