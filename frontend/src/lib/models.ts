import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say' | '';
  role: 'student' | 'instructor' | 'admin';
  authProvider: 'local' | 'google';
  googleId?: string;
  isVerified: boolean;
  isTeamMember?: boolean;
  department?: string;
  salesTeam?: string;
  permissions?: {
    manageCourses?: boolean;
    manageTraining?: boolean;
    manageCareers?: boolean;
    viewAnalytics?: boolean;
    manageCertificates?: boolean;
    manageTeam?: boolean;
  };
  teamStatus?: 'active' | 'suspended';
  mustChangePassword?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    dateOfBirth: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say', ''],
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      sparse: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isTeamMember: {
      type: Boolean,
      default: false,
    },
    department: {
      type: String,
      default: '',
    },
    permissions: {
      type: Schema.Types.Mixed,
      default: {},
    },
    teamStatus: {
      type: String,
      default: 'active',
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

if (mongoose.models.User) {
  mongoose.models.User.schema.add({
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    isTeamMember: { type: Boolean, default: false },
    department: { type: String, default: '' },
    permissions: { type: Schema.Types.Mixed, default: {} },
    teamStatus: { type: String, default: 'active' },
    mustChangePassword: { type: Boolean, default: false },
  });
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export interface IOtp extends Document {
  email?: string;
  phone?: string;
  otp: string;
  purpose: 'FORGOT_PASSWORD' | 'EMAIL_VERIFICATION' | 'SUPER_ADMIN_LOGIN' | 'ADMIN_LOGIN' | 'CRM_AGENT_LOGIN' | string;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      sparse: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      default: 'FORGOT_PASSWORD',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for the exact query pattern used in all OTP upserts: { email, purpose }
otpSchema.index({ email: 1, purpose: 1 });

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>('Otp', otpSchema);

// COURSE & CHAPTER VIDEO MODELS
export interface IVideoLesson {
  id?: string;
  title: string;
  videoUrl: string;
  videoName?: string;
  pptUrl?: string;
  pptName?: string;
  duration?: string;
  thumbnail?: string;
  description?: string;
}

export interface IChapter {
  id?: string;
  title: string;
  description?: string;
  lessons: IVideoLesson[];
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration?: string;
  price: number;
  originalPrice?: number;
  instructor?: string;
  thumbnail?: string;
  tags?: string[];
  chapters?: IChapter[];
  modules?: { title: string; lecturesCount: number; duration: string }[];
  status?: 'active' | 'draft' | 'archived';
  enrolledCount?: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, trim: true, default: 'General' },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'Beginner',
    },
    duration: { type: String, default: '10 Weeks' },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    instructor: { type: String, default: 'Binary Vidya Faculty' },
    thumbnail: { type: String, default: '' },
    tags: [{ type: String }],
    chapters: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        lessons: [
          {
            title: { type: String, required: true },
            videoUrl: { type: String, default: '' },
            videoName: { type: String, default: '' },
            pptUrl: { type: String, default: '' },
            pptName: { type: String, default: '' },
            duration: { type: String, default: '15 Mins' },
            thumbnail: { type: String, default: '' },
            description: { type: String, default: '' },
          },
        ],
      },
    ],
    modules: [
      {
        title: { type: String, required: true },
        lecturesCount: { type: Number, default: 5 },
        duration: { type: String, default: '2 Hours' },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    enrolledCount: { type: Number, default: 0 },
    rating: { type: Number, default: 4.8 },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Course) {
  if (!mongoose.models.Course.schema.paths['chapters']) {
    delete mongoose.models.Course;
  }
}

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);

// TRAINING & INTERNSHIP MODEL
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

if (mongoose.models && mongoose.models.TrainingInternship) {
  delete mongoose.models.TrainingInternship;
}

export const TrainingInternship: Model<ITrainingInternship> =
  mongoose.models.TrainingInternship ||
  mongoose.model<ITrainingInternship>('TrainingInternship', trainingInternshipSchema);

// CAREERS MODEL
export interface ICareer extends Document {
  title: string;
  slug: string;
  department: string;
  employmentType: 'full-time' | 'internship' | 'part-time' | 'contract' | 'remote';
  location: string;
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  deadline?: string;
  status: 'active' | 'closed';
  applicantsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const careerSchema = new Schema<ICareer>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    department: { type: String, default: 'Engineering & Tech', trim: true },
    employmentType: {
      type: String,
      enum: ['full-time', 'internship', 'part-time', 'contract', 'remote'],
      default: 'full-time',
    },
    location: { type: String, default: 'Remote' },
    experience: { type: String, default: '1-3 Years' },
    salary: { type: String, default: 'Competitive' },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    responsibilities: [{ type: String }],
    deadline: { type: String, default: 'Open until filled' },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    applicantsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Career: Model<ICareer> =
  mongoose.models.Career || mongoose.model<ICareer>('Career', careerSchema);

// COUPON MODEL
export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  applicableTo: 'all' | 'courses' | 'training';
  isActive: boolean;
  description: string;
  validUntil?: Date;
  usageCount: number;
  maxUsageLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: 1,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: 0,
    },
    applicableTo: {
      type: String,
      enum: ['all', 'courses', 'training'],
      default: 'all',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
    },
    validUntil: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    maxUsageLimit: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema);

