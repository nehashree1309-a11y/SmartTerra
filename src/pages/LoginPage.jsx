import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

const demoUsers = [
  { role: 'Citizen', email: 'citizen@smartterra.demo' },
  { role: 'Surveyor', email: 'surveyor@smartterra.demo' },
  { role: 'Officer', email: 'officer@smartterra.demo' },
  { role: 'Admin', email: 'admin@smartterra.demo' },
]

function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('citizen@smartterra.demo')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (loginEmail = email) => {
    if (!password) {
      setEmail(loginEmail)
      setError('Enter your demo account password first.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const { role } = await signIn(loginEmail, password)
      const destinations = {
        citizen: '/parcel/123-4A',
        surveyor: '/scanner',
        officer: '/verify',
        admin: '/ledger',
      }
      navigate(destinations[role] ?? '/')
    } catch (cause) {
      setError(cause.message || 'Sign-in failed. Check your email and password.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    void handleLogin()
  }

  return (
    <div className="auth-shell">
      <div className="auth-card glass-panel">
        <div className="auth-copy">
          <span className="eyebrow">Secure access</span>
          <h1>Welcome back to SmartTerra</h1>
          <p>Digitized land trust for citizens, surveyors, officers, and admins.</p>

          <div className="demo-role-grid">
            {demoUsers.map((user) => (
              <button
                key={user.role}
                type="button"
                className="demo-role"
                disabled={submitting}
                onClick={() => void handleLogin(user.email)}
              >
                <strong>{user.role}</strong>
                <span>{user.email}</span>
              </button>
            ))}
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Login</h2>

          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>

          <div className="form-row">
            <label className="checkbox-row">
              <input type="checkbox" defaultChecked />
              <span>Remember me</span>
            </label>
            <Link to="/verify">Need help?</Link>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Continue to portal'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
