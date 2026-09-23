import { Request, Response } from 'express';
import { Coupon } from '../models/Coupon';

const DEFAULT_COUPONS = [
  {
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 500,
    maxDiscountAmount: 1500,
    applicableTo: 'all',
    isActive: true,
    description: '10% Instant Discount on all Courses & Industrial Training programs.',
  },
  {
    code: 'BINARY20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 1000,
    maxDiscountAmount: 2500,
    applicableTo: 'all',
    isActive: true,
    description: '20% Exclusive Community Discount across all programs.',
  },
  {
    code: 'SKILL500',
    discountType: 'fixed',
    discountValue: 500,
    minOrderAmount: 1500,
    applicableTo: 'all',
    isActive: true,
    description: 'Flat ₹500 OFF on Career Training & Professional Course bundles.',
  },
  {
    code: 'FESTIVE1000',
    discountType: 'fixed',
    discountValue: 1000,
    minOrderAmount: 2000,
    applicableTo: 'all',
    isActive: true,
    description: 'Special ₹1,000 Voucher on orders above ₹2,000.',
  },
  {
    code: 'FUTUREDEV',
    discountType: 'percentage',
    discountValue: 30,
    minOrderAmount: 1500,
    maxDiscountAmount: 3000,
    applicableTo: 'all',
    isActive: true,
    description: '30% Student Scholarship Discount for aspiring tech leaders.',
  },
];

export const getAvailableCoupons = async (req: Request, res: Response) => {
  // Public listing of coupon codes is disabled to keep promo codes private.
  // Students and customers enter their coupon code directly at checkout.
  return res.json({ success: true, coupons: [] });
};

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code, amount, itemType } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required to calculate discount.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const type = itemType === 'training' ? 'training' : itemType === 'course' ? 'courses' : 'all';

    let couponDoc: any = await Coupon.findOne({ code: cleanCode }).lean();
    if (!couponDoc) {
      couponDoc = DEFAULT_COUPONS.find((c) => c.code === cleanCode);
    }

    if (!couponDoc) {
      return res.status(400).json({ success: false, message: `Coupon code "${cleanCode}" is invalid or does not exist.` });
    }

    if (!couponDoc.isActive) {
      return res.status(400).json({ success: false, message: `Coupon code "${cleanCode}" is inactive.` });
    }

    if (couponDoc.validUntil && new Date() > new Date(couponDoc.validUntil)) {
      return res.status(400).json({ success: false, message: `Coupon code "${cleanCode}" has expired.` });
    }

    if (couponDoc.applicableTo !== 'all' && couponDoc.applicableTo !== type) {
      const targetLabel = couponDoc.applicableTo === 'courses' ? 'Courses' : 'Training & Internship programs';
      return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" is only applicable to ${targetLabel}.` });
    }

    if (couponDoc.minOrderAmount && numAmount < couponDoc.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" requires a minimum order amount of ₹${couponDoc.minOrderAmount.toLocaleString('en-IN')}.`,
      });
    }

    let discount = 0;
    if (couponDoc.discountType === 'percentage') {
      discount = Math.round((numAmount * couponDoc.discountValue) / 100);
      if (couponDoc.maxDiscountAmount && couponDoc.maxDiscountAmount > 0) {
        discount = Math.min(discount, couponDoc.maxDiscountAmount);
      }
    } else if (couponDoc.discountType === 'fixed') {
      discount = Math.min(numAmount, couponDoc.discountValue);
    }

    const finalAmount = Math.max(0, numAmount - discount);
    const savingsText =
      couponDoc.discountType === 'percentage'
        ? `${couponDoc.discountValue}% OFF (Saved ₹${discount.toLocaleString('en-IN')})`
        : `Flat ₹${discount.toLocaleString('en-IN')} OFF`;

    res.json({
      success: true,
      message: `Coupon "${cleanCode}" applied! You save ₹${discount.toLocaleString('en-IN')}.`,
      discountAmount: discount,
      finalAmount,
      originalAmount: numAmount,
      coupon: {
        code: cleanCode,
        discountType: couponDoc.discountType,
        discountValue: couponDoc.discountValue,
        description: couponDoc.description || savingsText,
        applicableTo: couponDoc.applicableTo || 'all',
        savingsText,
      },
    });
  } catch (error: any) {
    console.error('[Validate Coupon Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Error validating coupon' });
  }
};

export const getAllCouponsAdmin = async (req: Request, res: Response) => {
  try {
    const { search, discountType, applicableTo, status } = req.query;
    const query: any = {};
    if (discountType && discountType !== 'all') query.discountType = discountType;
    if (applicableTo && applicableTo !== 'all') query.applicableTo = applicableTo;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const coupons = await Coupon.find(query).sort({ createdAt: -1 }).lean();
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ isActive: true });
    const inactiveCoupons = totalCoupons - activeCoupons;
    const totalTimesUsed = (await Coupon.aggregate([{ $group: { _id: null, total: { $sum: '$usageCount' } } }]))[0]?.total || 0;

    res.json({
      success: true,
      coupons: coupons.map((c: any) => ({
        id: c._id.toString(),
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount || 0,
        maxDiscountAmount: c.maxDiscountAmount || 0,
        applicableTo: c.applicableTo || 'all',
        isActive: Boolean(c.isActive),
        description: c.description || '',
        validUntil: c.validUntil ? c.validUntil.toISOString() : null,
        usageCount: c.usageCount || 0,
        maxUsageLimit: c.maxUsageLimit || 0,
        createdAt: c.createdAt,
      })),
      metrics: {
        totalCoupons,
        activeCoupons,
        inactiveCoupons,
        totalTimesUsed,
      },
    });
  } catch (error: any) {
    console.error('[Admin Coupons GET Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch coupons' });
  }
};

