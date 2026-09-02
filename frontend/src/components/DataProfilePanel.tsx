import type { DataProfile, ColumnStat } from '@/types'
import { Hash, Type, BarChart2 } from 'lucide-react'
import clsx from 'clsx'

function ColCard({ col }: { col: ColumnStat }) {
  const isNumeric = col.min !== undefined
  const nullPct = col.total_rows ? Math.round(((col.null_count ?? 0) / col.total_rows) * 100) : 0

  return (
    <div className="bg-gray-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        {isNumeric ? (
          <Hash size={14} className="text-blue-400 flex-shrink-0" />
        ) : (
          <Type size={14} className="text-purple-400 flex-shrink-0" />
        )}
        <span className="text-sm font-medium text-white truncate" title={col.name}>
          {col.name}
        </span>
        <span className="ml-auto text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded font-mono">
          {col.type}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
        {col.non_null !== undefined && (
          <>
            <span>Non-null</span>
            <span className="text-right text-gray-200">{col.non_null.toLocaleString()}</span>
          </>
        )}
        {nullPct > 0 && (
          <>
            <span>Null %</span>
            <span className={clsx('text-right', nullPct > 20 ? 'text-amber-400' : 'text-gray-200')}>
              {nullPct}%
            </span>
          </>
        )}
        {isNumeric && (
          <>
            <span>Min / Max</span>
            <span className="text-right text-gray-200">
              {col.min?.toLocaleString()} / {col.max?.toLocaleString()}
            </span>
            <span>Mean</span>
            <span className="text-right text-gray-200">{col.mean?.toFixed(2)}</span>
          </>
        )}
        {col.unique_count !== undefined && (
          <>
            <span>Unique</span>
            <span className="text-right text-gray-200">{col.unique_count.toLocaleString()}</span>
          </>
        )}
      </div>

      {col.top_values && col.top_values.length > 0 && (
        <div className="space-y-1">
          {col.top_values.slice(0, 3).map(({ value, count }) => {
            const pct = col.total_rows ? Math.round((count / col.total_rows) * 100) : 0
            return (
              <div key={value} className="flex items-center gap-2 text-xs">
                <span className="truncate text-gray-300 w-24" title={value}>
                  {value || '(empty)'}
                </span>
                <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-gray-500 w-8 text-right">{pct}%</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DataProfilePanel({ profile }: { profile: DataProfile }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <BarChart2 size={14} />
        <span>
          <strong className="text-white">{profile.row_count.toLocaleString()}</strong> rows ·{' '}
          <strong className="text-white">{profile.columns.length}</strong> columns
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {profile.columns.map((col) => (
          <ColCard key={col.name} col={col} />
        ))}
      </div>
    </div>
  )
}
