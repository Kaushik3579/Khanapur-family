import React, { useEffect, useState } from 'react';
import { subscribeEvents } from '../services/eventService';
import type { Event } from '../services/eventService';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/AppStyles.module.css';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeEvents(
      (nextEvents) => {
        setEvents(nextEvents);
        setLoading(false);
      },
      () => {
        setError('Unable to load events right now.');
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  if (loading) return <div className={styles.statusPage}>Loading events...</div>;
  if (error) return <div className={styles.statusPage}>{error}</div>;

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <p className={styles.sectionKicker}>Family updates</p>
        <h1 className={styles.sectionTitle}>Upcoming Moments</h1>
        <p className={styles.sectionSubtitle}>Plan birthdays, gatherings, and celebrations in one shared place.</p>
      </header>
      <div className={styles.statRow}>
        <span className={styles.statPill}>{events.length} total events</span>
        <span className={styles.statPill}>shared calendar</span>
      </div>

      <div className={styles.container}>
        {events.length > 0 ? (
          events.map((event) => (
            <EventCard key={event.id} event={event} canDelete={isAdmin || event.createdBy === user?.uid} />
          ))
        ) : (
          <div className={styles.emptyCard}>No events yet. Tap the + button to add the first family event.</div>
        )}
      </div>
    </section>
  );
};

export default EventsPage;
