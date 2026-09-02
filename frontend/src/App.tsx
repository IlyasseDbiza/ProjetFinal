import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ExplorePage from './pages/ExplorePage'
import DataSourcesPage from './pages/DataSourcesPage'
import DashboardsPage from './pages/DashboardsPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ExplorePage />} />
        <Route path="/sources" element={<DataSourcesPage />} />
        <Route path="/dashboards" element={<DashboardsPage />} />
      </Routes>
    </Layout>
  )
}
