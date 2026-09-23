import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../../lib/db';
import { User, Otp } from '../../../../../lib/models';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    await connectDB();

    // 1. Verify OTP record
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp: cleanOtp,
      purpose: 'CRM_AGENT_LOGIN',
    }).lean();

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid or incorrect verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    if (new Date() > (otpRecord as any).expiresAt) {
      await Otp.deleteOne({ _id: (otpRecord as any)._id });
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Delete used OTP
    await Otp.deleteOne({ _id: (otpRecord as any)._id });

    // 2. Fetch User and issue session (lean query)
    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: 'User record not found.' }, { status: 404 });
    }

    const isSuperAdmin =
      Boolean((user as any).isSuperAdmin) ||
      user.email === 'aryar0779@gmail.com' ||
      user.role === 'admin';

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

    const response = NextResponse.json({
      success: true,
      user: payload,
      message: 'Logged in successfully.',
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
    console.error('[CRM Verify OTP Error]:', err);
    return NextResponse.json(
      { success: false, message: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}

