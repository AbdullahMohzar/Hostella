import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import UserDashboard from './pages/UserDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import HostelDetails from './pages/HostelDetails'
import ResetPassword from './pages/ResetPassword'
import AboutPage from './components/AboutPage'
import ContactPage from './components/ContactPage'
// import SetNewPassword from './pages/SetNewPassword'
import './App.css'

// ProtectedRoute component
function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole } = useAuth()
  if (!currentUser) return <Navigate to="/login" />
  if (!allowedRoles.includes(userRole)) return <Navigate to="/" />
  return children
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/user-dashboard" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <UserDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/owner-dashboard" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/hostel/:id" element={<HostelDetails />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* <Route path="/set-new-password" element={<SetNewPassword />} /> */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Routes>
            </main>
          </div>
        
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
