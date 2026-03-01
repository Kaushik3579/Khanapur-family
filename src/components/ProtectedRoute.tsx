import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/AppStyles.module.css';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className={styles.statusPage}>Checking authentication...</div>;
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
