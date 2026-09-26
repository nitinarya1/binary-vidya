import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveSession extends Document {
  title: string;
  courseTitle: string;
  courseId: string;
  instructorName: string;
  instructorEmail: string;
  meetingId: string;
  description?: string;
  scheduledAt: Date;
  status: 'scheduled' | 'live' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
  attendeesCount: number;
  attendees: Array<{
    userEmail: string;
    userName: string;
    joinedAt: Date;
    watchDurationMinutes?: number;
  }>;
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LiveSessionSchema = new Schema<ILiveSession>(
  {
    title: { type: String, required: true },
    courseTitle: { type: String, required: true },
    courseId: { type: String, required: true },
    instructorName: { type: String, default: 'Binary Vidya Lead Faculty' },
    instructorEmail: { type: String, required: true },
    meetingId: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    scheduledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
      index: true,
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    attendeesCount: { type: Number, default: 0 },
    attendees: [
      {
        userEmail: { type: String, required: true },
        userName: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
        watchDurationMinutes: { type: Number, default: 0 },
      },
    ],
    recordingUrl: { type: String },
  },
  { timestamps: true }
);

export const LiveSession = mongoose.model<ILiveSession>('LiveSession', LiveSessionSchema);
