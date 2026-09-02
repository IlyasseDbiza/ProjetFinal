import { useState } from 'react'
import { ChevronDown, ChevronUp, Code2, PlusCircle } from 'lucide-react'
import ChartViewer from './ChartViewer'
import type { QueryResult, Dashboard } from '@/types'
import { createDashboard, addWidgetToDashboard } from '@/api/client'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface Props {
  result: QueryResult
  question: string
  datasourceId: number
  datasourceName: string
}

export default function QueryResultCard({ result, question, datasourceId, datasourceName }: Props) {
  const [showSQL, setShowSQL] = useState(false)
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  async function handleSaveToDashboard() {
    setSaving(true)
    try {
      // Use cached dashboards list — no extra network request
      let dashboards = queryClient.getQueryData<Dashboard[]>(['dashboards']) ?? []
      let target: Dashboard

      if (dashboards.length === 0) {
        target = await createDashboard('My Dashboard', 'Auto-created dashboard')
        queryClient.invalidateQueries({ queryKey: ['dashboards'] })
      } else {
        target = dashboards[0]
      }

      // Store only the query_id — no heavy chart payload
      const widget = {
        id: crypto.randomUUID(),
        question,
        datasource_id: datasourceId,
        datasource_name: datasourceName,
        query_id: result.id,
        sql: result.sql,
        created_at: new Date().toISOString(),
      }

      await addWidgetToDashboard(target.id, target, widget)
      queryClient.invalidateQueries({ queryKey: ['dashboard', target.id] })
      toast.success(`Saved to "${target.title}"`)
    } catch {
      toast.error('Failed to save widget')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{question}</p>
          {result.explanation && (
            <p className="text-xs text-gray-500 mt-0.5">{result.explanation}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowSQL(!showSQL)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Code2 size={12} />
            SQL
            {showSQL ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={handleSaveToDashboard}
            disabled={saving}
            className="flex items-center gap-1 text-xs bg-brand-600 hover:bg-brand-700 text-white px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            <PlusCircle size={12} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* SQL panel */}
      {showSQL && (
        <div className="px-4 py-3 bg-gray-950 border-b border-gray-800">
          <pre className="text-xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">
            {result.sql}
          </pre>
          <p className="text-xs text-gray-600 mt-1">{result.row_count} row(s) returned</p>
        </div>
      )}

      {/* Chart */}
      <div className="p-4">
        <ChartViewer chart={result.chart} />
      </div>
    </div>
  )
}
