import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { toast } from 'react-toastify';
import styles from '../styles/AppStyles.module.css';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error('Please enter your name');
        setLoading(false);
        return;
      }

      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', credentials.user.uid), {
        userId: credentials.user.uid,
        name: trimmedName,
        email: credentials.user.email || email,
        role: 'member',
        createdAt: serverTimestamp(),
      });
      toast.success('Account created!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.authShell}>
      <form onSubmit={handleSignup} className={styles.authCard}>
        <h1 className={styles.authTitle}>Create account</h1>
        <p className={styles.authSubtitle}>Join your family workspace and start planning together.</p>
        <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className={styles.input} required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={styles.input} required />
        <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
        <p className={styles.authSwitch}>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </section>
  );
};

export default SignupPage;
