import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/AppStyles.module.css';

const NotFoundPage: React.FC = () => (
  <section className={styles.notFound}>
    <div>
      <h1 className={styles.notFoundCode}>404</h1>
      <p className={styles.notFoundText}>Page not found.</p>
      <p className={styles.authSwitch}><Link to="/">Go to home page</Link></p>
    </div>
  </section>
);

export default NotFoundPage;
