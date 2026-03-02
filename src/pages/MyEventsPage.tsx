import React, { useEffect, useState } from 'react';
import type { Event } from '../services/eventService';
import { subscribeEvents } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import styles from '../styles/AppStyles.module.css';

const MyEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeEvents(
      (allEvents) => {
        setEvents(allEvents.filter((event) => event.createdBy === user.uid));
        setLoading(false);
      },
      () => {
        setError('Unable to load your events.');
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user?.uid]);

  if (loading) return <div className={styles.statusPage}>Loading your events...</div>;
  if (error) return <div className={styles.statusPage}>{error}</div>;

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <p className={styles.sectionKicker}>Personal board</p>
        <h1 className={styles.sectionTitle}>My Events ({events.length})</h1>
        <p className={styles.sectionSubtitle}>Events created from your account.</p>
      </header>
      <div className={styles.statRow}>
        <span className={styles.statPill}>{events.length} created by you</span>
        <span className={styles.statPill}>organizer mode</span>
      </div>

      <div className={styles.container}>
        {events.length > 0 ? (
          events.map((event) => (
            <EventCard key={event.id} event={event} canDelete={true} />
          ))
        ) : (
          <div className={styles.emptyCard}>You have not created any events yet.</div>
        )}
      </div>
    </section>
  );
};

export default MyEventsPage;
