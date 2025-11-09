import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, currentUser } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  // AUTO REDIRECT AFTER LOGIN
  useEffect(() => {
    if (!currentUser) return

    const redirectBasedOnRole = async () => {
      try {
        setLoading(true)
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          const role = userDoc.data().role
          if (role === 'owner') {
            navigate('/owner-dashboard', { replace: true })
          } else {
            navigate('/user-dashboard', { replace: true })
          }
        } else {
          navigate('/user-dashboard', { replace: true })
        }
      } catch (err) {
        console.error('Redirect error:', err)
        navigate('/user-dashboard', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    redirectBasedOnRole()
  }, [currentUser, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      await login(email, password)
      // Redirect handled in useEffect
    } catch (err) {
      setError('Failed to log in: ' + err.message)
      setLoading(false)
    }
  }

  // ✅ Google Sign-In Logic
  const handleGoogleLogin = async () => {
    const auth = getAuth()
    const provider = new GoogleAuthProvider()

    try {
      setError('')
      setLoading(true)

      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        // Create new user record if first-time login
        await setDoc(userRef, {
          email: user.email,
          role: 'user',
          createdAt: new Date()
        })
      }

      navigate('/user-dashboard', { replace: true })
    } catch (err) {
      console.error('Google login error:', err)
      setError('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`login-page ${theme}`}>
      <div className="login-container">
        <div className="login-card">
          <div className="login-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue to Hostella</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
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

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox-input"
                />
                <span>Remember me</span>
              </label>
              <Link to="/reset-password" className="forgot-password-link">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="signin-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="social-divider">
            <span>Or continue with</span>
          </div>

          <div className="social-buttons">
            <button
              type="button"
              className="social-button google-button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </button>
          </div>

          <div className="signup-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
