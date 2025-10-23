import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) navigate('/');

  const handleLogout = () => signOut(auth);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hostel Owner Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <button onClick={handleLogout}>Logout</button>
      <div>Manage Listings: [Skeleton Loader]</div>
      <div>Booking Requests: [Coming Soon]</div>
    </div>
  );
}

export default OwnerDashboard;