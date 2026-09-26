import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { LiveSession, LiveChatMessage } from '../../../../../lib/models';

export const dynamic = 'force-dynamic';

// GET /api/live/sessions/[id]
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    let session = await LiveSession.findOne({
      $or: [{ meetingId: id }, { courseId: id }],
    }).lean();

    if (!session && id.match(/^[0-9a-fA-F]{24}$/)) {
      session = await LiveSession.findById(id).lean();
    }

    if (!session) {
      // Auto-provision a live session for this ID if none exists yet
      session = (await LiveSession.create({
        title: 'Weekend Live Cohort Masterclass',
        courseTitle: 'Full Stack Web Engineering & Industrial Internship',
        courseId: id,
        instructorName: 'Nitin Arya (Technical Lead)',
        instructorEmail: 'nitin@binaryvidya.com',
        meetingId: id,
        description: 'Interactive weekend classroom with live coding, doubt clearing, and real-time chat.',
        status: 'live',
        startedAt: new Date(),
        scheduledAt: new Date(),
      })).toObject() as any;
    }

    const sessionObj = session as any;
    const meetingId = sessionObj?.meetingId || id;
    const chatHistory = await LiveChatMessage.find({ sessionId: meetingId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      session: sessionObj,
      chatHistory,
    });
  } catch (err: any) {
    console.error('[GET /api/live/sessions/[id] Error]:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch session' }, { status: 500 });
  }
}

// POST /api/live/sessions/[id]
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await req.json();
    const { action, messageData, attendanceData } = body;

    // Start session action (Instructor starts broadcasting)
    if (action === 'start_session') {
      const updated = await LiveSession.findOneAndUpdate(
        { $or: [{ meetingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: { status: 'live', startedAt: new Date() } },
        { new: true }
      );
      return NextResponse.json({ success: true, session: updated });
    }

    // End session action
    if (action === 'end_session') {
      const updated = await LiveSession.findOneAndUpdate(
        { $or: [{ meetingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        { $set: { status: 'ended', endedAt: new Date() } },
        { new: true }
      );
      return NextResponse.json({ success: true, session: updated });
    }

    // Attendance logging action
    if (action === 'log_attendance' && attendanceData) {
      const { userEmail, userName, watchDurationMinutes } = attendanceData;
      await LiveSession.findOneAndUpdate(
        { $or: [{ meetingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        {
          $addToSet: {
            attendees: {
              userEmail,
              userName,
              joinedAt: new Date(),
              watchDurationMinutes: watchDurationMinutes || 1,
            },
          },
          $inc: { attendeesCount: 1 },
        }
      );
      return NextResponse.json({ success: true, message: 'Attendance logged' });
    }

    // REST fallback chat message posting
    if (action === 'post_message' && messageData) {
      const savedMessage = await LiveChatMessage.create({
        sessionId: id,
        senderEmail: messageData.senderEmail,
        senderName: messageData.senderName,
        senderAvatar: messageData.senderAvatar,
        senderRole: messageData.senderRole || 'student',
        text: messageData.text,
        codeSnippet: messageData.codeSnippet,
        type: messageData.type || 'chat',
      });
      return NextResponse.json({ success: true, message: savedMessage });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[POST /api/live/sessions/[id] Error]:', err);
    return NextResponse.json({ success: false, message: 'Failed to process request' }, { status: 500 });
  }
}
