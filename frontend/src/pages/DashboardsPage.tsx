import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LayoutDashboard, Plus, Trash2, Loader2, X } from 'lucide-react'
import { listDashboards, createDashboard, getDashboard, deleteDashboard, addWidgetToDashboard, getQueryChart } from '@/api/client'
import ChartViewer from '@/components/ChartViewer'
import type { Dashboard, DashboardWidget, ChartResult } from '@/types'
import toast from 'react-hot-toast'

function WidgetChart({ widget }: { widget: DashboardWidget }) {
  const { data: chart, isLoading } = useQuery<ChartResult>({
    queryKey: ['query-chart', widget.query_id],
    queryFn: () => getQueryChart(widget.query_id),
    staleTime: Infinity,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <Loader2 size={16} className="animate-spin" />
      </div>
    )
  }
  if (!chart) return <p className="text-xs text-gray-600 p-4">Chart unavailable</p>
  return <ChartViewer chart={chart} compact />
}

function NewDashboardModal({ onClose, onCreated }: { onClose: () => void; onCreated: (d: Dashboard) => void }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!title.trim()) return
    setLoading(true)
    try {
      const d = await createDashboard(title.trim(), desc.trim())
      onCreated(d)
      toast.success('Dashboard created')
    } catch {
      toast.error('Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">New Dashboard</h2>
          <button onClick={onClose}><X size={16} className="text-gray-500 hover:text-white" /></button>
        </div>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Dashboard title"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
        />
        <button
          onClick={handle}
          disabled={!title.trim() || loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Create Dashboard
        </button>
      </div>
    </div>
  )
}

function DashboardView({ id }: { id: number }) {
  const qc = useQueryClient()
  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard', id],
    queryFn: () => getDashboard(id),
  })

  async function removeWidget(widgetId: string) {
    if (!dash) return
    const updatedWidgets = dash.widgets.filter((w) => w.id !== widgetId)
    try {
      const { default: axios } = await import('axios')
      const { data } = await axios.put(`/api/dashboards/${dash.id}`, { widgets: updatedWidgets })
      qc.setQueryData(['dashboard', id], data)
      toast.success('Widget removed')
    } catch {
      toast.error('Failed to remove widget')
    }
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-gray-500" /></div>
  if (!dash) return null

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{dash.description || 'No description'}</p>
      {dash.widgets.length === 0 ? (
        <div className="text-center py-12 text-gray-600 text-sm border border-dashed border-gray-800 rounded-xl">
          No widgets yet. Go to <strong className="text-white">Explore</strong> and save charts to this dashboard.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {dash.widgets.map((w) => (
            <div key={w.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{w.question}</p>
                  <p className="text-xs text-gray-600">{w.datasource_name}</p>
                </div>
                <button
                  onClick={() => removeWidget(w.id)}
                  className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-3">
                <WidgetChart widget={w} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(null)

  const { data: dashboards = [], isLoading } = useQuery({
    queryKey: ['dashboards'],
    queryFn: listDashboards,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDashboard,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['dashboards'] })
      if (activeId === id) setActiveId(null)
      toast.success('Dashboard deleted')
    },
  })

  const active = dashboards.find((d) => d.id === activeId)

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar list */}
      <div className="w-64 flex-shrink-0 border-r border-gray-800 flex flex-col bg-gray-950">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-medium text-white">Dashboards</span>
          <button
            onClick={() => setShowModal(true)}
            className="p-1.5 bg-brand-600 hover:bg-brand-700 rounded-lg text-white"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center pt-6"><Loader2 size={16} className="animate-spin text-gray-500" /></div>
          ) : dashboards.length === 0 ? (
            <p className="text-xs text-gray-600 text-center pt-8">No dashboards yet</p>
          ) : (
            dashboards.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveId(d.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                  activeId === d.id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <LayoutDashboard size={14} />
                <span className="flex-1 truncate">{d.title}</span>
                <span className="text-xs opacity-60">{d.widgets?.length ?? 0}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        {!activeId ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-gray-500">
            <LayoutDashboard size={48} className="opacity-20" />
            <div>
              <p className="text-lg font-medium text-gray-400">Select or create a dashboard</p>
              <p className="text-sm mt-1">Use the <strong className="text-white">+</strong> button to create one.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-white">{active?.title}</h1>
              <button
                onClick={() => {
                  if (confirm('Delete this dashboard?')) deleteMutation.mutate(activeId)
                }}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
            <DashboardView id={activeId} />
          </div>
        )}
      </div>

      {showModal && (
        <NewDashboardModal
          onClose={() => setShowModal(false)}
          onCreated={(d) => {
            qc.invalidateQueries({ queryKey: ['dashboards'] })
            setActiveId(d.id)
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}
