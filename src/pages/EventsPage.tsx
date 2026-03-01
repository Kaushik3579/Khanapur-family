import React, { useEffect, useState } from 'react';
import { getEvents } from '../services/eventService';
import type { Event } from '../services/eventService';
import EventCard from '../components/EventCard';
import styles from '../styles/AppStyles.module.css';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        setEvents(await getEvents());
      } catch {
        setError('Unable to load events right now.');
      }
      setLoading(false);
    };
    fetchEvents();
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
            <EventCard key={event.id} event={event} isAdmin={false} />
          ))
        ) : (
          <div className={styles.emptyCard}>No events yet. Tap the + button to add the first family event.</div>
        )}
      </div>
    </section>
  );
};

export default EventsPage;
