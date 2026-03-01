import { db } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';

export type Event = {
  id?: string;
  title: string;
  description: string;
  date: string;
  createdBy: string;
};

const eventsRef = collection(db, 'events');

const normalizeEvent = (id: string, data: Record<string, unknown>): Event => {
  const rawDate = data.date;
  let date = '';

  if (rawDate instanceof Timestamp) {
    date = rawDate.toDate().toISOString();
  } else if (rawDate instanceof Date) {
    date = rawDate.toISOString();
  } else if (typeof rawDate === 'string') {
    date = rawDate;
  }

  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    description: typeof data.description === 'string' ? data.description : '',
    date,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
  };
};

export const createEvent = async (event: Event) => {
  return await addDoc(eventsRef, {
    ...event,
    date: Timestamp.fromDate(new Date(event.date)),
    createdAt: Timestamp.now(),
  });
};

export const getEvents = async () => {
  const q = query(eventsRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((eventDoc) => normalizeEvent(eventDoc.id, eventDoc.data()));
};

export const getEventById = async (id: string) => {
  const docRef = doc(db, 'events', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? normalizeEvent(docSnap.id, docSnap.data()) : null;
};

export const deleteEvent = async (id: string) => {
  await deleteDoc(doc(db, 'events', id));
};
