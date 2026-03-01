import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEventById } from '../services/eventService';
import type { Event } from '../services/eventService';
import styles from '../styles/AppStyles.module.css';

const EventDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      setError(null);
      try {
        if (id) {
          setEvent(await getEventById(id));
        }
      } catch {
        setError('Unable to load this event.');
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  if (loading) return <div className={styles.statusPage}>Loading event...</div>;
  if (error) return <div className={styles.statusPage}>{error}</div>;
  if (!event) return <div className={styles.statusPage}>Event not found.</div>;

  return (
    <div className={styles.detailCard}>
      <h1 className={styles.detailTitle}>{event.title}</h1>
      <p className={styles.detailDescription}>{event.description}</p>
      <p className={styles.detailDate}>
        {new Date(event.date).toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  );
};

export default EventDetailsPage;
