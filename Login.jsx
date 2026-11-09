import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Auth.css'

const API_URL = 'http://localhost:5000/api/users'

function Login() {
  const location = useLocation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
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
          email: email.trim(),
          password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please try again.')
      }

      if (!data.token) {
        throw new Error(
          'Login succeeded, but the server did not return a token. Check your backend login route.',
        )
      }

      // Save the user's login information.
      localStorage.setItem('userToken', data.token)

      if (data.user) {
        localStorage.setItem('userInfo', JSON.stringify(data.user))
      }

      // Go back to the page the user originally requested,
      // or open the jobs page by default.
      const requestedPath = location.state?.from?.pathname
      const destination =
        requestedPath &&
        requestedPath !== '/login' &&
        requestedPath !== '/register' &&
        requestedPath !== '/admin'
          ? requestedPath
          : '/jobs'

      navigate(destination, { replace: true })
    } catch (error) {
      setMessage(
        error.message || 'Could not connect to the server. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <span className="auth-brand-icon"></span>
          <span>
            Opportunity Hub<span className="auth-brand-dot">.</span>
          </span>
        </div>

        <div className="auth-welcome-icon">👩🏻‍🎓</div>

        <h1>Welcome Back!</h1>

        <p>
          Login to your Opportunity Hub account and continue discovering
          opportunities.
        </p>

        <label htmlFor="login-email">Email Address</label>
        <input
          id="login-email"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          placeholder="Enter your password"
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
          {loading ? 'Logging In...' : 'Login to Your Account →'}
        </button>

        <p className="auth-footer">
          New to Opportunity Hub?{' '}
          <Link to="/register">Create an account</Link>
        </p>

        <div className="auth-tagline">
          Discover Opportunities. Build Your Future.
        </div>
      </form>
    </main>
  )
}

export default Login