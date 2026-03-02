import React from 'react';
import { Link } from 'react-router-dom';
import { deleteEvent } from '../services/eventService';
import type { Event } from '../services/eventService';
import { toast } from 'react-toastify';
import styles from '../styles/AppStyles.module.css';

interface Props {
  event: Event;
  canDelete: boolean;
}

const EventCard: React.FC<Props> = ({ event, canDelete }) => {
  const handleDelete = async () => {
    if (window.confirm('Delete this event?')) {
      try {
        await deleteEvent(event.id!);
        toast.success('Event deleted');
      } catch (err: any) {
        const code = err?.code ? ` (${err.code})` : '';
        toast.error(`Unable to delete event${code}`);
      }
    }
  };

  return (
    <div className={styles.card}>
      <Link to={`/event/${event.id}`} className={styles.cardTitle}>
        {event.title}
      </Link>
      <p className={styles.cardDesc}>{event.description}</p>
      <p className={styles.cardDate}>
        {new Date(event.date).toLocaleDateString(undefined, {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </p>
      {canDelete && (
        <button onClick={handleDelete} className={styles.deleteBtn}>Delete</button>
      )}
    </div>
  );
};

export default EventCard;
