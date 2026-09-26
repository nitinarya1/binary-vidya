import { Request, Response } from 'express';
import { LiveSession } from '../models/LiveSession';
import { LiveChatMessage } from '../models/LiveChatMessage';

// 1. Get Live / Upcoming Sessions
export const getLiveSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, courseId } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (courseId) query.courseId = courseId;

    const sessions = await LiveSession.find(query).sort({ scheduledAt: -1 }).lean();

    res.json({
      success: true,
      sessions,
    });
  } catch (err: any) {
    console.error('[Get Live Sessions Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch live sessions.' });
  }
};

// 2. Create Live Session (Admin / Instructor)
export const createLiveSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      courseTitle,
      courseId,
      targetType = 'course',
      thumbnail = '',
      instructorName,
      instructorEmail,
      scheduledAt,
      description,
      status = 'scheduled',
    } = req.body;

    if (!title || !courseTitle || !courseId || !instructorEmail) {
      res.status(400).json({ success: false, message: 'Please provide all required session details.' });
      return;
    }

    const meetingId = `bv-live-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newSession = await LiveSession.create({
      title,
      courseTitle,
      courseId,
      targetType,
      thumbnail,
      instructorName: instructorName || 'Binary Vidya Lead Faculty',
      instructorEmail,
      meetingId,
      description: description || 'Weekend live batch session with production code walkthrough and Q&A.',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      status: status === 'live' ? 'live' : 'scheduled',
      startedAt: status === 'live' ? new Date() : undefined,
    });

    res.status(201).json({
      success: true,
      message: status === 'live' ? 'Live broadcast initialized!' : 'Live session scheduled successfully.',
      session: newSession,
    });
  } catch (err: any) {
    console.error('[Create Live Session Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to create live session.' });
  }
};

// 2b. Delete Live Session
export const deleteLiveSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await LiveSession.findOneAndDelete({
      $or: [{ meetingId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (err: any) {
    console.error('[Delete Live Session Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to delete live session.' });
  }
};

// 3. Get Session By Meeting ID / Session ID
export const getSessionDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await LiveSession.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { meetingId: id }],
    }).lean();

    if (!session) {
      res.status(404).json({ success: false, message: 'Live session not found.' });
      return;
    }

    const recentChat = await LiveChatMessage.find({ sessionId: session.meetingId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      session,
      chatHistory: recentChat,
    });
  } catch (err: any) {
    console.error('[Get Session Details Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch session details.' });
  }
};

// 4. End Live Session
export const endLiveSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await LiveSession.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { meetingId: id }] },
      {
        $set: {
          status: 'ended',
          endedAt: new Date(),
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Live session ended.',
      session: updated,
    });
  } catch (err: any) {
    console.error('[End Live Session Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to end live session.' });
  }
};
