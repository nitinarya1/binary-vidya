import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveChatMessage extends Document {
  sessionId: string;
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
  isPinned: boolean;
  createdAt: Date;
}

const LiveChatMessageSchema = new Schema<ILiveChatMessage>(
  {
    sessionId: { type: String, required: true, index: true },
    senderEmail: { type: String, required: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String },
    senderRole: {
      type: String,
      enum: ['instructor', 'mentor', 'student'],
      default: 'student',
    },
    text: { type: String, required: true },
    codeSnippet: {
      code: { type: String },
      language: { type: String, default: 'javascript' },
    },
    type: {
      type: String,
      enum: ['chat', 'question', 'announcement'],
      default: 'chat',
    },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const LiveChatMessage = mongoose.model<ILiveChatMessage>(
  'LiveChatMessage',
  LiveChatMessageSchema
);
