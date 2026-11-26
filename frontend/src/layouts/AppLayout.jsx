import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { PikaIcon } from '@pikaicons/react'
import {
  HomeIcon,
  LinkChainHorizontalIcon,
  LogOutRightIcon,
  MoonIcon,
  SunIcon,
  Settings01Icon,
} from '@pikaicons/core-free'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/links', label: 'Links', icon: LinkChainHorizontalIcon },
  { to: '/settings', label: 'Settings', icon: Settings01Icon },
]

function UserAvatar({ email }) {
  const initials = email ? email[0].toUpperCase() : '?'
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
      {initials}
    </div>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 transition-colors duration-200">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              S
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Shorty</span>
              <span className="ml-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold uppercase">PRO</span>
            </div>
          </div>

          {/* Quick Dark Toggle */}
          <button
            type="button"
            onClick={toggle}
            title={dark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <PikaIcon icon={dark ? SunIcon : MoonIcon} size={14} className={dark ? 'text-amber-400' : 'text-slate-600'} />
            <span className="text-[11px]">{dark ? 'Dark' : 'Light'}</span>
          </button>
        </div>

        {/* Main Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Overview</p>
          {navItems.map(({ to, label, icon: Ico }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <PikaIcon icon={Ico} size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Section at the Bottom */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* User Card Pill */}
          <NavLink
            to="/settings"
            className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors group"
          >
            <UserAvatar email={user?.email} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          </NavLink>

          {/* Quick Log out */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium w-full text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <PikaIcon icon={LogOutRightIcon} size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="font-bold text-blue-600">Shorty</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="text-slate-500">✕</button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map(({ to, label, icon: Ico }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400"
                >
                  <PikaIcon icon={Ico} size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-slate-600 dark:text-slate-400 p-1"
          >
            <span className="text-xl">☰</span>
          </button>
          <span className="font-bold text-blue-600 tracking-tight">Shorty</span>
          <button type="button" onClick={toggle} className="text-slate-500 dark:text-slate-400 p-1">
            <PikaIcon icon={dark ? SunIcon : MoonIcon} size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
