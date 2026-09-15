import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { Otp } from '../../../../../lib/models';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp: cleanOtp,
      purpose: 'FORGOT_PASSWORD',
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP code' },
        { status: 400 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { success: false, message: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
    });
  } catch (error: any) {
    console.error('[API Verify OTP Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
