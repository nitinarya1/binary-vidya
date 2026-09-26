import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { LiveChatMessage } from '../models/LiveChatMessage';
import { LiveSession } from '../models/LiveSession';

interface SocketUser {
  socketId: string;
  userEmail: string;
  userName: string;
  userRole: 'instructor' | 'mentor' | 'student';
  sessionId: string;
}

export const initLiveSocket = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Track connected users per room: sessionId -> Map<socketId, SocketUser>
  const roomUsers = new Map<string, Map<string, SocketUser>>();

  io.on('connection', (socket: Socket) => {
    let currentSessionId: string | null = null;
    let currentUser: SocketUser | null = null;

    // 1. Join Classroom Room
    socket.on('join_live_room', async (payload: {
      sessionId: string;
      userEmail: string;
      userName: string;
      userRole?: 'instructor' | 'mentor' | 'student';
    }) => {
      const { sessionId, userEmail, userName, userRole = 'student' } = payload;
      currentSessionId = sessionId;

      socket.join(sessionId);

      currentUser = {
        socketId: socket.id,
        userEmail,
        userName,
        userRole,
        sessionId,
      };

      if (!roomUsers.has(sessionId)) {
        roomUsers.set(sessionId, new Map());
      }
      roomUsers.get(sessionId)!.set(socket.id, currentUser);

      const activeAttendees = Array.from(roomUsers.get(sessionId)!.values());

      // Notify the room of new attendee & updated count
      io.to(sessionId).emit('attendee_joined', {
        user: currentUser,
        attendeesCount: activeAttendees.length,
        attendees: activeAttendees,
      });

      // Send recent chat history (last 50 messages) to this user
      try {
        const recentMessages = await LiveChatMessage.find({ sessionId })
          .sort({ createdAt: 1 })
          .limit(50)
          .lean();
        socket.emit('chat_history', recentMessages);
      } catch (err) {
        console.error('[Socket Chat History Error]:', err);
      }

      // Update LiveSession attendee log in DB
      try {
        await LiveSession.findOneAndUpdate(
          { meetingId: sessionId },
          {
            $addToSet: {
              attendees: {
                userEmail,
                userName,
                joinedAt: new Date(),
              },
            },
            $set: { attendeesCount: activeAttendees.length },
          }
        );
      } catch (err) {
        // Silently continue
      }
    });

    // 2. Real-Time Chat Message
    socket.on('send_chat_message', async (data: {
      sessionId: string;
      senderEmail: string;
      senderName: string;
      senderAvatar?: string;
      senderRole: 'instructor' | 'mentor' | 'student';
      text: string;
      codeSnippet?: { code: string; language: string };
      type?: 'chat' | 'question' | 'announcement';
    }) => {
      if (!data.text?.trim() && !data.codeSnippet?.code?.trim()) return;

      try {
        const savedMessage = await LiveChatMessage.create({
          sessionId: data.sessionId,
          senderEmail: data.senderEmail,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          senderRole: data.senderRole || 'student',
          text: data.text.trim(),
          codeSnippet: data.codeSnippet,
          type: data.type || 'chat',
          isPinned: false,
        });

        // Broadcast to all users in the classroom instantly
        io.to(data.sessionId).emit('new_chat_message', savedMessage);
      } catch (err) {
        console.error('[Socket Send Message Error]:', err);
        socket.emit('chat_error', { message: 'Failed to broadcast message.' });
      }
    });

    // 3. Pin Message (Instructor/Mentor action)
    socket.on('pin_message', async (payload: { messageId: string; sessionId: string; isPinned: boolean }) => {
      try {
        await LiveChatMessage.findByIdAndUpdate(payload.messageId, { isPinned: payload.isPinned });
        io.to(payload.sessionId).emit('message_pin_updated', payload);
      } catch (err) {
        console.error('[Socket Pin Message Error]:', err);
      }
    });

    // 4. Raise / Lower Hand
    socket.on('raise_hand', (payload: { sessionId: string; userName: string; userEmail: string }) => {
      io.to(payload.sessionId).emit('student_raised_hand', {
        ...payload,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('lower_hand', (payload: { sessionId: string; userName: string }) => {
      io.to(payload.sessionId).emit('student_lowered_hand', {
        ...payload,
        socketId: socket.id,
      });
    });

    // 5. WebRTC Peer-to-Peer Signaling Relays
    socket.on('webrtc_signal', (payload: {
      targetSocketId?: string;
      sessionId: string;
      signal: any;
      from: { socketId: string; name: string; role: string };
    }) => {
      if (payload.targetSocketId) {
        // Send directly to the specified peer
        io.to(payload.targetSocketId).emit('webrtc_signal', {
          signal: payload.signal,
          from: payload.from,
        });
      } else {
        // Broadcast to everyone else in the room (e.g. instructor stream broadcast)
        socket.to(payload.sessionId).emit('webrtc_signal', {
          signal: payload.signal,
          from: payload.from,
        });
      }
    });

    // 6. Instructor Broadcast State (Started / Stopped)
    socket.on('broadcast_state_change', (payload: {
      sessionId: string;
      isStreaming: boolean;
      streamType: 'webcam' | 'screen' | 'both';
    }) => {
      socket.to(payload.sessionId).emit('broadcast_state_change', payload);
    });

    // 6b. Instructor Starts / Ends Live Session
    socket.on('session_started', (payload: { sessionId: string }) => {
      io.to(payload.sessionId).emit('session_status_changed', { sessionId: payload.sessionId, status: 'live' });
    });

    socket.on('session_ended', (payload: { sessionId: string }) => {
      io.to(payload.sessionId).emit('session_status_changed', { sessionId: payload.sessionId, status: 'ended' });
    });

    // 7. Disconnection
    socket.on('disconnect', () => {
      if (currentSessionId && roomUsers.has(currentSessionId)) {
        roomUsers.get(currentSessionId)!.delete(socket.id);
        const remaining = Array.from(roomUsers.get(currentSessionId)!.values());

        io.to(currentSessionId).emit('attendee_left', {
          socketId: socket.id,
          user: currentUser,
          attendeesCount: remaining.length,
          attendees: remaining,
        });

        if (remaining.length === 0) {
          roomUsers.delete(currentSessionId);
        }
      }
    });
  });

  return io;
};
