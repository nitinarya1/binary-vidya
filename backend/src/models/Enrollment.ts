import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IEnrollment extends Document {
  userId?: string;
  userEmail: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  type: 'course' | 'internship';
  batchName: string;
  enrolledAt: Date;
  orderId?: string;
  paymentId?: string;
  amountPaid: number;
  progressPercentage: number;
  completedLessons: string[];
  status: 'active' | 'completed' | 'paused';
  certificateId?: string;
  certificateIssuedAt?: Date;
  certificateRecipientName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: String, default: '' },
    userEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    userName: { type: String, required: true, trim: true },
    courseId: { type: String, required: true, index: true },
    courseTitle: { type: String, required: true },
    type: { type: String, enum: ['course', 'internship'], default: 'course' },
    batchName: { type: String, default: 'Cohort 2026 - Active' },
    enrolledAt: { type: Date, default: Date.now },
    orderId: { type: String, default: '' },
    paymentId: { type: String, default: '' },
    amountPaid: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0 },
    completedLessons: [{ type: String }],
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
    certificateId: { type: String, default: '' },
    certificateIssuedAt: { type: Date },
    certificateRecipientName: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate enrollments for same user & course
enrollmentSchema.index({ userEmail: 1, courseId: 1 }, { unique: true });

export const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
