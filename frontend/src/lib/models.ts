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

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>('Otp', otpSchema);

// COURSE & CHAPTER VIDEO MODELS
export interface IVideoLesson {
  id?: string;
  title: string;
  videoUrl: string;
  duration: string;
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
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration: string;
  price: number;
  instructor: string;
  thumbnail?: string;
  tags: string[];
  chapters: IChapter[];
  modules: { title: string; lecturesCount: number; duration: string }[];
  status: 'active' | 'draft' | 'archived';
  enrolledCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true, default: 'Full Stack Development' },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'Beginner',
    },
    duration: { type: String, required: true, default: '10 Weeks' },
    price: { type: Number, default: 0 },
    instructor: { type: String, required: true, default: 'Binary Vidya Faculty' },
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
  subtitle?: string;
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
    subtitle: { type: String, default: '' },
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
    deadline: { type: String, default: 'Rolling Admissions' },
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
  employmentType: 'full-time' | 'part-time' | 'contract' | 'remote';
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
    department: { type: String, required: true, trim: true },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'remote'],
      default: 'full-time',
    },
    location: { type: String, default: 'Remote (India)' },
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

