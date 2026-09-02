import Plot from 'react-plotly.js'
import type { ChartResult } from '@/types'

interface Props {
  chart: ChartResult
  compact?: boolean
}

export default function ChartViewer({ chart, compact = false }: Props) {
  const height = compact ? 280 : 420

  if (chart.type === 'plotly') {
    return (
      <div className="w-full">
        {chart.title && !compact && (
          <h3 className="text-sm font-semibold text-gray-300 mb-2">{chart.title}</h3>
        )}
        <Plot
          data={chart.figure.data as Plotly.Data[]}
          layout={{
            ...(chart.figure.layout as Partial<Plotly.Layout>),
            height,
            autosize: true,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#e2e8f0', size: 12 },
            margin: { l: 40, r: 20, t: compact ? 30 : 50, b: 40 },
          }}
          config={{ responsive: true, displayModeBar: !compact }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </div>
    )
  }

  // Table fallback
  return (
    <div className="w-full overflow-auto" style={{ maxHeight: height }}>
      {chart.title && !compact && (
        <h3 className="text-sm font-semibold text-gray-300 mb-2">{chart.title}</h3>
      )}
      {chart.error && (
        <p className="text-xs text-amber-400 mb-2">⚠ {chart.error}</p>
      )}
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr>
            {chart.columns.map((col) => (
              <th
                key={col}
                className="px-3 py-2 bg-gray-800 text-gray-300 font-medium border-b border-gray-700 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}>
              {(row as unknown[]).map((cell, j) => (
                <td key={j} className="px-3 py-1.5 text-gray-300 border-b border-gray-800 whitespace-nowrap">
                  {cell == null ? <span className="text-gray-600">null</span> : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
