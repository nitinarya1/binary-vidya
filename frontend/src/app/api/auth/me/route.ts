import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

export async function GET(req: Request) {
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
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();
    const user: any = await User.findById(decoded.id).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const { isDefaultAdminEmail } = await import('../../../../lib/auth-helpers');
    const isTeamMember = Boolean(
      user.isTeamMember ||
      user.role === 'admin' ||
      user.department ||
      user.permissions?.manageCourses ||
      user.permissions?.manageTraining ||
      user.permissions?.manageCareers ||
      user.permissions?.manageTeam ||
      user.permissions?.viewAnalytics
    );

    if ((isDefaultAdminEmail(user.email) || isTeamMember) && user.role !== 'admin') {
      user.role = 'admin';
      await User.findByIdAndUpdate(user._id, { role: 'admin', isTeamMember: true });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        authProvider: user.authProvider,
        isTeamMember: user.isTeamMember || false,
        department: user.department || '',
        permissions: user.permissions || {},
        teamStatus: user.teamStatus || 'active',
      },
    });
  } catch (error: any) {
    console.error('[API Me Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
