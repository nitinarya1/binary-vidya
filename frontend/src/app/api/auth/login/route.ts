import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

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
    const { email, identifier, phone, password } = body;
    const loginId = (identifier || email || phone || '').toString().trim();

    if (!loginId || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide email or mobile number, and password' },
        { status: 400 }
      );
    }

    let user;
    if (loginId.includes('@')) {
      user = await User.findOne({ email: loginId.toLowerCase() }).select('+password');
    } else {
      const formattedPhone = formatPhoneNumber(loginId);
      const cleanDigits = loginId.replace(/\D/g, '');
      user = await User.findOne({
        $or: [
          { phone: formattedPhone },
          { phone: loginId },
          { phone: { $regex: cleanDigits.slice(-10) + '$' } },
        ],
      }).select('+password');
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Check your email or mobile number.' },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, message: 'This account uses Google Sign-In. Please sign in with Google.' },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Check your password.' },
        { status: 401 }
      );
    }

    const { isSuperAdminEmail, isDefaultAdminEmail } = await import('../../../../lib/auth-helpers');
    if (isDefaultAdminEmail(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    if (user.teamStatus === 'suspended') {
      return NextResponse.json(
        { success: false, message: 'Your staff account has been suspended by the Super Administrator. Please contact management.' },
        { status: 403 }
      );
    }

    const isSuperAdmin = isDefaultAdminEmail(user.email) || isSuperAdminEmail(user.email);

    // Two-Factor Authentication (2FA) strictly for Super Administrator accounts: Always dispatch OTP to aryar0779@gmail.com
    if (isSuperAdmin) {
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      const normalizedEmail = (user.email || '').toLowerCase().trim();
      const superAdminEmail = 'aryar0779@gmail.com';

      const { Otp } = await import('../../../../lib/models');
      await Otp.findOneAndUpdate(
        { email: normalizedEmail, purpose: 'SUPER_ADMIN_LOGIN' },
        {
          email: normalizedEmail,
          otp: otpCode,
          purpose: 'SUPER_ADMIN_LOGIN',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        { upsert: true, new: true }
      );

      const { sendOtpEmail } = await import('../../../../lib/serverMailer');
      const emailSubject = 'Super Admin Login Verification Code';

      // Send OTP directly to aryar0779@gmail.com
      sendOtpEmail(superAdminEmail, otpCode, emailSubject).catch((err) => {
        console.error('[Background Send Super Admin Login OTP Error]:', err);
      });

      const emailParts = normalizedEmail.split('@');
      const localPart = emailParts[0];
      const maskedEmail = `${localPart[0]}***${localPart[localPart.length - 1]}@${emailParts[1]}`;

      return NextResponse.json({
        success: true,
        requireOtp: true,
        email: normalizedEmail,
        maskedEmail: maskedEmail || 'a***9@gmail.com',
        isSuperAdmin: true,
        message: `Super Admin Verification: A 4-digit OTP has been sent to ${superAdminEmail}!`,
      });
    }

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      token,
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
    console.error('[API Login Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error during login' },
      { status: 500 }
    );
  }
}
