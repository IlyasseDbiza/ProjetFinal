import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Database, ChevronDown } from 'lucide-react'
import { listDataSources, askQuestion } from '@/api/client'
import NLQueryInput from '@/components/NLQueryInput'
import QueryResultCard from '@/components/QueryResultCard'
import DataProfilePanel from '@/components/DataProfilePanel'
import type { DataSource, QueryResult } from '@/types'
import toast from 'react-hot-toast'

export default function ExplorePage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [results, setResults] = useState<{ question: string; result: QueryResult }[]>([])
  const [showProfile, setShowProfile] = useState(false)

  const { data: sources = [] } = useQuery({
    queryKey: ['datasources'],
    queryFn: listDataSources,
  })

  const selected = sources.find((s) => s.id === selectedId)

  useEffect(() => {
    if (sources.length > 0 && !selectedId) {
      setSelectedId(sources[0].id)
    }
  }, [sources, selectedId])

  const askMutation = useMutation({
    mutationFn: ({ q }: { q: string }) => askQuestion(selectedId!, q),
    onSuccess: (data, variables) => {
      setResults((prev) => [{ question: variables.q, result: data }, ...prev])
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Query failed')
    },
  })

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center gap-4 bg-gray-950">
        <h1 className="text-lg font-semibold text-white">Explore</h1>

        {/* DataSource selector */}
        <div className="relative ml-auto">
          <select
            value={selectedId ?? ''}
            onChange={(e) => {
              setSelectedId(Number(e.target.value))
              setResults([])
              setShowProfile(false)
            }}
            className="appearance-none bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-600 cursor-pointer"
          >
            {sources.length === 0 && <option value="">No data sources</option>}
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.row_count?.toLocaleString() ?? '?'} rows)
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-gray-500">
            <Database size={48} className="opacity-30" />
            <div>
              <p className="text-lg font-medium text-gray-400">No data sources yet</p>
              <p className="text-sm mt-1">Go to <strong className="text-white">Data Sources</strong> to upload a CSV file.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Query input */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
              <NLQueryInput
                onSubmit={(q) => askMutation.mutate({ q })}
                isLoading={askMutation.isPending}
                disabled={!selectedId}
              />
            </div>

            {/* Profile toggle */}
            {selected?.profile && (
              <div>
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${showProfile ? 'rotate-180' : ''}`}
                  />
                  {showProfile ? 'Hide' : 'Show'} data profile
                </button>
                {showProfile && (
                  <div className="mt-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <DataProfilePanel profile={selected.profile} />
                  </div>
                )}
              </div>
            )}

            {/* Loading skeleton */}
            {askMutation.isPending && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex items-center justify-center gap-3 text-gray-500">
                <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                Generating query and chart…
              </div>
            )}

            {/* Results */}
            {results.map(({ question, result }, i) => (
              <QueryResultCard
                key={`${result.id}-${i}`}
                result={result}
                question={question}
                datasourceId={selectedId!}
                datasourceName={selected?.name ?? ''}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
