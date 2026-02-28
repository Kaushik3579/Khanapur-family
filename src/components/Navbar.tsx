import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/AppStyles.module.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo} style={{marginLeft: '32px'}}>Family Events</Link>
      <div className={styles.navLinks} style={{flex: 1}}>
        <Link to="/events" className={styles.navLink}>My Events</Link>
        <Link to="/members" className={styles.navLink}>Members</Link>
        <Link to="/connect" className={styles.navLink}>Connect</Link>
      </div>
      <div style={{marginLeft: 'auto'}}>
        {user ? (
          <button onClick={handleLogout} className={styles.navBtn}>Logout</button>
        ) : (
          <Link to="/login" className={styles.navBtn}>Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
