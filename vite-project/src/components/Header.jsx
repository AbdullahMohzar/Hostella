import { useTheme } from './ThemeContext'
import './Header.css'

function Header() {
  const { theme } = useTheme()

  return (
    <header className={`header ${theme}`}>
      <div className="header-content">
        <h1 className="header-title">Welcome to Hostella</h1>
        <p className="header-subtitle">Find your perfect hostel accommodation</p>
      </div>
    </header>
  )
}

export default Header

