import mongoose, { Document, Schema } from 'mongoose';

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

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
