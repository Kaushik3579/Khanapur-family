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
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
};

export const getEventById = async (id: string) => {
  const docRef = doc(db, 'events', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Event : null;
};

export const deleteEvent = async (id: string) => {
  await deleteDoc(doc(db, 'events', id));
};
