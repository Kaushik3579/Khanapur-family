import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import styles from '../styles/AppStyles.module.css';

interface Member {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'users'));
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
      setLoading(false);
    };
    fetchMembers();
  }, []);

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><span>Loading...</span></div>;

  return (
    <div className={styles.container}>
      <h2 style={{width:'100%',textAlign:'center',fontWeight:700,fontSize:'1.3rem',marginBottom:16}}>Family Members ({members.length})</h2>
      {members.map(member => (
        <div key={member.id} className={styles.card}>
          <div style={{fontWeight:600,fontSize:'1.1rem'}}>{member.name || member.email}</div>
          <div style={{color:'#888',fontSize:'0.95rem'}}>{member.email}</div>
          <div style={{marginTop:8,fontSize:'0.9rem',color:'#4f46e5'}}>{member.role === 'admin' ? 'Admin' : 'Member'}</div>
        </div>
      ))}
    </div>
  );
};

export default MembersPage;
