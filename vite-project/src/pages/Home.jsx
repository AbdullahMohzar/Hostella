import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Welcome to Hostella</h1>
      <p>Find your perfect hostel or manage your property with ease. Join a community designed for students and hostel owners!</p>
      <button onClick={() => navigate('/login')}>Sign In</button>
      <button onClick={() => navigate('/signup')}>Sign Up</button>
    </div>
  );
}

export default Home;