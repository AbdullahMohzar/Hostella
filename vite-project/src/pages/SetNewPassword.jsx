import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import './ResetPassword.css'

function SetNewPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [validCode, setValidCode] = useState(false)
  const [email, setEmail] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const oobCode = searchParams.get('oobCode')

  useEffect(() => {
    const checkCode = async () => {
      try {
        const emailFromCode = await verifyPasswordResetCode(auth, oobCode)
        setEmail(emailFromCode)
        setValidCode(true)
      } catch (err) {
        setError('Invalid or expired reset link.')
      }
    }
    if (oobCode) checkCode()
  }, [oobCode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) return setError('Password must be at least 6 characters.')
    if (newPassword !== confirmPassword) return setError('Passwords do not match.')

    try {
      setLoading(true)
      await confirmPasswordReset(auth, oobCode, newPassword)
      setSuccess('Password has been reset! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError('Failed to reset password: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!validCode) return <div className="reset-container"><p>{error || 'Verifying link...'}</p></div>

  return (
    <div className="reset-container">
      <h2>Reset Password for {email}</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            placeholder="Enter new password"
          />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm new password"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}

export default SetNewPassword
