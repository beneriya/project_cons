import { useLocation } from 'react-router-dom'

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
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="text-[0.9375rem] text-muted-foreground mt-1">Энэ хуудас үргэлжлэх болно.</p>
    </div>
  )
}
