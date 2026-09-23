import mongoose, { Document, Schema, Model } from 'mongoose';

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
      default: 0, // 0 = no cap
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
      default: 0, // 0 = unlimited
    },
  },
  {
    timestamps: true,
  }
);

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema);
