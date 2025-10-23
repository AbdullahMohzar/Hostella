import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase.js';

import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import HostelDetails from './pages/HostelDetails.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function App() {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role || 'user');
        } else {
          setRole('user');
        }
      } catch (error) {
        console.error('Error fetching role:', error);
        setError('Failed to load your role. Please try again.');
        setRole('user'); // Default to user on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20%', fontSize: '18px' }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20%', fontSize: '18px', color: 'red' }}>
        {error} <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hostel/:id" element={<HostelDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            user ? (
              role === 'owner' ? (
                <OwnerDashboard />
              ) : (
                <UserDashboard />
              )
            ) : (
              <Home />
            )
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  );
}

export default App;