export interface ICounsellingDomain extends Document {
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const counsellingDomainSchema = new Schema<ICounsellingDomain>(
  {
    name: {
      type: String,
      required: [true, 'Domain name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      default: 'system',
    },
  },
  { timestamps: true }
);

export const CounsellingDomain: Model<ICounsellingDomain> =
  mongoose.models.CounsellingDomain ||
  mongoose.model<ICounsellingDomain>('CounsellingDomain', counsellingDomainSchema);

export interface ICallNote {
  agentId: string;
  agentName: string;
  note: string;
  status: string;
  followUpAt?: Date;
  createdAt: Date;
}

export interface ILead extends Document {
  name: string;
  phone: string;
  email?: string;
  course?: string;
  preferredDomain?: string;
  education?: string;
  collegeName?: string;
  year?: string;
  branch?: string;
  source: string;
  status: string;
  statusUpdatedBy?: string;
  statusUpdatedByName?: string;
  statusUpdatedAt?: Date;
  followUpAt?: Date;
  temperature?: 'hot' | 'warm' | 'cold';
  assignedTo?: string;
  assignedAgentName?: string;
  callNotes: ICallNote[];
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const callNoteSchema = new Schema<ICallNote>(
  {
    agentId: { type: String, required: true },
    agentName: { type: String, required: true },
    note: { type: String, required: true },
    status: { type: String, required: true },
    followUpAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    course: { type: String, default: '' },
    preferredDomain: { type: String, default: '' },
    education: { type: String, default: '' },
    collegeName: { type: String, default: '' },
    year: { type: String, default: '' },
    branch: { type: String, default: '' },
    source: { type: String, default: 'public_form' },
    status: {
      type: String,
      default: 'new',
      index: true,
    },
    statusUpdatedBy: { type: String, default: '' },
    statusUpdatedByName: { type: String, default: '' },
    statusUpdatedAt: { type: Date },
    followUpAt: { type: Date, index: true },
    temperature: {
      type: String,
      enum: ['hot', 'warm', 'cold'],
      default: 'hot',
    },
    assignedTo: { type: String, default: null, index: true },
    assignedAgentName: { type: String, default: '' },
    callNotes: { type: [callNoteSchema], default: [] },
    lastContactedAt: { type: Date },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', leadSchema);

// ORDER MODEL
export interface IOrder extends Document {
  userId?: string;
  userEmail: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'created' | 'paid' | 'failed';
  paymentMethod?: string;
  couponCode?: string;
  originalAmount?: number;
  discountAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: String, default: '' },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    userName: { type: String, required: true, trim: true },
    courseId: { type: String, required: true },
    courseTitle: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },
    paymentMethod: { type: String, default: 'razorpay' },
    couponCode: { type: String, default: '' },
    originalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

// ENROLLMENT MODEL
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

enrollmentSchema.index({ userEmail: 1, courseId: 1 }, { unique: true });

export const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);

// ============================================================================
// LIVE LMS WEBRTC SESSIONS & CHAT SCHEMAS
// ============================================================================

export interface ILiveSession {
  _id?: string;
  title: string;
  courseTitle: string;
  courseId: string;
  targetType?: 'course' | 'internship' | 'all';
  thumbnail?: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}

const liveSessionSchema = new Schema<ILiveSession>(
  {
    title: { type: String, required: true },
    courseTitle: { type: String, required: true },
    courseId: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['course', 'internship', 'all'],
      default: 'course',
    },
    thumbnail: { type: String, default: '' },
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

export const LiveSession: Model<ILiveSession> =
  mongoose.models.LiveSession || mongoose.model<ILiveSession>('LiveSession', liveSessionSchema);

export interface ILiveChatMessage {
  _id?: string;
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
  createdAt?: Date;
}

const liveChatMessageSchema = new Schema<ILiveChatMessage>(
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

export const LiveChatMessage: Model<ILiveChatMessage> =
  mongoose.models.LiveChatMessage || mongoose.model<ILiveChatMessage>('LiveChatMessage', liveChatMessageSchema);

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

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', certificateSchema);


