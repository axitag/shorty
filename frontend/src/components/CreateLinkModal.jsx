import { useState } from 'react'
import { linksApi } from '../api/client'
import { ErrorMessage } from './ui'
import { PikaIcon } from '@pikaicons/react'
import { XComIcon } from '@pikaicons/core-free'

export default function CreateLinkModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ originalUrl: '', title: '', customAlias: '', expiresAt: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = { originalUrl: form.originalUrl }
      if (form.title) payload.title = form.title
      if (form.customAlias) payload.customAlias = form.customAlias
      if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString()
      const res = await linksApi.create(payload)
      setResult(res.data)
      onCreated?.()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const shortUrl = result ? `${window.location.origin}/${result.shortCode}` : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-colors">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create short link</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <PikaIcon icon={XComIcon} size={18} />
          </button>
        </div>
        <div className="p-5">
          {result ? (
            <div className="text-center py-4">
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-3">✓ Link created successfully!</p>
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 mb-4">
                <p className="text-sm font-mono text-blue-600 dark:text-blue-400 break-all">{shortUrl}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(shortUrl)}
                  className="btn-primary text-sm"
                >
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null)
                    setForm({ originalUrl: '', title: '', customAlias: '', expiresAt: '' })
                  }}
                  className="btn-secondary text-sm"
                >
                  Create another
                </button>
                <button type="button" onClick={onClose} className="btn-secondary text-sm">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Destination URL *</label>
                <input
                  type="url"
                  required
                  className="input"
                  placeholder="https://example.com/your-long-url"
                  value={form.originalUrl}
                  onChange={(e) => setForm((f) => ({ ...f, originalUrl: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Title (optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="My awesome link"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Custom alias (optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="my-link (3–50 chars)"
                  value={form.customAlias}
                  onChange={(e) => setForm((f) => ({ ...f, customAlias: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Expires at (optional)</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
              </div>
              <ErrorMessage error={error} />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Creating…' : 'Create link'}
                </button>
                <button type="button" onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
