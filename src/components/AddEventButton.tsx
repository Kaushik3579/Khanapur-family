import React from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/AppStyles.module.css';

const AddEventButton: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <button
      className={styles.floatingAdd}
      onClick={() => document.dispatchEvent(new CustomEvent('openEventModal'))}
      aria-label="Add Event"
    >
      +
    </button>
  );
};

export default AddEventButton;
