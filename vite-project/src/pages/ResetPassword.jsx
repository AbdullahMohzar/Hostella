import { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

function ResetPassword() {
  const [email, setEmail] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Reset link sent');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleReset} style={{ padding: '20px' }}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <button type="submit">Send Reset Link</button>
    </form>
  );
}

export default ResetPassword;