import { useState } from 'react'
import { CheckIcon, ClipboardIcon } from 'lucide-react'

export function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors ${className}`}
    >
      {copied ? (
        <><CheckIcon size={12} className="text-green-600" /><span className="text-green-600">Copied!</span></>
      ) : (
        <><ClipboardIcon size={12} className="text-gray-500" /><span className="text-gray-500">Copy</span></>
      )}
    </button>
  )
}
