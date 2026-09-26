import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User, Coupon } from '../../../../lib/models';
import { DEFAULT_COUPONS } from '../../../../lib/coupon-helpers';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

async function authenticateAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization token required', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return { error: 'Invalid or expired session', status: 401 };
  }

  await connectDB();
  const requester: any = await User.findById(decoded.id).lean();
  if (!requester) {
    return { error: 'Administrator account not found', status: 404 };
  }

  const { isSuperAdminEmail } = await import('../../../../lib/auth-helpers');
  const isSuper = isSuperAdminEmail(requester.email) && requester.teamStatus !== 'suspended';
  const hasCoursePerm = requester.isTeamMember && requester.teamStatus !== 'suspended' && requester.permissions?.manageCourses;

  if (!isSuper && !hasCoursePerm) {
    return { error: 'Access denied: Super Administrator privilege required to manage coupons', status: 403 };
  }

  return { requester, isSuper };
}

// GET: List all coupons with metrics
export async function GET(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const discountType = searchParams.get('discountType');
    const applicableTo = searchParams.get('applicableTo');
    const status = searchParams.get('status');

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

    return NextResponse.json({
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
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST: Create a new coupon
export async function POST(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    let {
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
    } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, message: 'Coupon code is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 3) {
      return NextResponse.json({ success: false, message: 'Coupon code must be at least 3 alphanumeric characters' }, { status: 400 });
    }

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return NextResponse.json({ success: false, message: `Coupon with code "${cleanCode}" already exists` }, { status: 400 });
    }

    if (!discountType || !['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json({ success: false, message: 'Discount type must be "percentage" or "fixed"' }, { status: 400 });
    }

    const numericValue = Number(discountValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      return NextResponse.json({ success: false, message: 'Discount value must be a positive number' }, { status: 400 });
    }

    if (discountType === 'percentage' && numericValue > 100) {
      return NextResponse.json({ success: false, message: 'Percentage discount cannot exceed 100%' }, { status: 400 });
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

    return NextResponse.json({
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
    console.error('[Admin Coupons POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create coupon' }, { status: 500 });
  }
}

// PUT: Update an existing coupon
export async function PUT(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Coupon ID is required for update' }, { status: 400 });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
    }

    if (updates.code) {
      const cleanCode = updates.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const conflict = await Coupon.findOne({ code: cleanCode, _id: { $ne: id } });
      if (conflict) {
        return NextResponse.json({ success: false, message: `Another coupon with code "${cleanCode}" already exists` }, { status: 400 });
      }
      coupon.code = cleanCode;
    }

    if (updates.discountType && ['percentage', 'fixed'].includes(updates.discountType)) {
      coupon.discountType = updates.discountType;
    }

    if (updates.discountValue !== undefined) {
      const numericVal = Number(updates.discountValue);
      if (numericVal > 0) {
        if (coupon.discountType === 'percentage' && numericVal > 100) {
          return NextResponse.json({ success: false, message: 'Percentage discount cannot exceed 100%' }, { status: 400 });
        }
        coupon.discountValue = numericVal;
      }
    }

    if (updates.minOrderAmount !== undefined) coupon.minOrderAmount = Number(updates.minOrderAmount) || 0;
    if (updates.maxDiscountAmount !== undefined) coupon.maxDiscountAmount = Number(updates.maxDiscountAmount) || 0;
    if (updates.applicableTo && ['all', 'courses', 'training'].includes(updates.applicableTo)) {
      coupon.applicableTo = updates.applicableTo;
    }
    if (updates.description !== undefined) coupon.description = updates.description.trim();
    if (updates.validUntil !== undefined) {
      coupon.validUntil = updates.validUntil ? new Date(updates.validUntil) : undefined;
    }
    if (updates.maxUsageLimit !== undefined) coupon.maxUsageLimit = Number(updates.maxUsageLimit) || 0;
    if (updates.isActive !== undefined) coupon.isActive = Boolean(updates.isActive);

    await coupon.save();

    return NextResponse.json({
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
    console.error('[Admin Coupons PUT Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update coupon' }, { status: 500 });
  }
}

// DELETE: Delete a coupon
export async function DELETE(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Coupon ID parameter is required' }, { status: 400 });
    }

    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Coupon "${deleted.code}" deleted successfully!`,
    });
  } catch (error: any) {
    console.error('[Admin Coupons DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete coupon' }, { status: 500 });
  }
}
