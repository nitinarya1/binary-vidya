import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../../lib/db';
import { User } from '../../../../../lib/models';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/(^|;\s*)crm_token=([^;]*)/);
    let token = tokenMatch ? decodeURIComponent(tokenMatch[2]) : null;

    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please log in first.' },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    const { newPassword } = await req.json();
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Agent account not found.' },
        { status: 404 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword.trim(), salt);
    user.mustChangePassword = false;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Permanent password saved successfully! Loading CRM Dashboard...',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role === 'admin' ? 'super_admin' : 'agent',
        department: user.department || 'BDA',
        salesTeam: (user as any).salesTeam || user.department || 'BDA',
        mustChangePassword: false,
      },
    });
  } catch (err: any) {
    console.error('[CRM Change First Password Error]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update permanent password.' },
      { status: 500 }
    );
  }
}
