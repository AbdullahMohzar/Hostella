import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from './ThemeContext'
import './Navbar.css'

function Navbar() {
  const { currentUser, logout, userRole } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <nav className={`navbar ${theme}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Hostella
        </Link>

        <div className="navbar-menu">
          {/* General links for all users */}
          {(!currentUser || userRole !== 'owner') && (
            <>
              <Link to="/" className="navbar-link">
                Find Hostels
              </Link>
              <Link to="/" className="navbar-link">
                Find Roommates
              </Link>
            </>
          )}
          <Link to="/about" className="navbar-link">
            About
          </Link>
          <Link to="/contact" className="navbar-link">
            Contact
          </Link>

          {/* Authenticated user links */}
          {currentUser ? (
            <>
              {userRole === 'owner' ? (
                <>
                  <Link to="/owner-dashboard" className="navbar-link">
                    Dashboard
                  </Link>
                  <Link to="/hostels/manage" className="navbar-link">
                    Manage Hostels
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/user-dashboard" className="navbar-link">
                    Dashboard
                  </Link>
                  <Link to="/hostels/book" className="navbar-link">
                    Book Hostel
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="navbar-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Sign In
              </Link>
              <Link to="/signup" className="navbar-link navbar-button">
                Sign Up
              </Link>
            </>
          )}

          {/* Theme toggle */}
          <button 
            onClick={toggleTheme} 
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
