import { NextResponse } from 'next/server';
import { validateAndApplyCoupon } from '../../../../lib/coupon-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, amount, itemType } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Coupon code is required.' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return NextResponse.json(
        { success: false, message: 'Valid purchase amount is required to calculate discount.' },
        { status: 400 }
      );
    }

    const type = itemType === 'training' ? 'training' : itemType === 'course' ? 'courses' : 'all';
    const result = await validateAndApplyCoupon(code, numAmount, type);

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Invalid coupon code.',
          discountAmount: 0,
          finalAmount: numAmount,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Coupon "${result.coupon?.code}" applied successfully! You save ₹${result.discountAmount.toLocaleString('en-IN')}.`,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      originalAmount: numAmount,
      coupon: result.coupon,
    });
  } catch (error: any) {
    console.error('[Coupon Validate API Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to validate coupon code' },
      { status: 500 }
    );
  }
}
