import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { Coupon } from '../../../../lib/models';
import { DEFAULT_COUPONS, ensureSeedCoupons } from '../../../../lib/coupon-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Public listing of coupon codes is disabled to keep promo codes private.
  // Students and buyers enter their promo/coupon code directly at checkout.
  return NextResponse.json({
    success: true,
    coupons: [],
  });
}
