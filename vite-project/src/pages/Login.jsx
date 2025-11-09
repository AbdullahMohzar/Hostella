import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, userRole, currentUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  // If already logged in, redirect automatically
  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'owner') navigate('/owner-dashboard')
      else navigate('/user-dashboard')
    }
  }, [currentUser, userRole, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setError('')
      setLoading(true)
      await login(email, password)
      // Redirect handled by useEffect
    } catch (err) {
      setError('Failed to log in: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`login ${theme}`}>
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Login</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            <div className="form-footer">
              <Link to="/reset-password" className="forgot-password">
                Forgot Password?
              </Link>
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="signup-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
