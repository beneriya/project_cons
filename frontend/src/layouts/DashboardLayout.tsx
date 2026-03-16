import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/appContext'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">ParquetPro</div>
          <div className="sidebar-logo-sub">MANAGEMENT SYSTEM</div>
        </div>
        <nav>
          <Link to="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
            <span className="ico">🏠</span> Dashboard
          </Link>
          <Link to="/inventory" className={`nav-item ${pathname === '/inventory' ? 'active' : ''}`}>
            <span className="ico">📦</span> Inventory
          </Link>
          <Link to="/alerts" className={`nav-item ${pathname === '/alerts' ? 'active' : ''}`}>
            <span className="ico">🚨</span> Alerts
          </Link>
          <Link to="/planner" className={`nav-item ${pathname === '/planner' ? 'active' : ''}`}>
            <span className="ico">🗺️</span> Planner
          </Link>
          <Link to="/transactions" className={`nav-item ${pathname === '/transactions' ? 'active' : ''}`}>
            <span className="ico">📊</span> Transactions
          </Link>
          <Link to="/reports" className={`nav-item ${pathname === '/reports' ? 'active' : ''}`}>
            <span className="ico">📈</span> Reports
          </Link>
        </nav>
      </aside>
      <main className="main">
        <header className="header">
          <div className="title">Dashboard</div>
          <div className="header-right">
            <span className="user-info">{user?.email ?? 'Guest'}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}

