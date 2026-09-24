import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../../lib/db';
import { User, Otp } from '../../../../../lib/models';
import { isSuperAdminEmail, isDefaultAdminEmail } from '../../../../../lib/auth-helpers';

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

    // Parallel fetch: user + OTP record simultaneously
    const [user, otpRecord] = await Promise.all([
      User.findOne({ email: normalizedEmail }).lean() as Promise<any>,
      Otp.findOne({
        email: normalizedEmail,
        otp: cleanOtp,
        purpose: { $in: ['ADMIN_LOGIN', 'SUPER_ADMIN_LOGIN'] },
      }).lean() as Promise<any>,
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Administrator account record not found' },
        { status: 404 }
      );
    }

    const isAdminUser = user.role === 'admin' || user.isTeamMember || isDefaultAdminEmail(normalizedEmail) || isSuperAdminEmail(normalizedEmail);
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

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid or incorrect OTP code. Please try again.' },
        { status: 400 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      Otp.deleteOne({ _id: otpRecord._id }).exec().catch(() => {});
      return NextResponse.json(
        { success: false, message: 'OTP has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // OTP is valid - consume it (fire-and-forget)
    Otp.deleteOne({ _id: otpRecord._id }).exec().catch(() => {});

    // Only update role if genuinely needed (fire-and-forget)
    if (user.role !== 'admin' && (user.isTeamMember || isDefaultAdminEmail(normalizedEmail) || isSuperAdminEmail(normalizedEmail))) {
      User.findByIdAndUpdate(user._id, { role: 'admin', isTeamMember: true }).exec().catch(() => {});
    }

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
    const isSuper = isSuperAdminEmail(normalizedEmail);
    const mustChangePassword = Boolean(user.mustChangePassword);

    return NextResponse.json({
      success: true,
      message: isSuper
        ? 'Super Admin 2FA verified successfully! Redirecting to Super Admin Console...'
        : mustChangePassword
        ? 'Verification successful! Please choose a new permanent password.'
        : 'Admin 2FA verified successfully! Redirecting to Admin Console...',
      token,
      isSuperAdmin: isSuper,
      mustChangePassword,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role === 'admin' ? 'admin' : 'admin',
        avatar: user.avatar,
        isTeamMember: user.isTeamMember || false,
        department: user.department || '',
        permissions: user.permissions || {},
        teamStatus: user.teamStatus || 'active',
        mustChangePassword,
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
