import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { toast } from 'react-toastify';
import styles from '../styles/AppStyles.module.css';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Account created!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} style={{minHeight:'100vh',justifyContent:'center',alignItems:'center',display:'flex'}}>
      <form onSubmit={handleSignup} className={styles.card} style={{maxWidth:400,width:'100%',padding:'32px 24px',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <h2 className={styles.cardTitle} style={{marginBottom:16}}>Sign Up</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} style={{marginBottom:12}} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={styles.input} style={{marginBottom:20}} required />
        <button type="submit" className={styles.submitBtn} style={{width:'100%',marginBottom:8}} disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
        <p style={{marginTop:8,fontSize:'0.95rem',textAlign:'center'}}>Already have an account? <Link to="/login" style={{color:'#4f46e5',textDecoration:'underline'}}>Login</Link></p>
      </form>
    </div>
  );
};

export default SignupPage;
