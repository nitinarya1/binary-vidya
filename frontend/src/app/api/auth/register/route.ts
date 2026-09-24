import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';
import { sendWelcomeEmail } from '../../../../lib/serverMailer';
import { isSuperAdminEmail } from '../../../../lib/auth-helpers';

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
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide name, email, and password' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail }).select('_id').lean();
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    let formattedPhone: string | undefined;
    if (phone && phone.trim()) {
      formattedPhone = formatPhoneNumber(phone);
      const existingPhone = await User.findOne({ phone: formattedPhone }).select('_id').lean();
      if (existingPhone) {
        return NextResponse.json(
          { success: false, message: 'An account with this mobile number already exists' },
          { status: 400 }
        );
      }
    }

    // Use 8 rounds for faster hashing while maintaining security
    const hashedPassword = await bcrypt.hash(password, 8);

    const roleToAssign = isSuperAdminEmail(normalizedEmail) ? 'admin' : 'student';

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: formattedPhone || undefined,
      password: hashedPassword,
      authProvider: 'local',
      role: roleToAssign,
      isVerified: false,
    });

    // Send welcome email in background (fire-and-forget)
    sendWelcomeEmail({
      id: user._id.toString(),
      name: user.name,
      email: user.email || normalizedEmail,
      role: user.role,
      phone: user.phone,
    }).catch((mailErr) => {
      console.error('[Background Send Welcome Email Error]:', mailErr);
    });

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Register Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error during registration' },
      { status: 500 }
    );
  }
}
