import { connectDB } from './db';
import { Coupon, ICoupon } from './models';

export interface CouponDiscountResult {
  valid: boolean;
  message?: string;
  discountAmount: number;
  finalAmount: number;
  coupon?: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    description: string;
    applicableTo: string;
    savingsText: string;
  };
}

export const DEFAULT_COUPONS = [
  {
    code: 'WELCOME10',
    discountType: 'percentage' as const,
    discountValue: 10,
    minOrderAmount: 500,
    maxDiscountAmount: 1500,
    applicableTo: 'all' as const,
    isActive: true,
    description: '10% Instant Discount on all Courses & Industrial Training programs.',
  },
  {
    code: 'BINARY20',
    discountType: 'percentage' as const,
    discountValue: 20,
    minOrderAmount: 1000,
    maxDiscountAmount: 2500,
    applicableTo: 'all' as const,
    isActive: true,
    description: '20% Exclusive Community Discount across all programs.',
  },
  {
    code: 'SKILL500',
    discountType: 'fixed' as const,
    discountValue: 500,
    minOrderAmount: 1500,
    applicableTo: 'all' as const,
    isActive: true,
    description: 'Flat ₹500 OFF on Career Training & Professional Course bundles.',
  },
  {
    code: 'FESTIVE1000',
    discountType: 'fixed' as const,
    discountValue: 1000,
    minOrderAmount: 2000,
    applicableTo: 'all' as const,
    isActive: true,
    description: 'Special ₹1,000 Voucher on orders above ₹2,000.',
  },
  {
    code: 'FUTUREDEV',
    discountType: 'percentage' as const,
    discountValue: 30,
    minOrderAmount: 1500,
    maxDiscountAmount: 3000,
    applicableTo: 'all' as const,
    isActive: true,
    description: '30% Student Scholarship Discount for aspiring tech leaders.',
  },
];

export async function ensureSeedCoupons() {
  try {
    await connectDB();
    for (const def of DEFAULT_COUPONS) {
      const exists = await Coupon.findOne({ code: def.code });
      if (!exists) {
        await Coupon.create(def);
      }
    }
  } catch (err) {
    console.error('[Ensure Seed Coupons Error]:', err);
  }
}

export async function validateAndApplyCoupon(
  rawCode: string,
  amount: number,
  itemType: 'course' | 'courses' | 'training' | 'all' = 'all'
): Promise<CouponDiscountResult> {
  if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
    return { valid: false, message: 'Please provide a valid coupon code.', discountAmount: 0, finalAmount: amount };
  }

  const code = rawCode.trim().toUpperCase();
  await connectDB();
  await ensureSeedCoupons();

  let couponDoc: any = await Coupon.findOne({ code }).lean();

  // Fallback to in-memory default list if database is still seeding
  if (!couponDoc) {
    couponDoc = DEFAULT_COUPONS.find((c) => c.code === code);
  }

  if (!couponDoc) {
    return {
      valid: false,
      message: `Coupon code "${code}" is invalid or does not exist.`,
      discountAmount: 0,
      finalAmount: amount,
    };
  }

  if (!couponDoc.isActive) {
    return {
      valid: false,
      message: `Coupon code "${code}" is currently inactive.`,
      discountAmount: 0,
      finalAmount: amount,
    };
  }

  if (couponDoc.validUntil && new Date() > new Date(couponDoc.validUntil)) {
    return {
      valid: false,
      message: `Coupon code "${code}" has expired.`,
      discountAmount: 0,
      finalAmount: amount,
    };
  }

  const normalizedItemType = (itemType === 'course' || itemType === 'courses') ? 'courses' : itemType;
  const isApplicable =
    couponDoc.applicableTo === 'all' ||
    couponDoc.applicableTo === normalizedItemType ||
    (couponDoc.applicableTo === 'courses' && (itemType === 'course' || itemType === 'courses'));

  if (!isApplicable) {
    const targetLabel = couponDoc.applicableTo === 'courses' ? 'Courses' : 'Training & Internship programs';
    return {
      valid: false,
      message: `Coupon "${code}" is only applicable to ${targetLabel}.`,
      discountAmount: 0,
      finalAmount: amount,
    };
  }

  if (couponDoc.minOrderAmount && amount < couponDoc.minOrderAmount) {
    return {
      valid: false,
      message: `Coupon "${code}" requires a minimum order amount of ₹${couponDoc.minOrderAmount.toLocaleString('en-IN')}.`,
      discountAmount: 0,
      finalAmount: amount,
    };
  }

  // Calculate discount
  let discount = 0;
  if (couponDoc.discountType === 'percentage') {
    discount = Math.round((amount * couponDoc.discountValue) / 100);
    if (couponDoc.maxDiscountAmount && couponDoc.maxDiscountAmount > 0) {
      discount = Math.min(discount, couponDoc.maxDiscountAmount);
    }
  } else if (couponDoc.discountType === 'fixed') {
    discount = Math.min(amount, couponDoc.discountValue);
  }

  // Ensure amount doesn't go below ₹1 (or 0 if fully discounted)
  const finalAmount = Math.max(0, amount - discount);
  const savingsText =
    couponDoc.discountType === 'percentage'
      ? `${couponDoc.discountValue}% OFF (Saved ₹${discount.toLocaleString('en-IN')})`
      : `Flat ₹${discount.toLocaleString('en-IN')} OFF`;

  return {
    valid: true,
    discountAmount: discount,
    finalAmount,
    coupon: {
      code: couponDoc.code,
      discountType: couponDoc.discountType,
      discountValue: couponDoc.discountValue,
      description: couponDoc.description || savingsText,
      applicableTo: couponDoc.applicableTo || 'all',
      savingsText,
    },
  };
}
