import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'

const API_URL = 'http://localhost:5000/api/auth'

function AdminLogin() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Admin login failed. Please try again.')
      }

      if (!data.token) {
        throw new Error('Login succeeded, but the server did not return a token.')
      }

      localStorage.setItem('adminToken', data.token)

      navigate('/admin', { replace: true })

    } catch (error) {
      setMessage(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Make sure the server is running.'
          : error.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleLogin}>

        <div className="auth-brand">
          <span className="auth-brand-icon"></span>
          <span>
            Opportunity Hub<span className="auth-brand-dot">.</span>
          </span>
        </div>

        <div className="auth-welcome-icon">🔐</div>

        <h1>Admin Login</h1>

        <p>
          Welcome back! Sign in to manage your Opportunity Hub platform.
        </p>

        <label htmlFor="admin-username">Admin Username</label>
        <input
          id="admin-username"
          type="text"
          placeholder="Enter admin username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {message && (
          <p className="auth-message" role="alert">
            {message}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging In...' : 'Login to Admin Dashboard →'}
        </button>

        <p className="auth-footer">
          <Link to="/">← Back to Home</Link>
        </p>

        <div className="auth-tagline">
          Manage Opportunities. Empower Futures.
        </div>

      </form>
    </main>
  )
}

export default AdminLogin