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
