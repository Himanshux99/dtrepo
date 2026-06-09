import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom'; // Make sure this is imported


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login,logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
        const userCredential = await login(email, password);
        // We now have to fetch the user's role from firestore,
        // which our AuthContext already does! We just need to wait for it.
        // A simple way is to refetch the user data from context after login
        const user = userCredential.user;
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Redirect based on role
            switch (userData.role) {
                case 'student':
                    navigate('/student');
                    break;
                case 'teacher':
                    navigate('/teacher');
                    break;
                case 'staff':
                    navigate('/staff');
                    break;
                case 'admin':
                    navigate('/admin');
                    break;
                default:
                    navigate('/'); // Redirect to home if no role
            }
        } else {
            setError('User role not found.');
            logout();
        }
    } catch (err) {
        setError('Failed to log in. Please check your email and password.');
        console.error(err);
    }
};
  return (
    <div className={styles.loginContainer}>
      <h2>Login</h2>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className={styles.formGroup}>
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className={styles.submitButton}>Log In</button>
      </form>

      <p style={{marginTop: '1rem'}}>
    Don't have an account? <Link to="/signup">Sign Up</Link>
</p>
<p>
    Signing up as a Teacher? <Link to="/signup/teacher">Click Here</Link>
</p>
    </div>
  );
}

export default Login;