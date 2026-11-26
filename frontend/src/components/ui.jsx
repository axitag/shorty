export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizes[size]} ${className}`} />
  )
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  )
}

export function ErrorMessage({ error, onRetry }) {
  if (!error) return null
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
      <p className="text-sm text-red-700">{error.message || 'Something went wrong.'}</p>
      {error.details && (
        <ul className="mt-2 list-disc list-inside">
          {error.details.map((d, i) => (
            <li key={i} className="text-xs text-red-600">{d.field ? `${d.field}: ` : ''}{d.message}</li>
          ))}
        </ul>
      )}
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm text-red-600 hover:underline font-medium">
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      {description && <p className="text-gray-400 text-xs mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
    </div>
  )
}

export function MetricCard({ label, value, sub, change }) {
  const isPositive = change > 0
  const isNeutral = change === null || change === undefined
  return (
    <div className="card">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {!isNeutral && (
        <p className={`text-xs mt-1 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(change)}%
          {change === null && ' (no prior data)'}
        </p>
      )}
    </div>
  )
}
