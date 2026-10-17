
import { useState } from 'react'
import { apiFetch, getCsrfCookie } from './api'
import './Login.css'

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await getCsrfCookie()

      const response = await apiFetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Login gagal. Periksa email dan password.'
        )
      }

      onLoginSuccess(data.user)
    } catch (err) {
      setError(err.message || 'Tidak dapat terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>SmartStock</h1>
        <p>Masuk ke akun admin untuk melanjutkan.</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@smartstock.local"
          autoComplete="username"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </form>
    </main>
  )
}

export default Login
