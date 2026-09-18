import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User account not found' },
        { status: 404 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);

    user.password = hashedPassword;
    user.mustChangePassword = false;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Your permanent password has been set successfully! Welcome to the administration console.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isTeamMember: user.isTeamMember || false,
        department: user.department || '',
        permissions: user.permissions || {},
        teamStatus: user.teamStatus || 'active',
        mustChangePassword: false,
      },
    });
  } catch (error: any) {
    console.error('[API Change First Password Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error while updating password' },
      { status: 500 }
    );
  }
}
