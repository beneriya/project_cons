import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/appContext'
import './LoginPage.css'

export default function LoginPage() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const success = login(email, password)
    if (success) {
      navigate('/')
    } else {
      setError(
        'Invalid credentials. Try: admin@parquet.com, worker@parquet.com, or customer@parquet.com'
      )
    }
  }

  return (
    <div className="login-page">
      <div className="login-wrap">
        <div className="login-logo">
          <div className="login-logo-title">ParquetPro</div>
          <div className="login-logo-sub">Parquet Flooring Management System</div>
        </div>

        <div className="login-card">
          <h2 className="login-card-title">Login to Your Account</h2>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label className="input-label" htmlFor="login-email">
                Email or Username
              </label>
              <input
                id="login-email"
                className="inp"
                type="email"
                placeholder="admin@parquet.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                className={`inp ${error ? 'inp-error' : ''}`}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <span className="input-hint err">{error}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-full">
              Sign In
            </button>
          </form>

          <div className="login-demo">
            <div className="login-demo-title">Demo Accounts:</div>
            <div className="login-demo-list">
              <div>👨‍💼 Admin: admin@parquet.com</div>
              <div>👷 Worker: worker@parquet.com</div>
              <div>👤 Customer: customer@parquet.com</div>
              <div className="login-demo-note">Password: any value</div>
            </div>
          </div>
        </div>

        <p className="login-signup">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
