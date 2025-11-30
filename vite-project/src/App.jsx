import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './components/ThemeContext';

// Import Page & Component Files
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import HostelDetails from './pages/HostelDetails';
import BookingDetails from './pages/BookingDetails'; 
import ResetPassword from './pages/ResetPassword';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import './App.css'; // Assuming your CSS for App structure is here


// ProtectedRoute component
function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, userRole } = useAuth();
    
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />;
    }
    
    return children;
}


// Main Application Component
function App() {
  return (
    <ThemeProvider>
        <AuthProvider>
            {/* The outer Router is assumed by the environment */}
            <div className="app">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/hostel/:id" element={<HostelDetails />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        
                        {/* Protected User Routes */}
                        <Route 
                            path="/user-dashboard" 
                            element={<ProtectedRoute allowedRoles={['user', 'owner']}><UserDashboard /></ProtectedRoute>} 
                        />
                        
                        {/* NEW BOOKING DETAILS ROUTE (Fixed Path) */}
                        <Route 
                            path="/BookingDetails/:bookingId" 
                            element={<ProtectedRoute allowedRoles={['user', 'owner']}><BookingDetails /></ProtectedRoute>} 
                        />
                        
                        {/* Owner/Admin Routes */}
                        <Route 
                            path="/owner-dashboard" 
                            element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} 
                        />

                    </Routes>
                </main>
            </div>
        </AuthProvider>
    </ThemeProvider>
  );
}

export default App;