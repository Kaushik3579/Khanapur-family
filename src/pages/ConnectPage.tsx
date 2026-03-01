import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query as firestoreQuery,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/AppStyles.module.css';

interface Member {
  id: string;
  name?: string;
  email?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  createdAt?: Timestamp;
}

const ConnectPage: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [myName, setMyName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [nameLoading, setNameLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const profileRef = doc(db, 'connectProfiles', user.uid);
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      const data = snapshot.data() as { name?: string } | undefined;
      const nextName = (data?.name || '').trim();
      setMyName(nextName);
      setNameInput((current) => (current.trim() ? current : nextName));
      setNameLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !myName) {
      setMessages([]);
      return;
    }

    const chatQuery = firestoreQuery(collection(db, 'connectMessages'), orderBy('createdAt', 'asc'), limit(150));
    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      setMessages(
        snapshot.docs.map((messageDoc) => {
          const data = messageDoc.data() as Omit<ChatMessage, 'id'>;
          return {
            id: messageDoc.id,
            userId: data.userId || '',
            name: data.name || 'Member',
            text: data.text || '',
            createdAt: data.createdAt,
          };
        }),
      );
    });

    return () => unsubscribe();
  }, [myName, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !myName) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const loadMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersSnapshot, connectProfilesSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'connectProfiles')),
        ]);

        const map = new Map<string, Member>();
        usersSnapshot.docs.forEach((userDoc) => {
          const data = userDoc.data() as Omit<Member, 'id'>;
          map.set(userDoc.id, { id: userDoc.id, name: data.name, email: data.email });
        });
        connectProfilesSnapshot.docs.forEach((profileDoc) => {
          const data = profileDoc.data() as Omit<Member, 'id'>;
          const existing = map.get(profileDoc.id);
          map.set(profileDoc.id, {
            id: profileDoc.id,
            name: data.name || existing?.name,
            email: data.email || existing?.email,
          });
        });

        const users = Array.from(map.values());
        setMembers(users.filter((member) => member.id !== user?.uid));
      } catch {
        setError('Could not load contacts right now.');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [myName, user?.uid]);

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) =>
      [member.name, member.email].some((value) => value?.toLowerCase().includes(q)),
    );
  }, [members, searchTerm]);

  const copyEmail = async (email?: string) => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      toast.success('Email copied');
    } catch {
      toast.error('Unable to copy email');
    }
  };

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.uid) return;
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      toast.error('Please enter your name');
      return;
    }

    setSavingName(true);
    try {
      await setDoc(
        doc(db, 'connectProfiles', user.uid),
        {
          name: trimmedName,
          email: user.email || '',
          userId: user.uid,
          enteredConnectAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast.success('Welcome to Connect');
      setMyName(trimmedName);
    } catch {
      toast.error('Unable to save your name');
    } finally {
      setSavingName(false);
    }
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.uid || !myName) return;

    const text = messageInput.trim();
    if (!text) return;

    setSendingMessage(true);
    try {
      await addDoc(collection(db, 'connectMessages'), {
        userId: user.uid,
        name: myName,
        text,
        createdAt: serverTimestamp(),
      });
      await setDoc(
        doc(db, 'connectProfiles', user.uid),
        {
          name: myName,
          email: user.email || '',
          userId: user.uid,
          lastActiveAt: serverTimestamp(),
        },
        { merge: true },
      );
      setMessageInput('');
    } catch {
      toast.error('Unable to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (nameLoading) {
    return <div className={styles.statusPage}>Opening Connect...</div>;
  }

  if (!myName) {
    return (
      <section className={styles.pageSection}>
        <header className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>Connect</p>
          <h1 className={styles.sectionTitle}>Enter your name to continue</h1>
          <p className={styles.sectionSubtitle}>Everyone must set a display name before accessing shared chat.</p>
        </header>
        <form onSubmit={saveName} className={styles.connectCard}>
          <input
            type="text"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            className={styles.input}
            placeholder="Your name"
            maxLength={50}
          />
          <button type="submit" className={styles.submitBtn} disabled={savingName}>
            {savingName ? 'Saving...' : 'Enter Connect'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <p className={styles.sectionKicker}>Connect</p>
        <h1 className={styles.sectionTitle}>Community Chat</h1>
        <p className={styles.sectionSubtitle}>Shared chat visible to everyone in Connect.</p>
      </header>

      <div className={styles.connectCard}>
        <div className={styles.statRow}>
          <span className={styles.statPill}>Signed in as {myName}</span>
          <span className={styles.statPill}>{messages.length} messages</span>
        </div>

        <div className={styles.chatWindow}>
          {messages.length === 0 ? (
            <p className={styles.sectionSubtitle}>No messages yet. Start the conversation.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={styles.chatMessage}>
                <div className={styles.chatMessageHeader}>
                  <span className={styles.memberName}>{message.name}</span>
                  <span className={styles.chatTime}>
                    {message.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                  </span>
                </div>
                <p className={styles.chatText}>{message.text}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendMessage} className={styles.chatComposer}>
          <input
            type="text"
            placeholder="Type a message"
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            className={styles.input}
            maxLength={500}
          />
          <button type="submit" className={styles.submitBtn} disabled={sendingMessage || !messageInput.trim()}>
            {sendingMessage ? 'Sending...' : 'Send'}
          </button>
        </form>

        <h2 className={styles.sectionTitle}>Members in Connect</h2>
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className={styles.input}
        />

        {loading && <p className={styles.sectionSubtitle}>Loading contacts...</p>}
        {error && <p className={styles.sectionSubtitle}>{error}</p>}

        {!loading && !error && filteredMembers.length === 0 && (
          <div className={styles.emptyCard}>No matching members found.</div>
        )}

        {!loading && !error && filteredMembers.length > 0 && (
          <div className={styles.connectList}>
            {filteredMembers.map((member) => (
              <div key={member.id} className={styles.connectItem}>
                <div>
                  <p className={styles.memberName}>{member.name || 'Family member'}</p>
                  <p className={styles.memberEmail}>{member.email || 'Email unavailable'}</p>
                </div>
                <div className={styles.connectActions}>
                  {member.email ? (
                    <a className={styles.navLink} href={`mailto:${member.email}`}>
                      Email
                    </a>
                  ) : null}
                  <button type="button" className={styles.navBtn} onClick={() => copyEmail(member.email)} disabled={!member.email}>
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ConnectPage;
