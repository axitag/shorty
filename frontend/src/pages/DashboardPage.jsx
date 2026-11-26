import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { analyticsApi } from '../api/client'
import { ErrorMessage, EmptyState } from '../components/ui'
import { PikaIcon } from '@pikaicons/react'
import {
  EyeOnIcon,
  UserCircleIcon,
  BotIcon,
  GlobeIcon,
  RefreshIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  ExternalLinkSquareIcon,
  GraphTrendLineIcon,
} from '@pikaicons/core-free'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import CreateLinkModal from '../components/CreateLinkModal'

// ─── Primitives ────────────────────────────────────────────────────────────────
function Card({ className = '', children }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm ${className}`}>
      {children}
    </div>
  )
}
function CardHeader({ className = '', children }) {
  return <div className={`px-5 pt-5 pb-0 ${className}`}>{children}</div>
}
function CardContent({ className = '', children }) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>
}
function CardTitle({ children }) {
  return <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase">{children}</h2>
}

const PRESETS = [
  { key: '1d', label: '1D' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
]

function PeriodSelector({ value, onChange, disabled }) {
  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          disabled={disabled}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all disabled:opacity-40 ${
            value === p.key
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

function GrowthBadge({ value }) {
  if (value === null || value === undefined)
    return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">New</span>
  if (value === 0)
    return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"><PikaIcon icon={MinusIcon} size={10} /> 0%</span>
  if (value > 0)
    return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"><PikaIcon icon={ArrowUpIcon} size={10} /> {value}%</span>
  return <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800"><PikaIcon icon={ArrowDownIcon} size={10} /> {Math.abs(value)}%</span>
}

function MetricSkeleton() {
  return (
    <Card>
      <CardContent>
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="w-14 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="w-24 h-7 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="w-16 h-3 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({ pikaIcon, iconColor, iconBg, label, value, growth, sub }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between mb-3">
          <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${iconBg}`}>
            <PikaIcon icon={pikaIcon} size={18} className={iconColor} />
          </div>
          <GrowthBadge value={growth} />
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">{value ?? '—'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [preset, setPreset] = useState('7d')
  const [chartPreset, setChartPreset] = useState('7d')
  const [overview, setOverview] = useState(null)
  const [timeseries, setTimeseries] = useState(null)
  const [referrers, setReferrers] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  // ── Fixed: removed isMounted (breaks in React StrictMode) ─────────────────
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setInitialLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const [ov, ts, ref] = await Promise.all([
        analyticsApi.overview({ preset }),
        analyticsApi.timeseries({ preset: chartPreset }),
        analyticsApi.referrers({ preset }),
      ])
      setOverview(ov.data)
      setTimeseries(ts.data)
      setReferrers(ref.data)
    } catch (err) {
      setError(err)
    } finally {
      setInitialLoading(false)
      setRefreshing(false)
    }
  }, [preset, chartPreset])

  useEffect(() => { load() }, [load])

  const handleRefresh = () => load({ silent: true })

  const chartData = timeseries?.data?.map((d) => ({
    name: timeseries.groupBy === 'hour'
      ? new Date(d.period).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : new Date(d.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Clicks: d.clicks,
    Requests: d.totalRequests,
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your link performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector value={preset} onChange={(v) => { setPreset(v); setChartPreset(v) }} disabled={initialLoading} />
          <button
            onClick={handleRefresh}
            disabled={initialLoading || refreshing}
            title="Refresh"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            <PikaIcon icon={RefreshIcon} size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PikaIcon icon={PlusIcon} size={14} /> New link
          </button>
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={handleRefresh} />}

      {/* Smooth-fade wrapper */}
      <div
        className="space-y-6 transition-opacity duration-300 ease-in-out"
        style={{ opacity: refreshing ? 0.45 : 1, pointerEvents: refreshing ? 'none' : 'auto' }}
      >
        {/* Metric cards */}
        {initialLoading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => <MetricSkeleton key={i} />)}
          </div>
        ) : overview ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard pikaIcon={EyeOnIcon} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-900/30" label="Total Clicks" value={overview.totalClicks?.toLocaleString()} growth={overview.clickGrowth} />
            <MetricCard pikaIcon={UserCircleIcon} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-900/30" label="Est. Unique Visitors" value={overview.estimatedUniqueVisitors?.toLocaleString()} growth={overview.uniqueVisitorGrowth} sub="Privacy-preserving" />
            <MetricCard pikaIcon={BotIcon} iconColor="text-orange-500" iconBg="bg-orange-50 dark:bg-orange-900/30" label="Bot Requests" value={overview.bots?.toLocaleString()} growth={overview.botGrowth} />
            <MetricCard pikaIcon={GlobeIcon} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-900/30" label="Total Requests" value={overview.totalRequests?.toLocaleString()} growth={overview.totalRequestsGrowth} />
          </div>
        ) : null}

        {/* Row 2 */}
        {initialLoading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[0,1].map(i => (
              <Card key={i}><CardContent>
                <div className="animate-pulse space-y-4">
                  <div className="w-32 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="w-full h-72 rounded-lg bg-slate-100 dark:bg-slate-800" />
                </div>
              </CardContent></Card>
            ))}
          </div>
        ) : overview ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Line chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PikaIcon icon={GraphTrendLineIcon} size={16} className="text-blue-500" />
                    <CardTitle>Clicks over time</CardTitle>
                  </div>
                  <PeriodSelector value={chartPreset} onChange={setChartPreset} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {chartData.length === 0 ? (
                  <EmptyState title="No click data" description="Share your short links to start seeing data." />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={288}>
                      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f1f5f9)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="Clicks" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#2563eb' }} />
                        <Line type="monotone" dataKey="Requests" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 3, fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-2 justify-end">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><div className="w-4 h-0.5 bg-blue-600 rounded" />Clicks</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><div className="w-4 h-px border-t-2 border-dashed border-emerald-500" />All requests</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Traffic sources */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <CardTitle>Traffic Sources</CardTitle>
                  <span className="text-xs text-slate-400 dark:text-slate-500">vs prev period</span>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {(!referrers?.data || referrers.data.length === 0) ? (
                  <EmptyState title="No data" description="Clicks will appear here as your links are shared." />
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {referrers.data.map((r) => (
                      <div key={r.domain} className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">{r.label || r.domain}</span>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          <GrowthBadge value={r.change} />
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 w-10 text-right tabular-nums">{r.clicks.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Top links */}
        {!initialLoading && overview && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-1">
                <CardTitle>Top Links</CardTitle>
                <Link to="/links" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">View all →</Link>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {(!overview.topLinks || overview.topLinks.length === 0) ? (
                <EmptyState title="No links yet" action={
                  <button onClick={() => setShowCreate(true)} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                    <PikaIcon icon={PlusIcon} size={14} /> Create link
                  </button>
                } />
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {overview.topLinks.map((link, i) => (
                    <div key={link.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-slate-300 dark:text-slate-600 w-5 shrink-0 tabular-nums">#{i+1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{link.title || link.shortCode}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{link.originalUrl}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{link.clicks?.toLocaleString()}</span>
                        <Link to={`/links/${link.id}`} className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
                          <PikaIcon icon={ExternalLinkSquareIcon} size={15} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} onCreated={() => load({ silent: true })} />}
    </div>
  )
}
