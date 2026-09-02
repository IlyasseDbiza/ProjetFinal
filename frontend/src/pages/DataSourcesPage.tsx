import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Upload, Trash2, Database, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { listDataSources, uploadCSV, deleteDataSource, getDataSource } from '@/api/client'
import DataProfilePanel from '@/components/DataProfilePanel'
import type { DataSource } from '@/types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function UploadZone({ onUploaded }: { onUploaded: () => void }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted[0]) {
        setFile(accepted[0])
        if (!name) setName(accepted[0].name.replace('.csv', ''))
      }
    },
  })

  async function handleUpload() {
    if (!file || !name.trim()) return
    setUploading(true)
    try {
      await uploadCSV(file, name.trim())
      toast.success(`"${name}" uploaded successfully`)
      setFile(null)
      setName('')
      onUploaded()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-white">Upload CSV</h2>
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-brand-600 bg-brand-600/10 text-white'
            : 'border-gray-700 hover:border-gray-600 text-gray-500',
        )}
      >
        <input {...getInputProps()} />
        <Upload size={32} className="mx-auto mb-3 opacity-50" />
        {file ? (
          <p className="text-sm text-white font-medium">{file.name}</p>
        ) : (
          <p className="text-sm">Drag & drop a CSV file here, or <span className="text-brand-500">click to browse</span></p>
        )}
        <p className="text-xs text-gray-600 mt-1">Max 50 MB</p>
      </div>

      {file && (
        <div className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dataset name…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !name.trim()}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  )
}

function DataSourceRow({ ds }: { ds: DataSource }) {
  const [expanded, setExpanded] = useState(false)
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteDataSource(ds.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['datasources'] })
      toast.success('Deleted')
    },
  })

  const { data: detail } = useQuery({
    queryKey: ['datasource', ds.id],
    queryFn: () => getDataSource(ds.id),
    enabled: expanded,
  })

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Database size={16} className="text-brand-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{ds.name}</p>
          <p className="text-xs text-gray-500">
            {ds.row_count?.toLocaleString() ?? '?'} rows · {ds.type.toUpperCase()} ·{' '}
            {new Date(ds.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-500 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${ds.name}"?`)) deleteMutation.mutate()
            }}
            className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-800 p-4">
          {detail?.profile ? (
            <DataProfilePanel profile={detail.profile} />
          ) : (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Loading profile…
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DataSourcesPage() {
  const qc = useQueryClient()
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['datasources'],
    queryFn: listDataSources,
  })

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Data Sources</h1>
        <span className="text-sm text-gray-500">{sources.length} source(s)</span>
      </div>

      <UploadZone onUploaded={() => qc.invalidateQueries({ queryKey: ['datasources'] })} />

      {isLoading ? (
        <div className="text-center text-gray-500 py-8">
          <Loader2 size={24} className="animate-spin mx-auto" />
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center text-gray-600 py-12 text-sm">
          No data sources yet. Upload a CSV to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((ds) => (
            <DataSourceRow key={ds.id} ds={ds} />
          ))}
        </div>
      )}
    </div>
  )
}
