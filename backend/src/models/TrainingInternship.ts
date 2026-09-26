import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrainingInternship extends Document {
  title: string;
  description?: string;
  subtitle?: string;
  thumbnail?: string;
  slug: string;
  domain: string;
  track?: string;
  type: 'internship' | 'training' | 'bootcamp';
  duration: string;
  mode: string;
  stipendOrFee: string;
  trainingPrice?: number;
  originalPrice?: number;
  internshipPrice?: number;
  schedule?: {
    badge?: string;
    days?: string;
    timings?: string;
    flexibility?: string;
  };
  durations?: {
    total?: string;
    trainingWeeks?: string;
    internshipWeeks?: string;
  };
  sections?: any[];
  credentials?: any[];
  eligibility: string;
  perks: string[];
  deadline?: string;
  status: 'open' | 'ongoing' | 'closed';
  applicantsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const trainingInternshipSchema = new Schema<ITrainingInternship>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    domain: { type: String, required: true, trim: true },
    track: { type: String, default: 'Frontend Developer' },
    type: {
      type: String,
      default: 'internship',
    },
    duration: { type: String, required: true, default: '2 Months Internship + Training' },
    mode: {
      type: String,
      default: 'Live Online • Weekend Classes',
    },
    stipendOrFee: { type: String, default: '₹2,400 Tuition • Free 2-Month Internship' },
    trainingPrice: { type: Number, default: 2400 },
    originalPrice: { type: Number, default: 7999 },
    internshipPrice: { type: Number, default: 0 },
    schedule: {
      badge: { type: String, default: 'Weekend Live Batches' },
      days: { type: String, default: 'Every Saturday & Sunday' },
      timings: { type: String, default: 'Live Interactive Sessions + 24/7 Session Recordings' },
      flexibility: { type: String, default: 'Specially crafted for College Students & Working Professionals' },
    },
    durations: {
      total: { type: String, default: '2 Months Internship + Training' },
      trainingWeeks: { type: String, default: '4 Weeks Intensive Live Training' },
      internshipWeeks: { type: String, default: '2 Months Hands-on Industrial Internship' },
    },
    sections: [{ type: Schema.Types.Mixed }],
    credentials: [{ type: Schema.Types.Mixed }],
    eligibility: { type: String, default: 'College Students, Freshers & Working Professionals' },
    perks: [{ type: String }],
    deadline: { type: String, default: 'Enrollment Open' },
    status: {
      type: String,
      enum: ['open', 'ongoing', 'closed'],
      default: 'open',
    },
    applicantsCount: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false }
);

export const TrainingInternship: Model<ITrainingInternship> =
  mongoose.models.TrainingInternship ||
  mongoose.model<ITrainingInternship>('TrainingInternship', trainingInternshipSchema);
