import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { connectDB } from '../../../../../lib/db';
import { User, Otp } from '../../../../../lib/models';
import { sendOtpEmail } from '../../../../../lib/serverMailer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: 'Please enter your registered email address.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    // 1. Check user with a lean (no hydration overhead) single query
    const user = await User.findOne({ email: normalizedEmail }).select('isTeamMember role email').lean();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'This email is not registered in our database. Please contact an administrator.',
        },
        { status: 404 }
      );
    }

    // 2. Check if user is an authorized CRM team member / agent
    const isSalesAgent =
      (user as any).isTeamMember ||
      (user as any).role === 'admin' ||
      Boolean((user as any).isSuperAdmin) ||
      (user as any).email === 'aryar0779@gmail.com';

    if (!isSalesAgent) {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied. This email is not registered as an authorized sales agent.',
        },
        { status: 403 }
      );
    }

    // 3. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 4. Save OTP in DB (<20ms)
    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'CRM_AGENT_LOGIN' },
      {
        email: normalizedEmail,
        otp: otpCode,
        purpose: 'CRM_AGENT_LOGIN',
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 5. Extend serverless runtime so email sends in background without stalling HTTP response
    waitUntil(
      sendOtpEmail(normalizedEmail, otpCode, 'Binary Vidya Agent Sign In').catch((err: any) => {
        console.error('[CRM OTP Background Error]:', err?.message || err);
      })
    );

    return NextResponse.json({
      success: true,
      message: `A 6-digit login code has been sent to ${normalizedEmail}.`,
      email: normalizedEmail,
    });
  } catch (err: any) {
    console.error('[CRM Send OTP Error]:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to send login code. Please try again.' },
      { status: 500 }
    );
  }
}

