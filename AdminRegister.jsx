import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function AdminRegister() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registrationKey, setRegistrationKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!registrationKey.trim()) {
      setError('Enter the admin registration key.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          registrationKey,
        }),
      })

     const responseText = await response.text()
console.log("Server response:", responseText)

let data

try {
  data = JSON.parse(responseText)
} catch {
  throw new Error(
    "The server returned HTML instead of JSON. Check the registration URL and backend route."
  )
}

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.')
      }

      if (!data.token) {
        throw new Error('Registration succeeded, but no login token was returned.')
      }

      localStorage.setItem('adminToken', data.token)

      // Redirect only after the server confirms success.
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Check that the server is running.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: 450,
      margin: '40px auto',
      padding: 28,
      border: '1px solid #ddd',
      borderRadius: 12,
      fontFamily: 'Arial, sans-serif',
    }}>
      <h1>Admin Registration</h1>
      <p>Create or verify access to the CareerConnect admin dashboard.</p>

      <form onSubmit={handleRegister}>
        <label htmlFor="reg-username">Username</label>
        <input
          id="reg-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          style={{ display: 'block', width: '100%', padding: 10, margin: '8px 0 16px', boxSizing: 'border-box' }}
        />

        <label htmlFor="reg-password">Password</label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          style={{ display: 'block', width: '100%', padding: 10, margin: '8px 0 16px', boxSizing: 'border-box' }}
        />

        <label htmlFor="confirm-password">Confirm Password</label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          style={{ display: 'block', width: '100%', padding: 10, margin: '8px 0 16px', boxSizing: 'border-box' }}
        />

        <label htmlFor="registration-key">Admin Registration Key</label>
        <input
          id="registration-key"
          type="password"
          value={registrationKey}
          onChange={(e) => setRegistrationKey(e.target.value)}
          required
          autoComplete="off"
          style={{ display: 'block', width: '100%', padding: 10, margin: '8px 0 16px', boxSizing: 'border-box' }}
        />

        {error && (
          <p role="alert" style={{ color: 'red' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p>
        Already registered? <Link to="/admin/login">Admin Login</Link>
      </p>

      <Link to="/">Back to Home</Link>
    </div>
  )
}

export default AdminRegister