// Signup.jsx - FULLY WORKING WITH GOOGLE SIGNUP
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'
import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import './Signup.css'

function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    agreeToTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signup } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  // Regular Signup
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match')
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    if (!formData.agreeToTerms) {
      return setError('Please agree to the Terms of Service and Privacy Policy')
    }

    try {
      setError('')
      setLoading(true)
      const displayName = `${formData.firstName} ${formData.lastName}`.trim()
      const additionalData = {
        phone: formData.phone,
        location: formData.location,
        bio: ''
      }
      await signup(
        formData.email,
        formData.password,
        displayName,
        formData.role,
        additionalData
      )

      // Navigate based on role
      if (formData.role === 'owner') {
        navigate('/owner-dashboard', { replace: true })
      } else {
        navigate('/user-dashboard', { replace: true })
      }
    } catch (err) {
      setError('Failed to create account: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Google Signup
  const handleGoogleSignup = async () => {
    const auth = getAuth()
    const provider = new GoogleAuthProvider()

    try {
      setError('')
      setLoading(true)
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        // Create new user in Firestore
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          role: 'user', // default role
          phone: '',
          location: '',
          bio: '',
          createdAt: new Date()
        })
      }

      navigate('/user-dashboard', { replace: true })
    } catch (err) {
      console.error('Google signup error:', err)
      setError('Google sign-up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`signup-page ${theme}`}>
      <div className="signup-container">
        <div className="signup-card">
          {/* Header */}
          <h1 className="signup-title">Create Your Account</h1>
          <p className="signup-subtitle">Join Hostella and start your journey</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="signup-form">
            {/* First & Last Name */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            {/* Phone & Location */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="form-group">
              <label htmlFor="role">I am a</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="role-select"
              >
                <option value="user">Student/Traveler</option>
                <option value="owner">Hostel Owner</option>
              </select>
            </div>

            {/* Terms */}
            <label className="terms-checkbox">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="terms-link">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/privacy" className="terms-link">Privacy Policy</Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="create-account-button"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Social Signup */}
          <div className="social-divider"><span>Or sign up with</span></div>
          <div className="social-buttons">
            <button
              type="button"
              className="social-button google-button"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              Google
            </button>
            <button
              type="button"
              className="social-button facebook-button"
              onClick={() => alert('Facebook signup coming soon')}
            >
              Facebook
            </button>
          </div>

          {/* Sign In */}
          <div className="signin-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
