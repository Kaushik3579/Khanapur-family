import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query as firestoreQuery,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { enableConnectNotifications } from '../services/notificationService';
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

type CallStatus = 'ringing' | 'accepted' | 'ended' | 'rejected';
type CallType = 'video' | 'voice';
type GroupCallStatus = 'active' | 'ended';

interface ConnectCall {
  id: string;
  callerId: string;
  callerName: string;
  calleeId: string;
  calleeName: string;
  callType?: CallType;
  status: CallStatus;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt?: Timestamp;
}

interface GroupCallSession {
  id: string;
  hostId: string;
  hostName: string;
  roomName: string;
  roomUrl: string;
  callType: CallType;
  status: GroupCallStatus;
  invitedUserIds?: string[];
  createdAt?: Timestamp;
}

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
};

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
  const [incomingCall, setIncomingCall] = useState<ConnectCall | null>(null);
  const [currentCall, setCurrentCall] = useState<ConnectCall | null>(null);
  const [activeGroupCall, setActiveGroupCall] = useState<GroupCallSession | null>(null);
  const [callBusy, setCallBusy] = useState(false);
  const [groupBusy, setGroupBusy] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callDocUnsubRef = useRef<(() => void) | null>(null);
  const candidateUnsubRef = useRef<(() => void) | null>(null);

  const stopLocalMedia = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  };

  const cleanupCallConnections = () => {
    if (callDocUnsubRef.current) callDocUnsubRef.current();
    if (candidateUnsubRef.current) candidateUnsubRef.current();
    callDocUnsubRef.current = null;
    candidateUnsubRef.current = null;
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    stopLocalMedia();
    setCurrentCall(null);
  };

  const ensureLocalStream = async (callType: CallType) => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video' ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 360 } } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  const subscribeRemoteCandidates = (callId: string, role: 'caller' | 'callee') => {
    const remoteCandidatesCollection = role === 'caller' ? 'calleeCandidates' : 'callerCandidates';
    candidateUnsubRef.current = onSnapshot(
      collection(db, 'connectCalls', callId, remoteCandidatesCollection),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== 'added') return;
          const candidateData = change.doc.data();
          if (!candidateData || !peerConnectionRef.current) return;
          peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidateData)).catch(() => {
            // no-op
          });
        });
      },
    );
  };

  const createPeerConnection = (callId: string, role: 'caller' | 'callee', localMedia: MediaStream) => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    const liveRemoteStream = new MediaStream();
    setRemoteStream(liveRemoteStream);

    localMedia.getTracks().forEach((track) => {
      pc.addTrack(track, localMedia);
    });

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => liveRemoteStream.addTrack(track));
    };

    const localCandidatesCollection = role === 'caller' ? 'callerCandidates' : 'calleeCandidates';
    pc.onicecandidate = async (event) => {
      if (!event.candidate) return;
      await addDoc(collection(db, 'connectCalls', callId, localCandidatesCollection), event.candidate.toJSON());
    };

    subscribeRemoteCandidates(callId, role);
    return pc;
  };

  const endCall = async (setEndedStatus: boolean) => {
    const callId = currentCall?.id;
    cleanupCallConnections();
    if (!callId || !setEndedStatus) return;
    try {
      await updateDoc(doc(db, 'connectCalls', callId), {
        status: 'ended',
        endedAt: serverTimestamp(),
      });
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    return () => {
      cleanupCallConnections();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const profileRef = doc(db, 'connectProfiles', user.uid);
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(profileRef, async (snapshot) => {
      const data = snapshot.data() as { name?: string } | undefined;
      const profileName = (data?.name || '').trim();

      if (profileName) {
        setMyName(profileName);
        setNameInput((current) => (current.trim() ? current : profileName));
        setNameLoading(false);
        return;
      }

      const userSnapshot = await getDoc(userRef);
      const userData = userSnapshot.data() as { name?: string; email?: string } | undefined;
      const userName = (userData?.name || '').trim();

      if (userName) {
        await setDoc(
          profileRef,
          {
            name: userName,
            email: user.email || userData?.email || '',
            userId: user.uid,
            enteredConnectAt: serverTimestamp(),
            lastActiveAt: serverTimestamp(),
          },
          { merge: true },
        );
        setMyName(userName);
        setNameInput((current) => (current.trim() ? current : userName));
      }

      setNameLoading(false);
    });

    return () => unsubscribe();
  }, [user?.email, user?.uid]);

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
    if (!user?.uid || !myName) return;
    enableConnectNotifications(user, (title, body) => {
      toast.info(`${title}${body ? `: ${body}` : ''}`);
    });
  }, [myName, user]);

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

  useEffect(() => {
    if (!user?.uid || !myName) return;
    const groupQuery = firestoreQuery(
      collection(db, 'connectGroupCalls'),
      where('status', '==', 'active'),
      limit(1),
    );
    const unsubscribe = onSnapshot(groupQuery, (snapshot) => {
      if (snapshot.empty) {
        setActiveGroupCall(null);
        return;
      }
      const docSnap = snapshot.docs[0];
      const data = docSnap.data() as Omit<GroupCallSession, 'id'>;
      setActiveGroupCall({ id: docSnap.id, ...data });
    });

    return () => unsubscribe();
  }, [myName, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !myName) return;

    const incomingQuery = firestoreQuery(
      collection(db, 'connectCalls'),
      where('calleeId', '==', user.uid),
      limit(10),
    );

    const unsubscribe = onSnapshot(incomingQuery, (snapshot) => {
      const calls = snapshot.docs
        .map((callDoc) => ({ id: callDoc.id, ...(callDoc.data() as Omit<ConnectCall, 'id'>) }))
        .filter((call) => call.status === 'ringing' || call.status === 'accepted')
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      const nextIncoming = calls[0] || null;
      if (currentCall?.id && nextIncoming?.id === currentCall.id) return;
      setIncomingCall(nextIncoming);
    });

    return () => unsubscribe();
  }, [currentCall?.id, myName, user?.uid]);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const startCall = async (member: Member, callType: CallType) => {
    if (!user?.uid || !myName || currentCall || callBusy) return;
    setCallBusy(true);
    try {
      const stream = await ensureLocalStream(callType);
      const callDocRef = doc(collection(db, 'connectCalls'));
      const baseCall: Omit<ConnectCall, 'id'> = {
        callerId: user.uid,
        callerName: myName,
        calleeId: member.id,
        calleeName: member.name || member.email || 'Member',
        callType,
        status: 'ringing',
        createdAt: Timestamp.now(),
      };
      await setDoc(callDocRef, { ...baseCall, createdAt: serverTimestamp() });

      const pc = createPeerConnection(callDocRef.id, 'caller', stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await updateDoc(callDocRef, { offer });

      callDocUnsubRef.current = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data() as Omit<ConnectCall, 'id'> | undefined;
        if (!data || !peerConnectionRef.current) return;
        setCurrentCall({ id: snapshot.id, ...data });

        if (data.answer && !peerConnectionRef.current.currentRemoteDescription) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        }

        if (data.status === 'ended' || data.status === 'rejected') {
          toast.info('Call ended');
          cleanupCallConnections();
        }
      });

      setCurrentCall({ id: callDocRef.id, ...baseCall, offer });
    } catch {
      toast.error('Unable to start call');
      cleanupCallConnections();
    } finally {
      setCallBusy(false);
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall || !user?.uid || !myName || callBusy) return;
    setCallBusy(true);
    try {
      const stream = await ensureLocalStream(incomingCall.callType || 'video');
      const callDocRef = doc(db, 'connectCalls', incomingCall.id);
      const pc = createPeerConnection(incomingCall.id, 'callee', stream);

      if (incomingCall.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await updateDoc(callDocRef, {
        status: 'accepted',
        answer,
      });

      callDocUnsubRef.current = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data() as Omit<ConnectCall, 'id'> | undefined;
        if (!data) return;
        setCurrentCall({ id: snapshot.id, ...data });
        if (data.status === 'ended' || data.status === 'rejected') {
          toast.info('Call ended');
          cleanupCallConnections();
        }
      });

      setCurrentCall({ ...incomingCall, status: 'accepted', answer });
      setIncomingCall(null);
    } catch {
      toast.error('Unable to accept call');
      cleanupCallConnections();
    } finally {
      setCallBusy(false);
    }
  };

  const rejectIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'connectCalls', incomingCall.id), {
        status: 'rejected',
        endedAt: serverTimestamp(),
      });
    } catch {
      // no-op
    }
    setIncomingCall(null);
  };

  const startGroupCall = async (callType: CallType) => {
    if (!user?.uid || !myName || groupBusy || activeGroupCall) return;
    setGroupBusy(true);
    try {
      const roomName = `khanapur-${callType}-${Date.now()}`;
      const roomUrl = `https://meet.jit.si/${roomName}`;
      const invitedUserIds = Array.from(new Set([user.uid, ...members.map((member) => member.id)]));
      await addDoc(collection(db, 'connectGroupCalls'), {
        hostId: user.uid,
        hostName: myName,
        roomName,
        roomUrl,
        callType,
        status: 'active',
        invitedUserIds,
        createdAt: serverTimestamp(),
      });
      window.open(roomUrl, '_blank', 'noopener,noreferrer');
      toast.success(`Group ${callType} call started`);
    } catch {
      toast.error('Unable to start group call');
    } finally {
      setGroupBusy(false);
    }
  };

  const joinGroupCall = () => {
    if (!activeGroupCall?.roomUrl) return;
    window.open(activeGroupCall.roomUrl, '_blank', 'noopener,noreferrer');
  };

  const endGroupCall = async () => {
    if (!activeGroupCall || !user?.uid) return;
    if (activeGroupCall.hostId !== user.uid) {
      toast.error('Only the host can end this group call');
      return;
    }
    try {
      await updateDoc(doc(db, 'connectGroupCalls', activeGroupCall.id), {
        status: 'ended',
        endedAt: serverTimestamp(),
      });
      toast.info('Group call ended');
    } catch {
      toast.error('Unable to end group call');
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
        <p className={styles.sectionSubtitle}>Shared chat floor visible to everyone like a group conversation.</p>
      </header>

      <div className={styles.connectCard}>
        <div className={styles.statRow}>
          <span className={styles.statPill}>Signed in as {myName}</span>
          <span className={styles.statPill}>{messages.length} messages</span>
        </div>

        <div className={styles.callButtons}>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => startGroupCall('video')}
            disabled={groupBusy || !!activeGroupCall}
          >
            Group Video Call
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => startGroupCall('voice')}
            disabled={groupBusy || !!activeGroupCall}
          >
            Group Voice Call
          </button>
        </div>

        {activeGroupCall && (
          <div className={styles.callBanner}>
            <p className={styles.sectionSubtitle}>
              {activeGroupCall.hostName} started a group {activeGroupCall.callType} call.
            </p>
            <div className={styles.callButtons}>
              <button type="button" className={styles.submitBtn} onClick={joinGroupCall}>
                Join Group Call
              </button>
              {activeGroupCall.hostId === user?.uid && (
                <button type="button" className={styles.deleteBtn} onClick={endGroupCall}>
                  End Group Call
                </button>
              )}
            </div>
          </div>
        )}

        {incomingCall && !currentCall && (
          <div className={styles.callBanner}>
            <p className={styles.sectionSubtitle}>
              {incomingCall.callerName} is {incomingCall.callType === 'voice' ? 'voice' : 'video'} calling you...
            </p>
            <div className={styles.callButtons}>
              <button type="button" className={styles.submitBtn} onClick={acceptIncomingCall} disabled={callBusy}>
                Accept
              </button>
              <button type="button" className={styles.deleteBtn} onClick={rejectIncomingCall} disabled={callBusy}>
                Decline
              </button>
            </div>
          </div>
        )}

        {currentCall && (
          <div className={styles.callPanel}>
            <p className={styles.sectionSubtitle}>
              On {currentCall.callType === 'voice' ? 'voice' : 'video'} call with{' '}
              {currentCall.callerId === user?.uid ? currentCall.calleeName : currentCall.callerName}
            </p>
            {currentCall.callType === 'voice' ? (
              <div className={styles.voiceOnlyPanel}>Voice call in progress...</div>
            ) : (
              <div className={styles.videoGrid}>
                <video ref={localVideoRef} autoPlay muted playsInline className={styles.videoTile} />
                <video ref={remoteVideoRef} autoPlay playsInline className={styles.videoTile} />
              </div>
            )}
            <audio ref={remoteAudioRef} autoPlay playsInline />
            <button type="button" className={styles.deleteBtn} onClick={() => endCall(true)}>
              End Call
            </button>
          </div>
        )}

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
          <div ref={chatBottomRef} />
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
                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={() => startCall(member, 'video')}
                    disabled={callBusy || !!currentCall}
                  >
                    Video Call
                  </button>
                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={() => startCall(member, 'voice')}
                    disabled={callBusy || !!currentCall}
                  >
                    Voice Call
                  </button>
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
