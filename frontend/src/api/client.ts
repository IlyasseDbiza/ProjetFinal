import axios from 'axios'
import type { DataSource, QueryResult, QueryHistoryItem, Dashboard, DashboardWidget, ChartResult } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// ── DataSources ──────────────────────────────────────────────────────────────

export async function uploadCSV(file: File, name: string): Promise<DataSource> {
  const form = new FormData()
  form.append('file', file)
  form.append('name', name)
  const { data } = await api.post<DataSource>('/datasources/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function listDataSources(): Promise<DataSource[]> {
  const { data } = await api.get<DataSource[]>('/datasources/')
  return data
}

export async function getDataSource(id: number): Promise<DataSource> {
  const { data } = await api.get<DataSource>(`/datasources/${id}`)
  return data
}

export async function deleteDataSource(id: number): Promise<void> {
  await api.delete(`/datasources/${id}`)
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function askQuestion(datasourceId: number, question: string): Promise<QueryResult> {
  const { data } = await api.post<QueryResult>('/queries/ask', {
    datasource_id: datasourceId,
    question,
  })
  return data
}

export async function getQueryHistory(datasourceId: number): Promise<QueryHistoryItem[]> {
  const { data } = await api.get<QueryHistoryItem[]>(`/queries/history/${datasourceId}`)
  return data
}

export async function getQueryChart(historyId: number): Promise<ChartResult> {
  const { data } = await api.get<{ chart: ChartResult }>(`/queries/chart/${historyId}`)
  return data.chart
}

// ── Dashboards ───────────────────────────────────────────────────────────────

export async function listDashboards(): Promise<Dashboard[]> {
  const { data } = await api.get<Dashboard[]>('/dashboards/')
  return data
}

export async function createDashboard(title: string, description: string): Promise<Dashboard> {
  const { data } = await api.post<Dashboard>('/dashboards/', { title, description, widgets: [] })
  return data
}

export async function getDashboard(id: number): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>(`/dashboards/${id}`)
  return data
}

export async function addWidgetToDashboard(
  dashId: number,
  dashboard: Dashboard,
  widget: DashboardWidget,
): Promise<Dashboard> {
  const { data } = await api.put<Dashboard>(`/dashboards/${dashId}`, {
    widgets: [...(dashboard.widgets || []), widget],
  })
  return data
}

export async function deleteDashboard(id: number): Promise<void> {
  await api.delete(`/dashboards/${id}`)
}
