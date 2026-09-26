'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import { isSuperAdminEmail } from '../../../lib/auth-helpers';
import styles from './live.module.css';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Hand,
  MessageSquare,
  Users,
  Send,
  Code2,
  Share2,
  LogOut,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Pin,
  Clock,
  Volume2,
  Maximize2,
  ChevronRight,
  Radio,
  FileCode,
} from 'lucide-react';

interface ChatMessage {
  _id?: string;
  senderEmail: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'instructor' | 'mentor' | 'student';
  text: string;
  codeSnippet?: {
    code: string;
    language: string;
  };
  type: 'chat' | 'question' | 'announcement';
  isPinned?: boolean;
  createdAt: string;
}

interface Attendee {
  userEmail: string;
  userName: string;
  userRole?: string;
  socketId?: string;
}

export default function LiveClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = (params?.sessionId as string) || 'frontend-developer-weekend-live';
  const { user, isAdmin } = useAuth();

  // Classroom Session Metadata
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'chat' | 'questions' | 'attendees'
  const [activeTab, setActiveTab] = useState<'chat' | 'questions' | 'attendees'>('chat');

  // Media & WebRTC States
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Real-Time Chat & Attendees
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendeeCount, setAttendeeCount] = useState<number>(1);
  const [inputMessage, setInputMessage] = useState('');
  const [showCodeSnippetInput, setShowCodeSnippetInput] = useState(false);
  const [codeSnippetContent, setCodeSnippetContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');

  // Attendance Watch Duration Tracker
  const [watchedMinutes, setWatchedMinutes] = useState(0);

  // Video Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // User Role Detection (Only instructor/admin can broadcast live)
  const isInstructor = Boolean(
    user && (
      isSuperAdminEmail(user.email) ||
      user.role === 'admin' ||
      user.isTeamMember ||
      (sessionData?.instructorEmail && user.email?.toLowerCase() === sessionData.instructorEmail?.toLowerCase())
    )
  );

  const currentUserRole: 'instructor' | 'mentor' | 'student' = isInstructor ? 'instructor' : 'student';
  const currentUserName = user?.name || (isInstructor ? 'Lead Faculty' : 'Student Learner');
  const currentUserEmail = user?.email || (isInstructor ? 'faculty@binaryvidya.com' : 'student@binaryvidya.com');

  // 1. Fetch Session Metadata & Initial Chat History via Next.js API
  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/live/sessions/${sessionId}`);
        const data = await res.json();
        if (data.success && data.session) {
          setSessionData(data.session);
          if (Array.isArray(data.chatHistory) && data.chatHistory.length > 0) {
            setMessages(data.chatHistory);
          }
        }
      } catch (err) {
        console.error('[Live Session Fetch Error]:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [sessionId]);

  // 2. Initialize Real-Time Socket Connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    let socket: Socket | null = null;

    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 4,
        timeout: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        // Join the classroom room
        socket?.emit('join_live_room', {
          sessionId,
          userEmail: currentUserEmail,
          userName: currentUserName,
          userRole: currentUserRole,
        });
      });

      socket.on('attendee_joined', (payload: { user: Attendee; attendeesCount: number; attendees: Attendee[] }) => {
        setAttendeeCount(payload.attendeesCount || 1);
        if (Array.isArray(payload.attendees)) {
          setAttendees(payload.attendees);
        }
      });

      socket.on('attendee_left', (payload: { attendeesCount: number; attendees: Attendee[] }) => {
        setAttendeeCount(payload.attendeesCount || 1);
        if (Array.isArray(payload.attendees)) {
          setAttendees(payload.attendees);
        }
      });

      socket.on('chat_history', (history: ChatMessage[]) => {
        if (Array.isArray(history) && history.length > 0) {
          setMessages(history);
        }
      });

      socket.on('new_chat_message', (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on('session_status_changed', (payload: { sessionId: string; status: 'scheduled' | 'live' | 'ended' }) => {
        setSessionData((prev: any) => (prev ? { ...prev, status: payload.status } : prev));
      });

      socket.on('student_raised_hand', (payload: { userName: string }) => {
        // Show in chat as system notification
        setMessages((prev) => [
          ...prev,
          {
            senderEmail: 'system@binaryvidya.com',
            senderName: 'Classroom System',
            senderRole: 'mentor',
            text: `✋ ${payload.userName} raised their hand to ask a question!`,
            type: 'announcement',
            createdAt: new Date().toISOString(),
          },
        ]);
      });
    } catch (err) {
      console.warn('[Socket Connection]: Real-time socket server offline. Operating in resilient standalone mode.');
    }

    return () => {
      socket?.disconnect();
    };
  }, [sessionId, currentUserEmail, currentUserName, currentUserRole]);

  // 3. Scroll to latest chat message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Attendance Watch Time Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setWatchedMinutes((prev) => {
        const next = prev + 1;
        // Periodically log watch progress to API
        if (next % 5 === 0 && currentUserEmail) {
          fetch(`/api/live/sessions/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'log_attendance',
              attendanceData: {
                userEmail: currentUserEmail,
                userName: currentUserName,
                watchDurationMinutes: next,
              },
            }),
          }).catch(() => {});
        }
        return next;
      });
    }, 60000); // every 1 min

    return () => clearInterval(timer);
  }, [sessionId, currentUserEmail, currentUserName]);

  // 5. Broadcast Control Actions (Instructor Only)
  const handleStartBroadcast = async () => {
    if (!isInstructor) return;
    try {
      const res = await fetch(`/api/live/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_session' }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionData((prev: any) => ({ ...prev, status: 'live' }));
        socketRef.current?.emit('session_started', { sessionId });
        await toggleCamera();
      }
    } catch (err) {
      console.error('Failed to start broadcast:', err);
    }
  };

  const handleEndBroadcast = async () => {
    if (!isInstructor || !confirm('Are you sure you want to end this live broadcast for all attendees?')) return;
    try {
      await fetch(`/api/live/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end_session' }),
      });
      setSessionData((prev: any) => ({ ...prev, status: 'ended' }));
      socketRef.current?.emit('session_ended', { sessionId });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setIsBroadcasting(false);
      setIsCameraOn(false);
      setIsScreenSharing(false);
    } catch (err) {
      console.error('Failed to end broadcast:', err);
    }
  };

  // 6. Camera & Microphone Toggle Handlers (Instructor broadcasts, Student listens)
  const toggleCamera = async () => {
    if (!isInstructor) {
      alert('Only the designated instructor can broadcast video.');
      return;
    }

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        return;
      }
    }

    // Acquire camera stream if not active
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
      setIsBroadcasting(true);
    } catch (err) {
      console.warn('Camera access denied or device not found.');
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        return;
      }
    }
    setIsMicOn(!isMicOn);
  };

  const toggleScreenShare = async () => {
    if (!isInstructor) {
      alert('Only the designated instructor can share screen.');
      return;
    }

    if (isScreenSharing) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      localStreamRef.current = screenStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);
      setIsBroadcasting(true);

      screenStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
      };
    } catch (err) {
      console.warn('Screen sharing cancelled or not supported.');
    }
  };

  const toggleRaiseHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);

    if (socketRef.current?.connected) {
      if (nextState) {
        socketRef.current.emit('raise_hand', {
          sessionId,
          userName: currentUserName,
          userEmail: currentUserEmail,
        });
      } else {
        socketRef.current.emit('lower_hand', {
          sessionId,
          userName: currentUserName,
        });
      }
    }
  };

  // 6. Send Chat Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() && !codeSnippetContent.trim()) return;

    const payload: ChatMessage = {
      senderEmail: currentUserEmail,
      senderName: currentUserName,
      senderRole: currentUserRole,
      text: inputMessage.trim() || 'Shared a code snippet:',
      codeSnippet: codeSnippetContent.trim()
        ? { code: codeSnippetContent.trim(), language: codeLanguage }
        : undefined,
      type: activeTab === 'questions' ? 'question' : 'chat',
      createdAt: new Date().toISOString(),
    };

    // If socket is connected, emit real-time
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_chat_message', {
        ...payload,
        sessionId,
      });
    } else {
      // Local optimistic update + REST fallback
      setMessages((prev) => [...prev, payload]);
      fetch(`/api/live/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'post_message', messageData: payload }),
      }).catch(() => {});
    }

    setInputMessage('');
    setCodeSnippetContent('');
    setShowCodeSnippetInput(false);
  };

  const handleQuickEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + ' ' + emoji);
  };

  return (
    <div className={styles.classroomContainer}>
      {/* TOP BAR NAVIGATION */}
      <header className={styles.topNav}>
        <div className={styles.navLeft}>
          <Link href="/lms" className={styles.brandLink} title="Return to LMS">
            <img src="/images/binary-vidya-icon.png" alt="Binary Vidya" className={styles.brandIcon} />
            <img src="/images/binary-vidya-wordmark.png" alt="Binary Vidya" className={styles.brandWordmark} />
          </Link>

          <div className={styles.divider} />

          <div className={styles.sessionMeta}>
            <div className={styles.liveBadge}>
              <span className={styles.pulseDot} />
              <span>LIVE CLASSROOM</span>
            </div>
            <h1 className={styles.sessionTitle} title={sessionData?.title || 'Weekend Live Cohort'}>
              {sessionData?.title || 'Frontend Web Engineering & React 19 Architecture Live Session'}
            </h1>
          </div>
        </div>

        <div className={styles.navRight}>
          <div className={styles.attendeeCountBadge}>
            <Users size={14} color="#2563eb" />
            <span>{Math.max(attendeeCount, attendees.length || 1)} Engineers Online</span>
          </div>

          <div className={styles.attendanceBadge}>
            <CheckCircle2 size={14} color="#10b981" />
            <span>{watchedMinutes}m Verified Attendance</span>
          </div>

          <Link href="/my-learning" className={styles.leaveBtn}>
            <LogOut size={14} /> Leave Session
          </Link>
        </div>
      </header>

      {/* MAIN WORKSPACE: 70% VIDEO STAGE / 30% REAL-TIME CHAT */}
      <div className={styles.classroomWorkspace}>
        {/* LEFT VIDEO STAGE (70%) */}
        <section className={styles.videoStage}>
          {sessionData?.status === 'scheduled' ? (
            /* SCHEDULED STATE: WAITING ROOM FOR STUDENTS / START CONTROLS FOR INSTRUCTOR */
            <div className={styles.waitingRoomContainer}>
              <div className={styles.waitingCard}>
                <div className={styles.waitingThumbnailBox}>
                  {sessionData.thumbnail ? (
                    <img src={sessionData.thumbnail} alt={sessionData.title} className={styles.waitingThumbImg} />
                  ) : (
                    <div className={styles.waitingThumbPlaceholder}>
                      <Radio size={40} />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Binary Vidya Live LMS</span>
                    </div>
                  )}
                </div>

                <div className={styles.waitingStatusPillScheduled}>
                  <Clock size={12} />
                  <span>Scheduled Live Cohort</span>
                </div>

                <h2 className={styles.waitingTitle}>{sessionData.title}</h2>

                <span className={styles.waitingCourseTag}>
                  {sessionData.courseTitle || 'Frontend Developer Training & Internship'}
                </span>

                <div className={styles.waitingTimeRow}>
                  <Clock size={14} color="#2563eb" />
                  <span>
                    {sessionData.scheduledAt
                      ? new Date(sessionData.scheduledAt).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Scheduled Weekend Class'}
                  </span>
                  <span>&bull; Faculty: {sessionData.instructorName}</span>
                </div>

                {isInstructor ? (
                  <div style={{ width: '100%', marginTop: '8px' }}>
                    <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                      You are the host instructor for this class. Ready to begin? Click below to go live.
                    </p>
                    <button
                      onClick={handleStartBroadcast}
                      className={styles.instructorStartBroadcastBtn}
                      type="button"
                    >
                      <Radio size={18} />
                      <span>Start Live Broadcast Now</span>
                    </button>
                  </div>
                ) : (
                  <div className={styles.waitingMessageNotice}>
                    Waiting for the faculty instructor to start streaming. The live video stage will open automatically here as soon as the broadcast begins! Feel free to ask doubts in the live chat on the right.
                  </div>
                )}
              </div>
            </div>
          ) : sessionData?.status === 'ended' ? (
            /* CONCLUDED SESSION STATE */
            <div className={styles.waitingRoomContainer}>
              <div className={styles.waitingCard}>
                <CheckCircle2 size={44} color="#10b981" />
                <h2 className={styles.waitingTitle}>Live Session Concluded</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.5 }}>
                  This interactive cohort has ended. Your total watch duration of <strong>{watchedMinutes} minutes</strong> has been recorded towards your completion certification.
                </p>
                <Link href="/lms" className={styles.leaveBtn} style={{ color: '#ffffff', background: '#2563eb', borderColor: '#3b82f6', marginTop: '10px' }}>
                  Return to LMS
                </Link>
              </div>
            </div>
          ) : (
            /* ACTIVE LIVE STREAMING STAGE */
            <div className={styles.videoContainer}>
              {isBroadcasting ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.liveVideoPlayer}
                />
              ) : (
                /* Simulated Stage / Interactive WebRTC Ready Canvas */
                <div className={styles.simulationCanvas}>
                  <div className={styles.screenMockup}>
                    <div className={styles.mockupHeader}>
                      <div className={styles.mockupDots}>
                        <span className={styles.dotRed} />
                        <span className={styles.dotYellow} />
                        <span className={styles.dotGreen} />
                      </div>
                      <span className={styles.mockupTitle}>
                        VS CODE &bull; live-cohort-demo.tsx &bull; Binary Vidya Studio
                      </span>
                      <Radio size={14} color="#10b981" />
                    </div>
                    <div className={styles.mockupBody}>
                      <div style={{ color: '#64748b' }}>// Binary Vidya Weekend Live Cohort Stream</div>
                      <div style={{ color: '#0f172a', marginTop: '6px' }}>
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>import</span> React, {'{'} useState, useEffect {'}'}{' '}
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>from</span> <span style={{ color: '#059669' }}>'react'</span>;
                      </div>
                      <div style={{ color: '#0f172a' }}>
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>import</span> {'{'} io {'}'}{' '}
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>from</span> <span style={{ color: '#059669' }}>'socket.io-client'</span>;
                      </div>
                      <br />
                      <div style={{ color: '#0f172a' }}>
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>export const</span>{' '}
                        <span style={{ color: '#7c3aed', fontWeight: 700 }}>RealtimeClassroom</span> = () =&gt; {'{'}
                      </div>
                      <div style={{ paddingLeft: '20px', color: '#475569' }}>
                        const [webrtcFeed, setFeed] = useState(true);
                        <br />
                        <span style={{ color: '#059669', fontStyle: 'italic' }}>// Live WebRTC Audio/Video &amp; Socket.io signaling active</span>
                        <br />
                        return &lt;<span style={{ color: '#7c3aed', fontWeight: 700 }}>ProductionLMSStage</span> feed={'webrtcFeed'} /&gt;;
                      </div>
                      <div style={{ color: '#0f172a' }}>{'}'};</div>
                    </div>
                  </div>

                  <div className={styles.streamInfoPill}>
                    <Sparkles size={16} color="#60a5fa" />
                    <span>
                      Faculty: <strong>{sessionData?.instructorName || 'Nitin Arya (Technical Lead)'}</strong> &bull; Weekend Batch Live
                    </span>
                  </div>
                </div>
              )}

              {/* Instructor Picture-in-Picture Webcam */}
              {isBroadcasting && (
                <div className={styles.instructorPiP}>
                  <video ref={localVideoRef} autoPlay playsInline muted className={styles.pipVideo} />
                  <span className={styles.pipLabel}>Faculty Camera</span>
                </div>
              )}
            </div>
          )}

          {/* FLOATING CLASSROOM CONTROLS */}
          <footer className={styles.controlsBar}>
            {isInstructor ? (
              /* INSTRUCTOR BROADCASTER CONTROLS */
              <>
                <button
                  onClick={toggleMic}
                  className={`${styles.controlBtn} ${!isMicOn ? styles.controlBtnDanger : ''}`}
                  title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  type="button"
                >
                  {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>

                <button
                  onClick={toggleCamera}
                  className={`${styles.controlBtn} ${!isCameraOn ? styles.controlBtnDanger : ''}`}
                  title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                  type="button"
                >
                  {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`${styles.controlBtn} ${isScreenSharing ? styles.controlBtnActive : ''}`}
                  title="Share Screen (VS Code / Slides)"
                  type="button"
                >
                  <ScreenShare size={18} />
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Classroom meeting link copied to clipboard!');
                  }}
                  className={styles.controlBtn}
                  title="Copy Class Invite Link"
                  type="button"
                >
                  <Share2 size={18} />
                </button>

                <button
                  onClick={handleEndBroadcast}
                  className={styles.leaveBtn}
                  title="End live broadcast for all attendees"
                  type="button"
                >
                  <LogOut size={16} />
                  <span>End Live</span>
                </button>
              </>
            ) : (
              /* STUDENT ATTENDEE CONTROLS (Only Instructor Can Stream) */
              <>
                <button
                  onClick={toggleMic}
                  className={`${styles.controlBtn} ${!isMicOn ? styles.controlBtnDanger : ''}`}
                  title={isMicOn ? 'Mute Classroom Audio' : 'Unmute Classroom Audio'}
                  type="button"
                >
                  {isMicOn ? <Volume2 size={18} /> : <MicOff size={18} />}
                </button>

                <button
                  onClick={toggleRaiseHand}
                  className={`${styles.raiseHandBtn} ${isHandRaised ? styles.raiseHandBtnRaised : ''}`}
                  type="button"
                >
                  <Hand size={18} />
                  <span>{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Classroom meeting link copied to clipboard!');
                  }}
                  className={styles.controlBtn}
                  title="Copy Class Link"
                  type="button"
                >
                  <Share2 size={18} />
                </button>

                <button
                  onClick={() => router.push('/my-learning')}
                  className={styles.leaveBtn}
                  title="Leave live class"
                  type="button"
                >
                  <LogOut size={16} />
                  <span>Leave Class</span>
                </button>

                <div className={styles.studentAttendeeNotice}>
                  <CheckCircle2 size={13} color="#10b981" />
                  <span>Verified Attendance: {watchedMinutes}m</span>
                </div>
              </>
            )}
          </footer>
        </section>

        {/* RIGHT CHAT & DOUBTS PANEL (30%) */}
        <aside className={styles.chatPanel}>
          {/* Tabs Navigation */}
          <div className={styles.chatTabsHeader}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`${styles.chatTabBtn} ${activeTab === 'chat' ? styles.chatTabBtnActive : ''}`}
              type="button"
            >
              <MessageSquare size={14} /> Live Chat
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`${styles.chatTabBtn} ${activeTab === 'questions' ? styles.chatTabBtnActive : ''}`}
              type="button"
            >
              <HelpCircle size={14} /> Doubts &amp; Q&amp;A
            </button>

            <button
              onClick={() => setActiveTab('attendees')}
              className={`${styles.chatTabBtn} ${activeTab === 'attendees' ? styles.chatTabBtnActive : ''}`}
              type="button"
            >
              <Users size={14} /> Attendees ({Math.max(attendeeCount, attendees.length || 1)})
            </button>
          </div>

          {/* Pinned Announcement */}
          <div className={styles.pinnedStrip}>
            <Pin size={14} className={styles.pinnedIcon} />
            <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong>Pinned:</strong> Weekend cohort repository &bull; github.com/binary-vidya/production-lms
            </div>
          </div>

          {/* Messages Feed */}
          {activeTab === 'attendees' ? (
            <div className={styles.messagesFeed}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>
                Active in Classroom
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(37,99,235,0.1)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)' }}>
                <div className={`${styles.avatar} ${styles.avatarInstructor}`}>F</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                    {sessionData?.instructorName || 'Nitin Arya (Technical Lead)'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#60a5fa' }}>Session Host &bull; Instructor</div>
                </div>
              </div>

              {attendees.map((att, idx) => (
                <div key={att.socketId || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                  <div className={styles.avatar}>{att.userName?.charAt(0).toUpperCase() || 'S'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{att.userName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{att.userEmail}</div>
                  </div>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.messagesFeed}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '40px' }}>
                  No messages yet. Say hi to your peers and instructor!
                </div>
              ) : (
                messages
                  .filter((m) => (activeTab === 'questions' ? m.type === 'question' : true))
                  .map((msg, idx) => {
                    const isInst = msg.senderRole === 'instructor';
                    const isMentor = msg.senderRole === 'mentor';
                    const timeStr = msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div key={msg._id || idx} className={styles.messageRow}>
                        <div className={`${styles.avatar} ${isInst ? styles.avatarInstructor : ''}`}>
                          {msg.senderName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className={styles.messageContent}>
                          <div className={styles.messageHeader}>
                            <div className={styles.senderName}>
                              <span>{msg.senderName}</span>
                              <span
                                className={`${styles.roleBadge} ${
                                  isInst
                                    ? styles.roleInstructor
                                    : isMentor
                                    ? styles.roleMentor
                                    : styles.roleStudent
                                }`}
                              >
                                {msg.senderRole}
                              </span>
                            </div>
                            <span className={styles.messageTime}>{timeStr}</span>
                          </div>

                          <div className={styles.messageText}>{msg.text}</div>

                          {msg.codeSnippet && msg.codeSnippet.code && (
                            <pre className={styles.codeBox}>
                              <code>{msg.codeSnippet.code}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* CHAT INPUT AREA */}
          <div className={styles.chatInputArea}>
            <div className={styles.quickEmojiBar}>
              {['👍', '🔥', '❤️', '💡', '❓', '💻'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleQuickEmoji(emoji)}
                  className={styles.emojiQuickBtn}
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {showCodeSnippetInput && (
              <div style={{ marginBottom: '8px' }}>
                <textarea
                  value={codeSnippetContent}
                  onChange={(e) => setCodeSnippetContent(e.target.value)}
                  placeholder="Paste multi-line code snippet here..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#020617',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    padding: '8px',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>
            )}

            <form onSubmit={handleSendMessage} className={styles.inputRow}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  activeTab === 'questions'
                    ? 'Ask a doubt for instructor... (Enter to send)'
                    : 'Type a message... (Enter to send)'
                }
                className={styles.chatInput}
              />

              <button
                type="button"
                onClick={() => setShowCodeSnippetInput(!showCodeSnippetInput)}
                className={styles.codeSnippetToggleBtn}
                title="Attach Code Snippet"
              >
                <Code2 size={16} />
              </button>

              <button
                type="submit"
                disabled={!inputMessage.trim() && !codeSnippetContent.trim()}
                className={styles.sendBtn}
                title="Send Message"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
