import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import './LoginPage.css'

export default function SignUpPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return
    // TODO: call backend /auth/signup
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="cover-tag">ParquetPro System</div>
        <h1>Паркет <span>агуулах</span></h1>
        <p className="login-subtitle">Бүртгүүлэх</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Хэрэглэгчийн нэр</label>
            <input
              className="inp"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Нэрээ оруулна уу"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">И-мэйл</label>
            <input
              className="inp"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="И-мэйлээ оруулна уу"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Нууц үг</label>
            <input
              className="inp"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Нууц үг давтах</label>
            <input
              className="inp"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Бүртгүүлэх</button>
        </form>
        <p className="signup-link">
          Аль хэдийн бүртгэлтэй юу? <Link to="/login">Нэвтрэх</Link>
        </p>
      </div>
    </div>
  )
}
