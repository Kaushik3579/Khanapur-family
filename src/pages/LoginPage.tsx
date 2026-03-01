import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { toast } from 'react-toastify';
import styles from '../styles/AppStyles.module.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.authShell}>
      <form onSubmit={handleLogin} className={styles.authCard}>
        <h1 className={styles.authTitle}>Welcome back</h1>
        <p className={styles.authSubtitle}>Sign in to view your family calendar and updates.</p>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={styles.input} required />
        <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        <p className={styles.authSwitch}>Don't have an account? <Link to="/signup">Create one</Link></p>
      </form>
    </section>
  );
};

export default LoginPage;
