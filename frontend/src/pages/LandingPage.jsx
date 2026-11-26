import { Link } from 'react-router-dom'
import { LinkIcon, BarChart3Icon, ShieldCheckIcon, ZapIcon } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <span className="text-2xl font-bold text-blue-700">Shorty</span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-4 pt-16 pb-24 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Shorten, share, and<br />
          <span className="text-blue-600">understand your links</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Create short links in seconds. Track real clicks, referrers, devices, and campaigns.
          No ads. No paid analytics APIs. 100% your data.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register" className="btn-primary text-base px-6 py-3">
            Start for free →
          </Link>
          <Link to="/login" className="btn-secondary text-base px-6 py-3">
            Sign in
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {[
            { icon: LinkIcon, title: 'Smart short links', desc: 'Custom aliases, expiry dates, deactivation on demand.' },
            { icon: BarChart3Icon, title: 'Real analytics', desc: 'Clicks, referrers, devices, OS, campaigns — from actual data.' },
            { icon: ShieldCheckIcon, title: 'Secure by default', desc: 'Argon2id hashing, HttpOnly sessions, ownership isolation.' },
            { icon: ZapIcon, title: 'Fast redirects', desc: '302 redirects with async click tracking that never slows you down.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card">
              <Icon className="text-blue-600 mb-3" size={24} />
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
