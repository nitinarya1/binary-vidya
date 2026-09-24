import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../../lib/db';
import { User, Otp } from '../../../../../lib/models';
import { sendOtpEmail } from '../../../../../lib/serverMailer';
import { isSuperAdminEmail } from '../../../../../lib/auth-helpers';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please enter both your work email and password.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No authorized staff or agent account found with this email.' },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, message: 'Password is not set for this account. Please use Forgot Password.' },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Incorrect password.' },
        { status: 401 }
      );
    }

    if (user.teamStatus === 'suspended') {
      return NextResponse.json(
        { success: false, message: 'Your sales account has been suspended by management. Please contact your Super Administrator.' },
        { status: 403 }
      );
    }

    const isSuperAdmin =
      user.email === 'aryar0779@gmail.com' ||
      user.email === 'binaryvidyaadmin@gmail.com' ||
      isSuperAdminEmail(user.email) ||
      user.role === 'admin' ||
      Boolean((user as any).isSuperAdmin);

    const isAuthorizedAgent =
      isSuperAdmin ||
      user.isTeamMember ||
      Boolean(user.department) ||
      Boolean((user as any).salesTeam);

    if (!isAuthorizedAgent) {
      return NextResponse.json(
        { success: false, message: 'Access denied. You are not registered as an authorized CRM agent.' },
        { status: 403 }
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. SUPER ADMIN 2FA OTP REQUIREMENT (aryar0779@gmail.com)
    // ──────────────────────────────────────────────────────────────────────────
    if (user.email === 'aryar0779@gmail.com') {
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      const otpPurpose = 'SUPER_ADMIN_LOGIN';

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

      waitUntil(
        sendOtpEmail(normalizedEmail, otpCode, 'Super Admin CRM Login Verification Code').catch((err: any) => {
          console.error('[CRM Login Super Admin OTP Error]:', err?.message || err);
        })
      );

      const emailParts = normalizedEmail.split('@');
      const localPart = emailParts[0];
      const maskedEmail = `${localPart[0]}***${localPart[localPart.length - 1]}@${emailParts[1]}`;

      return NextResponse.json({
        success: true,
        requireOtp: true,
        email: normalizedEmail,
        maskedEmail,
        isSuperAdmin: true,
        message: `Super Admin Verification: A 4-digit code has been sent to ${normalizedEmail}.`,
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. REGULAR AGENT LOGIN (NO OTP - Direct Password Login)
    // ──────────────────────────────────────────────────────────────────────────
    const teamName =
      user.department && ['CSM', 'BDA', 'Lead Generation'].includes(user.department)
        ? user.department
        : (user as any).salesTeam && ['CSM', 'BDA', 'Lead Generation'].includes((user as any).salesTeam)
        ? (user as any).salesTeam
        : user.department && user.department !== 'sales'
        ? user.department
        : 'BDA';

    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: isSuperAdmin ? 'super_admin' : 'agent',
      department: teamName,
      salesTeam: teamName,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
    const mustChangePassword = Boolean(user.mustChangePassword);

    const response = NextResponse.json({
      success: true,
      user: payload,
      token,
      mustChangePassword,
      message: mustChangePassword
        ? 'Login successful. Please create your permanent password.'
        : 'Logged in successfully.',
    });

    response.cookies.set('crm_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('[CRM Auth Login Route Error]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Server error during login' },
      { status: 500 }
    );
  }
}
