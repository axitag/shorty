import { Link, useSearchParams } from 'react-router-dom'
import { LinkIcon, AlertTriangleIcon, ClockIcon, HomeIcon } from 'lucide-react'

const REASONS = {
  inactive: {
    icon: AlertTriangleIcon,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    title: 'Link Deactivated',
    description: 'This short link has been deactivated by its owner and is no longer accessible.',
  },
  expired: {
    icon: ClockIcon,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50',
    title: 'Link Expired',
    description: 'This short link has passed its expiration date and is no longer accessible.',
  },
  not_found: {
    icon: LinkIcon,
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-100',
    title: 'Link Not Found',
    description: "We couldn't find a short link at this address. It may have been deleted or never existed.",
  },
}

export default function UnavailablePage() {
  const [params] = useSearchParams()
  const reason = params.get('reason') || 'not_found'
  const { icon: Icon, iconColor, iconBg, title, description } = REASONS[reason] || REASONS.not_found

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700" />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${iconBg} mb-5`}>
              <Icon size={32} className={iconColor} />
            </div>

            {/* Text */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">{description}</p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <HomeIcon size={16} />
                Go to Shorty
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Powered by <span className="font-semibold text-blue-600">Shorty</span>
        </p>
      </div>
    </div>
  )
}