export const createCouponAdmin = async (req: Request, res: Response) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      applicableTo,
      description,
      validUntil,
      maxUsageLimit,
      isActive,
    } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 3) {
      return res.status(400).json({ success: false, message: 'Coupon code must be at least 3 characters' });
    }

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon "${cleanCode}" already exists` });
    }

    if (!discountType || !['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ success: false, message: 'Discount type must be percentage or fixed' });
    }

    const numericValue = Number(discountValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      return res.status(400).json({ success: false, message: 'Discount value must be a positive number' });
    }

    if (discountType === 'percentage' && numericValue > 100) {
      return res.status(400).json({ success: false, message: 'Percentage discount cannot exceed 100%' });
    }

    const newCoupon = await Coupon.create({
      code: cleanCode,
      discountType,
      discountValue: numericValue,
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: discountType === 'percentage' ? (Number(maxDiscountAmount) || 0) : 0,
      applicableTo: ['all', 'courses', 'training'].includes(applicableTo) ? applicableTo : 'all',
      description: description ? description.trim() : '',
      validUntil: validUntil ? new Date(validUntil) : undefined,
      maxUsageLimit: Number(maxUsageLimit) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      usageCount: 0,
    });

    res.json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully!`,
      coupon: {
        id: newCoupon._id.toString(),
        code: newCoupon.code,
        discountType: newCoupon.discountType,
        discountValue: newCoupon.discountValue,
        minOrderAmount: newCoupon.minOrderAmount,
        maxDiscountAmount: newCoupon.maxDiscountAmount,
        applicableTo: newCoupon.applicableTo,
        isActive: newCoupon.isActive,
        description: newCoupon.description,
        validUntil: newCoupon.validUntil ? newCoupon.validUntil.toISOString() : null,
        usageCount: newCoupon.usageCount,
        maxUsageLimit: newCoupon.maxUsageLimit,
        createdAt: newCoupon.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Admin Coupon Create Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create coupon' });
  }
};

export const updateCouponAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Coupon ID is required' });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (updates.code) {
      const cleanCode = updates.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const conflict = await Coupon.findOne({ code: cleanCode, _id: { $ne: id } });
      if (conflict) {
        return res.status(400).json({ success: false, message: `Coupon with code "${cleanCode}" already exists` });
      }
      coupon.code = cleanCode;
    }

    if (updates.discountType && ['percentage', 'fixed'].includes(updates.discountType)) {
      coupon.discountType = updates.discountType;
    }

    if (updates.discountValue !== undefined) {
      const val = Number(updates.discountValue);
      if (val > 0) {
        if (coupon.discountType === 'percentage' && val > 100) {
          return res.status(400).json({ success: false, message: 'Percentage cannot exceed 100%' });
        }
        coupon.discountValue = val;
      }
    }

    if (updates.minOrderAmount !== undefined) coupon.minOrderAmount = Number(updates.minOrderAmount) || 0;
    if (updates.maxDiscountAmount !== undefined) coupon.maxDiscountAmount = Number(updates.maxDiscountAmount) || 0;
    if (updates.applicableTo && ['all', 'courses', 'training'].includes(updates.applicableTo)) {
      coupon.applicableTo = updates.applicableTo;
    }
    if (updates.description !== undefined) coupon.description = updates.description.trim();
    if (updates.validUntil !== undefined) coupon.validUntil = updates.validUntil ? new Date(updates.validUntil) : undefined;
    if (updates.maxUsageLimit !== undefined) coupon.maxUsageLimit = Number(updates.maxUsageLimit) || 0;
    if (updates.isActive !== undefined) coupon.isActive = Boolean(updates.isActive);

    await coupon.save();

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" updated successfully!`,
      coupon: {
        id: coupon._id.toString(),
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        applicableTo: coupon.applicableTo,
        isActive: coupon.isActive,
        description: coupon.description,
        validUntil: coupon.validUntil ? coupon.validUntil.toISOString() : null,
        usageCount: coupon.usageCount,
        maxUsageLimit: coupon.maxUsageLimit,
        createdAt: coupon.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Admin Coupon Update Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update coupon' });
  }
};

export const deleteCouponAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Coupon ID is required' });
    }

    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, message: `Coupon "${deleted.code}" deleted successfully!` });
  } catch (error: any) {
    console.error('[Admin Coupon Delete Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete coupon' });
  }
};

