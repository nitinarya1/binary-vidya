import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { LiveSession } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

// GET /api/live/sessions
export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const courseId = url.searchParams.get('courseId');

    const query: any = {};
    if (status) query.status = status;
    if (courseId) query.courseId = courseId;

    let sessions = await LiveSession.find(query).sort({ scheduledAt: -1 }).lean();

    // If no live sessions exist in DB yet, create a default active weekend live session so students & instructors can immediately test the classroom!
    if (!sessions || sessions.length === 0) {
      const defaultMeetingId = 'frontend-developer-weekend-live';
      const existing = await LiveSession.findOne({ meetingId: defaultMeetingId });
      if (!existing) {
        const created = await LiveSession.create({
          title: 'Frontend Web Engineering & React 19 Architecture Live Session',
          courseTitle: 'Frontend Developer Training & Internship',
          courseId: 'frontend-developer-training-internship',
          instructorName: 'Nitin Arya (Technical Lead)',
          instructorEmail: 'nitin@binaryvidya.com',
          meetingId: defaultMeetingId,
          description: 'Live interactive weekend cohort covering full-stack component systems, state management, and real-time WebRTC architecture.',
          scheduledAt: new Date(),
          status: 'live',
          startedAt: new Date(),
          attendeesCount: 1,
        });
        sessions = [created.toObject() as any];
      } else {
        sessions = [existing.toObject() as any];
      }
    }

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (err: any) {
    console.error('[GET /api/live/sessions Error]:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch live sessions' }, { status: 500 });
  }
}

// POST /api/live/sessions
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, courseTitle, courseId, instructorName, instructorEmail, description, scheduledAt } = body;

    if (!title || !courseTitle || !courseId || !instructorEmail) {
      return NextResponse.json({ success: false, message: 'Missing required session parameters' }, { status: 400 });
    }

    const meetingId = `bv-live-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newSession = await LiveSession.create({
      title,
      courseTitle,
      courseId,
      instructorName: instructorName || 'Binary Vidya Faculty',
      instructorEmail,
      meetingId,
      description: description || 'Weekend live batch masterclass with Q&A.',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      status: 'live',
      startedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Live session created successfully',
      session: newSession,
    });
  } catch (err: any) {
    console.error('[POST /api/live/sessions Error]:', err);
    return NextResponse.json({ success: false, message: 'Failed to create session' }, { status: 500 });
  }
}
