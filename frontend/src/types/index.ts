export interface DataSource {
  id: number
  name: string
  type: 'csv' | 'sql'
  row_count: number | null
  table_name: string | null
  created_at: string
  profile?: DataProfile
}

export interface ColumnStat {
  name: string
  type: string
  total_rows?: number
  non_null?: number
  null_count?: number
  min?: number
  max?: number
  mean?: number
  std?: number
  unique_count?: number
  top_values?: { value: string; count: number }[]
}

export interface DataProfile {
  table_name: string
  row_count: number
  columns: ColumnStat[]
}

export interface QueryResult {
  id: number
  sql: string
  explanation: string | null
  chart: ChartResult
  row_count: number
}

export interface PlotlyFigure {
  data: object[]
  layout: object
}

export type ChartResult =
  | { type: 'plotly'; figure: PlotlyFigure; title: string }
  | { type: 'table'; columns: string[]; rows: unknown[][]; title: string; error?: string }

export interface QueryHistoryItem {
  id: number
  question: string
  sql: string | null
  chart_type: string | null
  error: string | null
  created_at: string
}

export interface Dashboard {
  id: number
  title: string
  description: string
  widgets: DashboardWidget[]
  created_at: string
  updated_at: string | null
}

export interface DashboardWidget {
  id: string
  question: string
  datasource_id: number
  datasource_name: string
  query_id: number
  sql: string
  created_at: string
}
