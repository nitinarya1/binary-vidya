import mongoose, { Document, Schema, Model } from 'mongoose';

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
