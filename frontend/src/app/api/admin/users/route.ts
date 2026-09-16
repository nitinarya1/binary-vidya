import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

// Helper to authenticate administrator request
async function authenticateAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization token required', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return { error: 'Invalid or expired authentication session', status: 401 };
  }

  await connectDB();
  const requester = await User.findById(decoded.id);
  if (!requester) {
    return { error: 'User account not found', status: 404 };
  }

  if (requester.role !== 'admin') {
    return { error: 'Forbidden: Administrator privileges required', status: 403 };
  }

  return { requester };
}

// GET: List all registered users with metrics
export async function GET(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean();

    const totalUsers = users.length;
    const totalAdmins = users.filter((u: any) => u.role === 'admin').length;
    const totalStudents = users.filter((u: any) => u.role !== 'admin').length;

    return NextResponse.json({
      success: true,
      users: users.map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email || '',
        phone: u.phone || '',
        role: u.role || 'student',
        authProvider: u.authProvider || 'local',
        avatar: u.avatar || '',
        createdAt: u.createdAt,
      })),
      metrics: {
        totalUsers,
        totalAdmins,
        totalStudents,
      },
    });
  } catch (error: any) {
    console.error('[Admin Users GET Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PATCH: Update user role (e.g. promote to admin or demote to student)
export async function PATCH(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await req.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return NextResponse.json(
        { success: false, message: 'Target userId and newRole are required' },
        { status: 400 }
      );
    }

    const validRoles = ['student', 'admin', 'instructor'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { success: false, message: `Invalid role. Allowed roles: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'Target user not found' },
        { status: 404 }
      );
    }

    // Safety guard: Prevent demoting primary administrator
    const primaryAdmin = 'aryar0779@gmail.com';
    if (targetUser.email?.toLowerCase() === primaryAdmin && newRole !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'The primary administrator account cannot be demoted.' },
        { status: 400 }
      );
    }

    targetUser.role = newRole;
    await targetUser.save();

    return NextResponse.json({
      success: true,
      message: `User role successfully updated to ${newRole}`,
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role,
        authProvider: targetUser.authProvider,
      },
    });
  } catch (error: any) {
    console.error('[Admin Users PATCH Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update user role' },
      { status: 500 }
    );
  }
}

// POST: Create a new Administrator account directly
export async function POST(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required to create an admin account' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists' },
        { status: 400 }
      );
    }

    let formattedPhone = phone?.trim();
    if (formattedPhone) {
      const existingPhone = await User.findOne({ phone: formattedPhone });
      if (existingPhone) {
        return NextResponse.json(
          { success: false, message: 'An account with this mobile number already exists' },
          { status: 400 }
        );
      }
    }

    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: formattedPhone || undefined,
      password: hashedPassword,
      role: 'admin',
      authProvider: 'local',
      isVerified: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'New Administrator account created successfully',
        user: {
          id: newAdmin._id.toString(),
          name: newAdmin.name,
          email: newAdmin.email,
          phone: newAdmin.phone,
          role: newAdmin.role,
          authProvider: newAdmin.authProvider,
          createdAt: newAdmin.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin Users POST Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
