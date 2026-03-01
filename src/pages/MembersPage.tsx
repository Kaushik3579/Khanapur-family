import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import styles from '../styles/AppStyles.module.css';

interface Member {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  inConnect?: boolean;
}

const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersSnapshot, connectSnapshot] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'connectProfiles')),
        ]);

        const membersMap = new Map<string, Member>();

        usersSnapshot.docs.forEach((userDoc) => {
          const data = userDoc.data() as Omit<Member, 'id'>;
          membersMap.set(userDoc.id, {
            id: userDoc.id,
            name: data.name,
            email: data.email,
            role: data.role,
            inConnect: false,
          });
        });

        connectSnapshot.docs.forEach((connectDoc) => {
          const data = connectDoc.data() as Omit<Member, 'id'>;
          const existing = membersMap.get(connectDoc.id);
          membersMap.set(connectDoc.id, {
            id: connectDoc.id,
            name: data.name || existing?.name,
            email: data.email || existing?.email,
            role: existing?.role,
            inConnect: true,
          });
        });

        setMembers(Array.from(membersMap.values()));
      } catch {
        setError('Unable to load members.');
      }
      setLoading(false);
    };
    fetchMembers();
  }, []);

  if (loading) return <div className={styles.statusPage}>Loading family members...</div>;
  if (error) return <div className={styles.statusPage}>{error}</div>;
  const connectMembersCount = members.filter((member) => member.inConnect).length;

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <p className={styles.sectionKicker}>Household</p>
        <h1 className={styles.sectionTitle}>Family Members ({members.length})</h1>
        <p className={styles.sectionSubtitle}>Everyone currently connected to this shared space.</p>
      </header>
      <div className={styles.statRow}>
        <span className={styles.statPill}>{members.length} active profiles</span>
        <span className={styles.statPill}>{connectMembersCount} in Connect</span>
      </div>

      <div className={styles.container}>
        {members.length > 0 ? (
          members.map((member) => (
            <div key={member.id} className={styles.card}>
              <p className={styles.memberName}>{member.name || member.email || 'Unnamed member'}</p>
              <p className={styles.memberEmail}>{member.email || 'Email unavailable'}</p>
              <p className={styles.memberRole}>{member.role === 'admin' ? 'Admin' : 'Member'}</p>
              <p className={styles.connectStatus}>{member.inConnect ? 'Entered Connect' : 'Not in Connect'}</p>
            </div>
          ))
        ) : (
          <div className={styles.emptyCard}>No members found.</div>
        )}
      </div>
    </section>
  );
};

export default MembersPage;
