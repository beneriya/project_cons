import { useLocation } from 'react-router-dom'
import './HomePage.css'

const titles: Record<string, string> = {
  '/inventory': 'Manage Inventory',
  '/planner': 'Layout Planner',
  '/transactions': 'Transactions',
  '/reports': 'Reports',
}

export default function PlaceholderPage() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Page'
  return (
    <div className="dashboard-header">
      <h1 className="h1-page">{title}</h1>
      <p className="dashboard-subtitle">This page is coming soon.</p>
    </div>
  )
}
