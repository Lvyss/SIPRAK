import { ClipboardCheck } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/kelas', label: 'Kelas' },
  { to: '/kelola-asprak', label: 'Kelola Asprak' },
]

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            aria-label="SIPRAK - Dashboard"
            className="inline-flex items-center gap-2 font-semibold text-slate-900"
            to="/dashboard"
          >
            <ClipboardCheck aria-hidden="true" className="text-primary-600" size={22} />
            SIPRAK
          </Link>
          <nav aria-label="Navigasi utama" className="flex flex-wrap gap-1">
            {navigation.map(({ to, label }) => (
              <NavLink
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
                key={to}
                to={to}
              >
                {label}
              </NavLink>
            ))}
            <NavLink
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
              to="/profil"
            >
              Profil
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
