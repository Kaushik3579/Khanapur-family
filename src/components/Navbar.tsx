import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
      <div className={styles.navbarInner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoOrb} />
          <span className={styles.logoText}>Khanapur</span>
        </Link>

        {user && (
          <div className={styles.navLinks}>
            <NavLink to="/" end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim()}>
              Events
            </NavLink>
            <NavLink to="/my-events" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim()}>
              My Events
            </NavLink>
            <NavLink to="/members" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim()}>
              Members
            </NavLink>
            <NavLink to="/connect" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim()}>
              Connect
            </NavLink>
          </div>
        )}

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
