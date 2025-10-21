import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css'
import HostelDetails from './pages/HostelDetails';

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
