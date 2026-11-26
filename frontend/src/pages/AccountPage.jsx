import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { PikaIcon } from '@pikaicons/react'
import { MoonIcon, SunIcon, LogOutRightIcon, Settings01Icon } from '@pikaicons/core-free'

export default function AccountPage() {
  const { user, logout } = useAuth()
  const { dark, toggle, setMode } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings & Preferences</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage theme appearance and your account</p>
      </div>

      {/* Theme Appearance Mode Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <PikaIcon icon={Settings01Icon} size={18} className="text-blue-500" />
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Appearance Theme</h2>
        </div>

        {/* Two-Button Segmented Selector for 100% clarity */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode(false)}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-all ${
              !dark
                ? 'bg-blue-50 text-blue-700 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PikaIcon icon={SunIcon} size={18} className={!dark ? 'text-amber-500' : 'text-slate-400'} />
            <span>Light Mode</span>
            {!dark && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-1" />}
          </button>

          <button
            type="button"
            onClick={() => setMode(true)}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-all ${
              dark
                ? 'bg-blue-950/60 text-blue-400 border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <PikaIcon icon={MoonIcon} size={18} className={dark ? 'text-indigo-400' : 'text-slate-400'} />
            <span>Dark Mode</span>
            {dark && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-1" />}
          </button>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Currently active: <strong className="text-slate-700 dark:text-slate-200">{dark ? 'Dark Mode' : 'Light Mode'}</strong>. Preference is saved automatically in your browser.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        <div className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.email?.split('@')[0]}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="p-6 space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Account Email</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Member Since</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sign Out</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Log out from your current active session</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-semibold transition-colors"
          >
            <PikaIcon icon={LogOutRightIcon} size={16} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
