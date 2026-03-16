import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Package, CheckCircle, AlertTriangle, ArrowUpDown } from 'lucide-react'
import { Badge } from '../components/Badge'
import { Widget } from '../components/Widget'
import { useApp } from '../context/appContext'
import './HomePage.css'

export default function HomePage() {
  const { materials, transactions } = useApp()

  const stats = useMemo(() => {
    const totalMaterials = materials.length
    const inStock = materials.filter(m => m.quantity > m.minThreshold).length
    const lowStock = materials.filter(m => m.quantity > 0 && m.quantity <= m.minThreshold).length
    const currentMonth = new Date().getMonth()
    const transactionsThisMonth = transactions.filter(t => {
      const transactionMonth = new Date(t.date).getMonth()
      return transactionMonth === currentMonth
    }).length
    return { totalMaterials, inStock, lowStock, transactionsThisMonth }
  }, [materials, transactions])

  const lowStockItems = materials.filter(m => m.quantity > 0 && m.quantity <= m.minThreshold)
  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="h1-page">Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back! Here&apos;s an overview of your parquet flooring inventory.
        </p>
      </div>

      <div className="widget-row">
        <Widget
          icon={<Package size={22} />}
          value={stats.totalMaterials}
          label="Total Materials"
          color="blue"
        />
        <Widget
          icon={<CheckCircle size={22} />}
          value={stats.inStock}
          label="In Stock Items"
          color="green"
        />
        <Widget
          icon={<AlertTriangle size={22} />}
          value={stats.lowStock}
          label="Low Stock Alerts"
          color="red"
        />
        <Widget
          icon={<ArrowUpDown size={22} />}
          value={stats.transactionsThisMonth}
          label="Transactions This Month"
          color="amber"
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-head">
            <h3 className="h3-card">Low Stock Alerts</h3>
            <Badge variant="low-stock">⚠ {lowStockItems.length} items</Badge>
          </div>
          <div className="dashboard-card-body">
            {lowStockItems.length === 0 ? (
              <p className="dashboard-empty">No low stock items</p>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="dashboard-list-item">
                  <div>
                    <div className="dashboard-list-primary">{item.name}</div>
                    <div className="dashboard-list-secondary">{item.type}</div>
                  </div>
                  <div className="dashboard-list-right">
                    <div className="dashboard-list-value alert">{item.quantity} boxes</div>
                    <div className="dashboard-list-secondary">Min: {item.minThreshold}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-head">
            <h3 className="h3-card">Recent Transactions</h3>
            <Link to="/transactions" className="btn btn-secondary btn-sm">
              View All
            </Link>
          </div>
          <div className="dashboard-card-body">
            {recentTransactions.map(transaction => (
              <div key={transaction.id} className="dashboard-transaction-row">
                <div className="dashboard-transaction-left">
                  <Badge variant={transaction.type === 'IN' ? 'in' : 'out'}>
                    {transaction.type === 'IN' ? '↑' : '↓'} {transaction.type}
                  </Badge>
                  <div>
                    <div className="dashboard-list-primary">{transaction.materialName}</div>
                    <div className="dashboard-list-secondary">{transaction.date}</div>
                  </div>
                </div>
                <div className="dashboard-list-value">{transaction.quantity} boxes</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card dashboard-actions">
        <h3 className="h3-card">Quick Actions</h3>
        <div className="dashboard-actions-wrap">
          <Link to="/inventory" className="btn btn-primary">
            📦 Manage Inventory
          </Link>
          <Link to="/planner" className="btn btn-secondary">
            🗺️ Layout Planner
          </Link>
          <Link to="/transactions" className="btn btn-secondary">
            📊 Add Transaction
          </Link>
          <Link to="/reports" className="btn btn-secondary">
            📈 View Reports
          </Link>
        </div>
      </div>
    </div>
  )
}
