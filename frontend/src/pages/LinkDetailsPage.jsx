import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { analyticsApi, linksApi } from '../api/client'
import { PageLoading, ErrorMessage, EmptyState } from '../components/ui'
import { CopyButton } from '../components/CopyButton'
import { PikaIcon } from '@pikaicons/react'
import {
  ArrowLeftIcon,
  DownloadBarDownIcon,
  EyeOnIcon,
  UserCircleIcon,
  BotIcon,
  GlobeIcon,
} from '@pikaicons/core-free'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const PRESETS = ['1d', '7d', '30d', '90d']

function BarList({ data, nameKey = 'name', valueKey = 'clicks' }) {
  if (!data?.length) return <EmptyState title="No data for this period" />
  const max = Math.max(...data.map((d) => d[valueKey]))
  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 w-32 truncate shrink-0">{item[nameKey] || 'Unknown'}</span>
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${max > 0 ? (item[valueKey] / max) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-10 text-right tabular-nums">{item[valueKey]}</span>
        </div>
      ))}
    </div>
  )
}

function Card({ className = '', children }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

function SmCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon && <PikaIcon icon={icon} size={16} className="text-blue-500" />}
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function LinkDetailsPage() {
  const { id } = useParams()
  const [preset, setPreset] = useState('7d')
  const [summary, setSummary] = useState(null)
  const [timeseries, setTimeseries] = useState(null)
  const [referrers, setReferrers] = useState(null)
  const [devices, setDevices] = useState(null)
  const [campaigns, setCampaigns] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { preset, linkId: id }
      const [s, ts, ref, dev, camp] = await Promise.all([
        analyticsApi.linkSummary(id, { preset }),
        analyticsApi.timeseries(params),
        analyticsApi.referrers(params),
        analyticsApi.devices(params),
        analyticsApi.campaigns(params),
      ])
      setSummary(s.data)
      setTimeseries(ts.data)
      setReferrers(ref.data)
      setDevices(dev.data)
      setCampaigns(camp.data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [id, preset])

  useEffect(() => { load() }, [load])

  const handleExport = async () => {
    try {
      const blob = await analyticsApi.exportCsv({ linkId: id, preset })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clicks-${id}-${preset}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export failed: ' + err.message)
    }
  }

  const chartData = timeseries?.data?.map((d) => ({
    name: new Date(d.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clicks: d.clicks,
  })) || []

  const shortUrl = summary ? `${window.location.origin}/${summary.link.shortCode}` : ''

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/links" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          <PikaIcon icon={ArrowLeftIcon} size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
            {summary?.link.title || summary?.link.shortCode || 'Link Analytics'}
          </h1>
          {summary && (
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm text-blue-600 dark:text-blue-400">{shortUrl}</code>
              <CopyButton text={shortUrl} />
              <span className={summary.link.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}>
                {summary.link.status.toLowerCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setPreset(p)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${preset === p ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >{p}</button>
            ))}
          </div>
          <button onClick={handleExport} title="Export CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <PikaIcon icon={DownloadBarDownIcon} size={15} />
          </button>
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={load} />}
      {loading ? <PageLoading /> : summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SmCard icon={EyeOnIcon} label="Total clicks" value={summary.totalClicks?.toLocaleString()} />
            <SmCard icon={UserCircleIcon} label="Est. unique visitors" value={summary.estimatedUniqueVisitors?.toLocaleString()} sub="Approximate" />
            <SmCard icon={BotIcon} label="Bot clicks" value={summary.botClicks?.toLocaleString()} sub="Heuristic" />
            <SmCard icon={GlobeIcon} label="Total requests" value={summary.totalRequests?.toLocaleString()} />
          </div>

          <Card className="mb-6 !p-0 overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase">Clicks over time</h2>
            </div>
            {chartData.length === 0 ? (
              <div className="p-5"><EmptyState title="No click data for this period" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="clicks" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-4">Referrers</h2>
              <BarList data={referrers?.data} nameKey="label" valueKey="clicks" />
            </Card>
            <Card>
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-4">Devices</h2>
              {devices?.devices?.length > 0 ? (
                <>
                  <BarList data={devices.devices} nameKey="type" valueKey="clicks" />
                  <h3 className="font-medium text-slate-600 dark:text-slate-400 mt-4 mb-2 text-xs uppercase tracking-widest">Browsers</h3>
                  <BarList data={devices.browsers.slice(0, 5)} nameKey="name" valueKey="clicks" />
                  <h3 className="font-medium text-slate-600 dark:text-slate-400 mt-4 mb-2 text-xs uppercase tracking-widest">OS</h3>
                  <BarList data={devices.os.slice(0, 5)} nameKey="name" valueKey="clicks" />
                </>
              ) : <EmptyState title="No data for this period" />}
            </Card>
          </div>

          {(campaigns?.sources?.length > 0 || campaigns?.campaigns?.length > 0) && (
            <Card className="mb-6">
              <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-4">UTM Campaigns</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div><p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Sources</p><BarList data={campaigns.sources} nameKey="name" valueKey="clicks" /></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Mediums</p><BarList data={campaigns.mediums} nameKey="name" valueKey="clicks" /></div>
                <div><p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Campaigns</p><BarList data={campaigns.campaigns} nameKey="name" valueKey="clicks" /></div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
