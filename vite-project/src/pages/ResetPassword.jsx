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
    <div className={`reset-password ${theme}`}>
      <div className="reset-container">
        <div className="reset-card">
          <h2 className="reset-title">Reset Password</h2>
          
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          
          <form onSubmit={handleSubmit} className="reset-form">
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
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          
          <div className="login-link">
            Remember your password? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

