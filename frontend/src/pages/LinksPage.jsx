import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { linksApi } from '../api/client'
import { PageLoading, ErrorMessage, EmptyState } from '../components/ui'
import { CopyButton } from '../components/CopyButton'
import CreateLinkModal from '../components/CreateLinkModal'
import { PikaIcon } from '@pikaicons/react'
import {
  PlusIcon,
  ExternalLinkSquareIcon,
  DeleteDustbin01Icon,
  GraphBarLineIcon,
} from '@pikaicons/core-free'

export default function LinksPage() {
  const [links, setLinks] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await linksApi.list({ page, pageSize: 20, search })
      setLinks(res.data)
      setPagination(res.pagination)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm('Delete this link? Analytics history will be preserved.')) return
    try {
      await linksApi.delete(id)
      setLinks((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete link')
    }
  }

  const handleToggleStatus = async (link) => {
    const nextStatus = link.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    // Optimistic UI update
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, status: nextStatus } : l))
    )
    try {
      await linksApi.update(link.id, { status: nextStatus })
    } catch (err) {
      // Revert if API fails
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, status: link.status } : l))
      )
      alert(err.message || 'Failed to toggle status')
    }
  }

  const baseUrl = window.location.origin

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Links</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage, monitor, and toggle your short links</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PikaIcon icon={PlusIcon} size={15} /> New link
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search by title, code, or URL…"
          className="input max-w-md dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {error && <ErrorMessage error={error} onRetry={load} />}

      {loading ? (
        <PageLoading />
      ) : links.length === 0 ? (
        <EmptyState
          title={search ? 'No links match your search' : 'No links yet'}
          description={search ? 'Try a different search term.' : 'Create your first short link to get started.'}
          action={!search && (
            <button type="button" onClick={() => setShowCreate(true)} className="btn-primary text-sm mt-3">
              Create link
            </button>
          )}
        />
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-3.5 font-medium">Link & Alias</th>
                    <th className="text-left px-4 py-3.5 font-medium hidden sm:table-cell">Destination</th>
                    <th className="text-left px-4 py-3.5 font-medium">Status Toggle</th>
                    <th className="text-right px-4 py-3.5 font-medium">Clicks</th>
                    <th className="text-right px-4 py-3.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {links.map((link) => {
                    const shortUrl = `${baseUrl}/${link.shortCode}`
                    const isExpired = link.expiresAt && new Date() > new Date(link.expiresAt)
                    const isActive = link.status === 'ACTIVE' && !isExpired

                    return (
                      <tr key={link.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-2.5">
                            <span className={`inline-block w-2 h-2 rounded-full mt-1.5 shrink-0 ${isActive ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{link.title || link.shortCode}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <code className="text-xs text-blue-600 dark:text-blue-400 font-mono">/{link.shortCode}</code>
                                <CopyButton text={shortUrl} />
                                {isExpired && <span className="text-[11px] text-amber-500 font-medium">(expired)</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <p className="text-slate-500 dark:text-slate-400 truncate max-w-xs text-xs">{link.originalUrl}</p>
                        </td>

                        {/* Interactive Status Toggle Pill */}
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(link)}
                            title={link.status === 'ACTIVE' ? 'Click to deactivate link' : 'Click to activate link'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                              link.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${link.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {link.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {link.clicks?.toLocaleString() ?? 0}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/links/${link.id}`}
                              title="View Analytics"
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <PikaIcon icon={GraphBarLineIcon} size={16} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDelete(link.id)}
                              title="Delete Link"
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <PikaIcon icon={DeleteDustbin01Icon} size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.total > pagination.pageSize && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary text-xs disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page * 20 >= pagination.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  )
}
