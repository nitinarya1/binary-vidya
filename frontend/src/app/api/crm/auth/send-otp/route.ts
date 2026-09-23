import { NextResponse } from 'next/server';
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

    // 1. Check if user exists in database
    const user = await User.findOne({ email: normalizedEmail });
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
      user.isTeamMember ||
      user.role === 'admin' ||
      Boolean((user as any).isSuperAdmin) ||
      user.email === 'aryar0779@gmail.com';

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

    // 4. Save/update OTP in database
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

    // 5. Send OTP email directly via Gmail SMTP (Instant delivery, no links)
    const emailSent = await sendOtpEmail(normalizedEmail, otpCode, 'Binary Vidya Agent Sign In');
    console.log(`[Fast CRM OTP]: Sent ${otpCode} to ${normalizedEmail} (result=${emailSent})`);

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

