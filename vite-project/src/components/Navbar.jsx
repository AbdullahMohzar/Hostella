import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useEffect, useState } from 'react';

function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (user) {
      const fetchRole = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setRole(userDoc.exists() ? userDoc.data().role : 'user');
      };
      fetchRole();
    }
  }, [user]);

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/'));
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-around', padding: '10px', backgroundColor: '#f0f0f0' }}>
      <div>
        <a href="/" style={{ margin: '0 10px', textDecoration: 'none' }}>Home</a>
        {user && (
          <a href="/hostel/1" style={{ margin: '0 10px', textDecoration: 'none' }}>Hostel Details</a>
        )}
      </div>
      <div>
        {!user ? (
          <>
            <a href="/login" style={{ margin: '0 10px', textDecoration: 'none' }}>Login</a>
            <a href="/signup" style={{ margin: '0 10px', textDecoration: 'none' }}>Signup</a>
          </>
        ) : (
          <>
            <a href="/dashboard" style={{ margin: '0 10px', textDecoration: 'none' }}>
              {role === 'owner' ? 'Owner Dashboard' : 'User Dashboard'}
            </a>
            <button onClick={handleLogout} style={{ margin: '0 10px' }}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;