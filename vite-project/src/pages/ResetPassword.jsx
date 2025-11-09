import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'
import './ResetPassword.css'

function ResetPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()
  const { theme } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setMessage('')
      setError('')
      setLoading(true)
      await resetPassword(email)
      setMessage('Check your inbox for further instructions')
    } catch (err) {
      setError('Failed to reset password: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`reset-password-page ${theme}`}>
      <div className="reset-container">
        <div className="reset-card">
          {/* Icon */}
          <div className="reset-icon">
            <div className="icon-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
          </div>

          {/* Header */}
          <h1 className="reset-title">Forgot Password?</h1>
          <p className="reset-subtitle">
            No worries! Enter your email and we'll send you reset instructions.
          </p>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <form onSubmit={handleSubmit} className="reset-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="form-input"
                />
              </div>
            </div>

            {/* Send Reset Link Button */}
            <button 
              type="submit" 
              className="send-reset-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Back to Sign In Link */}
          <div className="back-link">
            <Link to="/login" className="back-link-text">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="back-home-link">
          <Link to="/" className="back-link-text">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
