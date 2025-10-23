import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) navigate('/');

  const handleLogout = () => signOut(auth);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Student/User Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <button onClick={handleLogout}>Logout</button>
      <div>Booking History: [Skeleton Loader]</div>
      <div>Roommate Matches: [Coming Soon]</div>
    </div>
  );
}

export default UserDashboard;