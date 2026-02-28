import React, { useEffect, useState } from 'react';
import type { Event } from '../services/eventService';
import { getEvents } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import styles from '../styles/AppStyles.module.css';

const MyEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const allEvents = await getEvents();
      setEvents(allEvents.filter(e => e.createdBy === user?.uid));
      setLoading(false);
    };
    fetchEvents();
  }, [user]);

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><span>Loading...</span></div>;

  return (
    <div className={styles.container}>
      <h2 style={{width:'100%',textAlign:'center',fontWeight:700,fontSize:'1.3rem',marginBottom:16}}>My Events ({events.length})</h2>
      {events.map(event => (
        <EventCard key={event.id} event={event} isAdmin={false} />
      ))}
    </div>
  );
};

export default MyEventsPage;
