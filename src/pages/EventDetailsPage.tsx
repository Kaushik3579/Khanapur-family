import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEventById } from '../services/eventService';
import type { Event } from '../services/eventService';

const EventDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (id) {
        setEvent(await getEventById(id));
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-screen"><span className="loader" /> Loading event...</div>;
  if (!event) return <div className="flex justify-center items-center h-screen">Event not found.</div>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
      <p className="mb-2">{event.description}</p>
      <p className="mb-4 text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
    </div>
  );
};

export default EventDetailsPage;
