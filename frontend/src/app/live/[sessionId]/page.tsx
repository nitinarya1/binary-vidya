'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
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

  const currentUserRole = isAdmin ? 'instructor' : 'student';
  const currentUserName = user?.name || (isAdmin ? 'Faculty Member' : 'Student Learner');
  const currentUserEmail = user?.email || 'student@binaryvidya.com';

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

  // 5. Camera & Microphone Toggle Handlers (WebRTC Media)
  const toggleCamera = async () => {
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
          <Link href="/my-learning" className={styles.brandLink} title="Return to My Learning">
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
            <Users size={14} color="#38bdf8" />
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
                    <div style={{ color: '#e2e8f0', marginTop: '6px' }}>
                      <span style={{ color: '#f43f5e' }}>import</span> React, {'{'} useState, useEffect {'}'}{' '}
                      <span style={{ color: '#f43f5e' }}>from</span> <span style={{ color: '#38bdf8' }}>'react'</span>;
                    </div>
                    <div style={{ color: '#e2e8f0' }}>
                      <span style={{ color: '#f43f5e' }}>import</span> {'{'} io {'}'}{' '}
                      <span style={{ color: '#f43f5e' }}>from</span> <span style={{ color: '#38bdf8' }}>'socket.io-client'</span>;
                    </div>
                    <br />
                    <div style={{ color: '#e2e8f0' }}>
                      <span style={{ color: '#38bdf8' }}>export const</span>{' '}
                      <span style={{ color: '#fbbf24' }}>RealtimeClassroom</span> = () =&gt; {'{'}
                    </div>
                    <div style={{ paddingLeft: '20px', color: '#94a3b8' }}>
                      const [webrtcFeed, setFeed] = useState(true);
                      <br />
                      <span style={{ color: '#10b981' }}>// Live WebRTC Audio/Video &amp; Socket.io signaling active</span>
                      <br />
                      return &lt;<span style={{ color: '#38bdf8' }}>ProductionLMSStage</span> feed={'webrtcFeed'} /&gt;;
                    </div>
                    <div style={{ color: '#e2e8f0' }}>{'}'};</div>
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

          {/* FLOATING CLASSROOM CONTROLS */}
          <footer className={styles.controlsBar}>
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
              title="Copy Class Invite Link"
              type="button"
            >
              <Share2 size={18} />
            </button>
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
