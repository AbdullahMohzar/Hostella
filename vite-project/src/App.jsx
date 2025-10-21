import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css'
import HostelDetails from './pages/HostelDetails.jsx';
import Login from './pages/Login.jsx';
import OwnerDashboard from '/pages/OwnerDashboard.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import Home from'./pages/Home.jsx';
import Signup from './pages/Signup.jsx';


function App() {
  

  return (
    <div>
    <Routes>
        <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
        
      </Routes>
      </div>
    
  );
}

export default App
