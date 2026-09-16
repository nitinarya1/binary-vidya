import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICertificate extends Document {
  certificateId: string;
  certificateCode?: string;
  userId?: string;
  userEmail: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  courseSlug?: string;
  batchName: string;
  instructor: string;
  issuedAt: Date;
  grade: string;
  status: 'verified' | 'revoked';
  verificationUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    certificateCode: {
      type: String,
      default: function (this: any) {
        return this.certificateId;
      },
    },
    userId: { type: String, default: '' },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    courseId: {
      type: String,
      required: true,
      index: true,
    },
    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    courseSlug: { type: String, default: '' },
    batchName: { type: String, default: 'Cohort 2026 - Active' },
    instructor: { type: String, default: 'Binary Vidya Faculty Council' },
    issuedAt: { type: Date, default: Date.now },
    grade: { type: String, default: 'Verified Honors' },
    status: {
      type: String,
      enum: ['verified', 'revoked'],
      default: 'verified',
    },
    verificationUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound index to ensure 1 certificate per user per course
certificateSchema.index({ userEmail: 1, courseId: 1 }, { unique: true });

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', certificateSchema);
