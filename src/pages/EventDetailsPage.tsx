import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { deleteEvent, getEventById } from '../services/eventService';
import type { Event } from '../services/eventService';
import styles from '../styles/AppStyles.module.css';

const EventDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const canDelete = isAdmin || event.createdBy === user?.uid;

  const handleDelete = async () => {
    if (!event.id || deleting) return;
    if (!window.confirm('Delete this event?')) return;

    setDeleting(true);
    try {
      await deleteEvent(event.id);
      toast.success('Event deleted');
      navigate('/my-events');
    } catch (err: any) {
      const code = err?.code ? ` (${err.code})` : '';
      toast.error(`Unable to delete event${code}`);
      setDeleting(false);
    }
  };

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
      {canDelete && (
        <button type="button" className={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete Event'}
        </button>
      )}
    </div>
  );
};

export default EventDetailsPage;
