import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email?: string;
  phone?: string;
  otp: string;
  purpose: 'FORGOT_PASSWORD' | 'EMAIL_VERIFICATION' | 'SUPER_ADMIN_LOGIN' | 'ADMIN_LOGIN' | 'CRM_AGENT_LOGIN';
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
      enum: ['FORGOT_PASSWORD', 'EMAIL_VERIFICATION', 'SUPER_ADMIN_LOGIN', 'ADMIN_LOGIN', 'CRM_AGENT_LOGIN'],
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

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
