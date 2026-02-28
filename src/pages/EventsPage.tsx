import React, { useEffect, useState } from 'react';
import { getEvents } from '../services/eventService';
import type { Event } from '../services/eventService';
import EventCard from '../components/EventCard';
import styles from '../styles/AppStyles.module.css';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setEvents(await getEvents());
      setLoading(false);
    };
    fetchEvents();
  }, []);

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><span>Loading events...</span></div>;

  return (
    <div className={styles.container}>
      {events.map(event => (
        <EventCard key={event.id} event={event} isAdmin={false} />
      ))}
    </div>
  );
};

export default EventsPage;
