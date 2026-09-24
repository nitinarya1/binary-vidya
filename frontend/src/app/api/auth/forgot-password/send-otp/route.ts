import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { User, Otp } from '../../../../../lib/models';
import { sendOtpEmail } from '../../../../../lib/serverMailer';

const formatPhoneNumber = (input: string): string => {
  let cleaned = input.replace(/[^0-9+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, identifier } = body;
    const target = (identifier || email || '').toString().trim();

    if (!target) {
      return NextResponse.json(
        { success: false, message: 'Please provide your registered email or mobile number' },
        { status: 400 }
      );
    }

    let user: any;
    if (target.includes('@')) {
      user = await User.findOne({ email: target.toLowerCase() }).select('email').lean();
    } else {
      const formattedPhone = formatPhoneNumber(target);
      const cleanDigits = target.replace(/\D/g, '');
      const last10 = cleanDigits.slice(-10);
      user = await User.findOne({
        $or: [
          { phone: formattedPhone },
          { phone: target },
          { phone: last10 },
          { phone: `+91${last10}` },
          { phone: `91${last10}` },
        ],
      }).select('email').lean();
    }

    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, message: 'No account found with this email or mobile number' },
        { status: 404 }
      );
    }

    const normalizedEmail = user.email.toLowerCase().trim();
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Fast atomic upsert in MongoDB (<30ms)
    await Otp.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'FORGOT_PASSWORD' },
      {
        email: normalizedEmail,
        otp: otpCode,
        purpose: 'FORGOT_PASSWORD',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    // FIRE-AND-FORGET: respond instantly, email sends in background
    sendOtpEmail(normalizedEmail, otpCode, 'Password Reset').catch((err: any) => {
      console.error('[Send Forgot Password OTP Error]:', err?.message || err);
    });

    const emailParts = normalizedEmail.split('@');
    const localPart = emailParts[0];
    const maskedLocal =
      localPart.length > 2
        ? `${localPart[0]}***${localPart[localPart.length - 1]}`
        : `${localPart[0]}***`;
    const maskedEmail = `${maskedLocal}@${emailParts[1]}`;

    return NextResponse.json({
      success: true,
      message: `A 4-digit OTP verification code has been sent to your email (${maskedEmail})!`,
      email: normalizedEmail,
      maskedEmail,
    });
  } catch (error: any) {
    console.error('[API Send OTP Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
