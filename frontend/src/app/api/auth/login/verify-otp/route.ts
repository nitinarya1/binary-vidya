import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../../lib/db';
import { User, Otp } from '../../../../../lib/models';
import { isSuperAdminEmail } from '../../../../../lib/auth-helpers';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and 4-digit OTP code are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const { isSuperAdminEmail, isDefaultAdminEmail } = await import('../../../../../lib/auth-helpers');
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Administrator account record not found' },
        { status: 404 }
      );
    }

    const isAdminUser = user.role === 'admin' || isDefaultAdminEmail(normalizedEmail) || isSuperAdminEmail(normalizedEmail);
    if (!isAdminUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access only' },
        { status: 403 }
      );
    }

    if (user.teamStatus === 'suspended') {
      return NextResponse.json(
        { success: false, message: 'Your account has been suspended by the Super Administrator. Please contact management.' },
        { status: 403 }
      );
    }

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp: cleanOtp,
      purpose: { $in: ['ADMIN_LOGIN', 'SUPER_ADMIN_LOGIN'] },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid or incorrect OTP code. Please try again.' },
        { status: 400 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { success: false, message: 'OTP has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // OTP is valid - consume it immediately
    await Otp.deleteOne({ _id: otpRecord._id });

    if (user.role !== 'admin' && (isDefaultAdminEmail(normalizedEmail) || isSuperAdminEmail(normalizedEmail))) {
      user.role = 'admin';
      await user.save();
    }

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
    const isSuper = isSuperAdminEmail(normalizedEmail);

    return NextResponse.json({
      success: true,
      message: isSuper
        ? 'Super Admin 2FA verified successfully! Redirecting to Super Admin Console...'
        : 'Admin 2FA verified successfully! Redirecting to Admin Console...',
      token,
      isSuperAdmin: isSuper,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isTeamMember: user.isTeamMember || false,
        department: user.department || '',
        permissions: user.permissions || {},
        teamStatus: user.teamStatus || 'active',
      },
    });
  } catch (error: any) {
    console.error('[API Super Admin Verify OTP Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
