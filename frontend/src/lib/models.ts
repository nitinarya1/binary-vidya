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
  });
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export interface IOtp extends Document {
  email?: string;
  phone?: string;
  otp: string;
  purpose: 'FORGOT_PASSWORD' | 'EMAIL_VERIFICATION' | 'SUPER_ADMIN_LOGIN' | 'ADMIN_LOGIN';
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
      enum: ['FORGOT_PASSWORD', 'EMAIL_VERIFICATION', 'SUPER_ADMIN_LOGIN', 'ADMIN_LOGIN'],
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
  slug: string;
  domain: string;
  type: 'internship' | 'training' | 'bootcamp';
  duration: string;
  mode: 'remote' | 'hybrid' | 'onsite';
  stipendOrFee: string;
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
    slug: { type: String, unique: true, lowercase: true, trim: true },
    domain: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['internship', 'training', 'bootcamp'],
      default: 'internship',
    },
    duration: { type: String, required: true, default: '3 Months' },
    mode: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
      default: 'remote',
    },
    stipendOrFee: { type: String, default: 'Stipend: ₹10,000 - ₹15,000/mo' },
    eligibility: { type: String, default: 'B.Tech/BE, BCA/MCA or equivalent' },
    perks: [{ type: String }],
    deadline: { type: String, default: 'Rolling Basis' },
    status: {
      type: String,
      enum: ['open', 'ongoing', 'closed'],
      default: 'open',
    },
    applicantsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

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

