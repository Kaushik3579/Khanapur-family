import React, { useEffect, useRef, useState } from 'react';
import { createEvent } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from '../styles/AppStyles.module.css';

const EventModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const openListener = () => setOpen(true);
    document.addEventListener('openEventModal', openListener);
    return () => document.removeEventListener('openEventModal', openListener);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setTitle('');
    setDescription('');
    setDate('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('You must be logged in');
    setLoading(true);
    try {
      await createEvent({
        title,
        description,
        date,
        createdBy: user.uid,
      });
      toast.success('Event created!');
      handleClose();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} ref={modalRef}>
      <form onSubmit={handleSubmit} className={styles.modal}>
        <button type="button" className={styles.closeBtn} onClick={handleClose}>&times;</button>
        <h2 className={styles.modalTitle}>Add Event</h2>
        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className={styles.input} required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className={styles.textarea} required />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={styles.input} required />
        <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Creating...' : 'Create Event'}</button>
      </form>
    </div>
  );
};

export default EventModal;
