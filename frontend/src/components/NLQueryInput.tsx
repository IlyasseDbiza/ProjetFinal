import { useState, useRef } from 'react'
import { Send, Loader2, Sparkles } from 'lucide-react'
import clsx from 'clsx'

const SUGGESTIONS = [
  'Show total sales by category',
  'What are the top 10 products by revenue?',
  'Plot the trend of orders over time',
  'Show the distribution of customer ages',
  'Which city has the highest average order value?',
]

interface Props {
  onSubmit: (question: string) => void
  isLoading: boolean
  disabled?: boolean
}

export default function NLQueryInput({ onSubmit, isLoading, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (q && !isLoading && !disabled) {
      onSubmit(q)
      setValue('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={disabled || isLoading}
          placeholder="Ask a question about your data… (e.g. Show monthly revenue trends)"
          className={clsx(
            'w-full bg-gray-800 border rounded-xl px-4 py-3 pr-14 text-sm text-gray-100',
            'placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-brand-600',
            'transition-colors',
            disabled ? 'border-gray-700 opacity-50 cursor-not-allowed' : 'border-gray-700 hover:border-gray-600',
          )}
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading || disabled}
          className={clsx(
            'absolute right-3 bottom-3 p-2 rounded-lg transition-all',
            value.trim() && !isLoading && !disabled
              ? 'bg-brand-600 hover:bg-brand-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed',
          )}
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Sparkles size={12} /> Try:
        </span>
        {SUGGESTIONS.slice(0, 3).map((s) => (
          <button
            key={s}
            onClick={() => setValue(s)}
            disabled={disabled || isLoading}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-2.5 py-1 rounded-full border border-gray-700 transition-colors disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
