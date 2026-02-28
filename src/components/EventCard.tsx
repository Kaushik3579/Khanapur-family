import React from 'react';
import { Link } from 'react-router-dom';
import { deleteEvent } from '../services/eventService';
import type { Event } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from '../styles/AppStyles.module.css';

interface Props {
  event: Event;
  isAdmin: boolean;
}

const EventCard: React.FC<Props> = ({ event, isAdmin }) => {
  const { user } = useAuth();

  const handleDelete = async () => {
    if (window.confirm('Delete this event?')) {
      await deleteEvent(event.id!);
      toast.success('Event deleted');
      window.location.reload();
    }
  };

  return (
    <div className={styles.card}>
      <Link to={`/event/${event.id}`} className={styles.cardTitle}>
        {event.title}
      </Link>
      <p className={styles.cardDesc}>{event.description}</p>
      <p className={styles.cardDate}>{new Date(event.date).toLocaleDateString()}</p>
      {isAdmin && (
        <button onClick={handleDelete} className={styles.deleteBtn}>Delete</button>
      )}
    </div>
  );
};

export default EventCard;
