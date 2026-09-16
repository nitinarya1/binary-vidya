import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

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
    const { identifier, email, phone } = body;
    const loginId = (identifier || email || phone || '').toString().trim();

    if (!loginId) {
      return NextResponse.json(
        { success: false, message: 'Please enter your email or mobile number.' },
        { status: 400 }
      );
    }

    let user;
    if (loginId.includes('@')) {
      user = await User.findOne({ email: loginId.toLowerCase() });
    } else {
      const formattedPhone = formatPhoneNumber(loginId);
      const cleanDigits = loginId.replace(/\D/g, '');
      user = await User.findOne({
        $or: [
          { phone: formattedPhone },
          { phone: loginId },
          { phone: { $regex: cleanDigits.slice(-10) + '$' } },
        ],
      });
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          exists: false,
          message: 'No account found with this email or mobile number.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      exists: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    });
  } catch (error: any) {
    console.error('[API Check-Email Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error while verifying email' },
      { status: 500 }
    );
  }
}
