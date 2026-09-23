import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User, Otp } from '../../../../lib/models';
import { sendOtpEmail } from '../../../../lib/serverMailer';
import { isSuperAdminEmail, isDefaultAdminEmail } from '../../../../lib/auth-helpers';

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
      // Email lookup — uses index directly
      user = await User.findOne({ email: loginId.toLowerCase() }).select('+password');
    } else {
      // Phone lookup — try formatted variants only (avoids slow $regex collection scan)
      const formattedPhone = formatPhoneNumber(loginId);
      user = await User.findOne({
        $or: [
          { phone: formattedPhone },
          { phone: loginId },
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

    // Static imports used — no dynamic import penalty
    const isSuperAdmin = isDefaultAdminEmail(user.email) || isSuperAdminEmail(user.email);
    const rawDoc: any = user;
    const isTeamMember = Boolean(
      rawDoc.isTeamMember ||
      rawDoc.role === 'admin' ||
      rawDoc.department ||
      rawDoc.permissions?.manageCourses ||
      rawDoc.permissions?.manageTraining ||
      rawDoc.permissions?.manageCareers ||
      rawDoc.permissions?.manageTeam ||
      rawDoc.permissions?.viewAnalytics
    );

    // Only save if role upgrade is actually needed (not on every admin login)
    if ((isSuperAdmin || isTeamMember) && user.role !== 'admin') {
      user.role = 'admin';
      user.isTeamMember = true;
      await user.save();
    }

    if (user.teamStatus === 'suspended') {
      return NextResponse.json(
        { success: false, message: 'Your staff account has been suspended by the Super Administrator. Please contact management.' },
        { status: 403 }
      );
    }

    // Two-Factor Authentication (2FA) for both Super Administrator and Team Members
    if (isSuperAdmin || isTeamMember) {
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      const normalizedEmail = (user.email || '').toLowerCase().trim();
      const targetEmail = isSuperAdmin ? 'aryar0779@gmail.com' : normalizedEmail;
      const otpPurpose = isSuperAdmin ? 'SUPER_ADMIN_LOGIN' : 'ADMIN_LOGIN';

      // Use static Otp import (no dynamic import penalty)
      await Otp.findOneAndUpdate(
        { email: normalizedEmail, purpose: otpPurpose },
        {
          email: normalizedEmail,
          otp: otpCode,
          purpose: otpPurpose,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        { upsert: true, new: true }
      );

      const emailSubject = isSuperAdmin
        ? 'Super Admin Login Verification Code'
        : 'Team Member Login Verification Code';

      // FIRE-AND-FORGET: respond instantly, don't wait for SMTP
      sendOtpEmail(targetEmail, otpCode, emailSubject).catch((err: any) => {
        console.error('[Send Login OTP Background Error]:', err?.message || err);
      });

      const emailParts = targetEmail.split('@');
      const localPart = emailParts[0];
      const maskedEmail = `${localPart[0]}***${localPart[localPart.length - 1]}@${emailParts[1]}`;

      return NextResponse.json({
        success: true,
        requireOtp: true,
        email: normalizedEmail,
        maskedEmail: maskedEmail,
        isSuperAdmin: isSuperAdmin,
        isTeamMember: isTeamMember,
        message: isSuperAdmin
          ? `Super Admin Verification: A 4-digit OTP has been sent to ${targetEmail}!`
          : `Team Verification: A 4-digit OTP has been sent to ${maskedEmail}!`,
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
