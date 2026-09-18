import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';
import { isSuperAdminEmail, SUPER_ADMIN_EMAILS } from '../../../../lib/auth-helpers';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

// Strict Super Administrator authentication guard
async function authenticateSuperAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization token required', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return { error: 'Invalid or expired session', status: 401 };
  }

  await connectDB();
  const requester = await User.findById(decoded.id);
  if (!requester) {
    return { error: 'Administrator account not found', status: 404 };
  }

  // STRICT REQUIREMENT: Only active Super Administrator can view, create, edit, or delete team members
  if (!isSuperAdminEmail(requester.email) || requester.teamStatus === 'suspended') {
    return {
      error: 'Forbidden: Your administrator account has been suspended or you do not have permission.',
      status: 403,
    };
  }

  return { requester };
}

// GET: Fetch all team members and access statistics
export async function GET(req: Request) {
  try {
    const authResult = await authenticateSuperAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    // Query all team members or admin role accounts
    const teamMembers = await User.find(
      {
        $or: [
          { isTeamMember: true },
          { role: 'admin' },
          { email: { $in: SUPER_ADMIN_EMAILS } },
        ],
      },
      '-password'
    )
      .sort({ createdAt: -1 })
      .lean();

    const { isRootSuperAdminEmail } = await import('../../../../lib/auth-helpers');

    const formatted = teamMembers.map((m: any) => {
      const isSuper = isSuperAdminEmail(m.email);
      const isRoot = isRootSuperAdminEmail(m.email);
      return {
        id: m._id.toString(),
        name: m.name,
        email: m.email || '',
        phone: m.phone || '',
        department: isSuper ? (isRoot ? 'Executive (Root Super Admin)' : 'Executive (Super Admin)') : (m.department || 'Operations'),
        role: m.role || 'admin',
        isSuperAdmin: isSuper,
        isRootSuperAdmin: isRoot,
        isTeamMember: Boolean(m.isTeamMember || isSuper),
        teamStatus: m.teamStatus || 'active',
        permissions: isSuper
          ? {
              manageCourses: true,
              manageTraining: true,
              manageCareers: true,
              viewAnalytics: true,
              manageCertificates: true,
              manageTeam: true,
            }
          : {
              manageCourses: Boolean(m.permissions?.manageCourses),
              manageTraining: Boolean(m.permissions?.manageTraining),
              manageCareers: Boolean(m.permissions?.manageCareers),
              viewAnalytics: Boolean(m.permissions?.viewAnalytics),
              manageCertificates: Boolean(m.permissions?.manageCertificates),
              manageTeam: false,
            },
        avatar: m.avatar || '',
        createdAt: m.createdAt,
      };
    });

    const metrics = {
      total: formatted.length,
      active: formatted.filter((m: any) => m.teamStatus === 'active').length,
      suspended: formatted.filter((m: any) => m.teamStatus === 'suspended').length,
      hrCount: formatted.filter((m: any) => (m.department || '').toLowerCase().includes('hr')).length,
      salesCount: formatted.filter((m: any) => (m.department || '').toLowerCase().includes('sales')).length,
      contentCount: formatted.filter((m: any) => (m.department || '').toLowerCase().includes('content')).length,
    };

    return NextResponse.json({
      success: true,
      teamMembers: formatted,
      metrics,
    });
  } catch (error: any) {
    console.error('[Admin Team GET Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST: Add a new team member with department & permissions (Super Admin Only)
export async function POST(req: Request) {
  try {
    const authResult = await authenticateSuperAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { name, email, phone, password, department, permissions, teamStatus } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Full name, email address, and temporary password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must contain at least 6 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists in the system' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Normalize department & permissions
    const memberDepartment = department || 'General Team';
    const memberPermissions = {
      manageCourses: Boolean(permissions?.manageCourses),
      manageTraining: Boolean(permissions?.manageTraining),
      manageCareers: Boolean(permissions?.manageCareers),
      viewAnalytics: Boolean(permissions?.viewAnalytics),
      manageCertificates: Boolean(permissions?.manageCertificates),
      manageTeam: false, // Team management can never be granted to regular team members
    };

    const newMember: any = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      password: hashedPassword,
      role: 'admin',
      isTeamMember: true,
      department: memberDepartment,
      permissions: memberPermissions,
      teamStatus: teamStatus === 'suspended' ? 'suspended' : 'active',
      isVerified: true,
      authProvider: 'local',
    });

    return NextResponse.json(
      {
        success: true,
        message: `Team member "${newMember.name}" successfully added to the ${memberDepartment} department!`,
        member: {
          id: newMember._id.toString(),
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone,
          department: newMember.department,
          permissions: newMember.permissions,
          teamStatus: newMember.teamStatus,
          role: newMember.role,
          createdAt: newMember.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin Team POST Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create team member' },
      { status: 500 }
    );
  }
}

// PUT: Update team member permissions, department, status, or password (Super Admin Only)
export async function PUT(req: Request) {
  try {
    const authResult = await authenticateSuperAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const { id, name, phone, department, permissions, teamStatus, password } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Member ID is required for updating' }, { status: 400 });
    }

    const member = await User.findById(id);
    if (!member) {
      return NextResponse.json({ success: false, message: 'Team member record not found' }, { status: 404 });
    }

    // Safety guard: Protect primary super admin accounts from modification
    // Safety guard: Protect root super admin account (aryar0779@gmail.com) from suspension
    const { isRootSuperAdminEmail } = await import('../../../../lib/auth-helpers');
    const isRoot = isRootSuperAdminEmail(member.email);
    if (isRoot && teamStatus === 'suspended') {
      return NextResponse.json(
        { success: false, message: 'Root Super Administrator account (aryar0779@gmail.com) cannot be suspended.' },
        { status: 400 }
      );
    }

    const updateFields: any = { isTeamMember: true };

    if (name) updateFields.name = name.trim();
    if (phone !== undefined) updateFields.phone = phone.trim() || undefined;
    if (department && !isRoot) updateFields.department = department;
    if (teamStatus && !isRoot) updateFields.teamStatus = teamStatus;

    if (permissions && !isRoot) {
      updateFields.permissions = {
        manageCourses: Boolean(permissions.manageCourses),
        manageTraining: Boolean(permissions.manageTraining),
        manageCareers: Boolean(permissions.manageCareers),
        viewAnalytics: Boolean(permissions.viewAnalytics),
        manageCertificates: Boolean(permissions.manageCertificates),
        manageTeam: false,
      };
    }

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password.trim(), salt);
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    return NextResponse.json({
      success: true,
      message: `Account status updated successfully to "${updated?.teamStatus || teamStatus}"!`,
      member: {
        id: updated?._id?.toString() || member._id.toString(),
        name: updated?.name || member.name,
        email: updated?.email || member.email,
        phone: updated?.phone || member.phone,
        department: updated?.department || member.department,
        permissions: updated?.permissions || member.permissions,
        teamStatus: updated?.teamStatus || teamStatus || 'active',
        role: updated?.role || member.role,
        updatedAt: updated?.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[Admin Team PUT Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE: Remove team member or other super admin (Super Admin Only)
export async function DELETE(req: Request) {
  try {
    const authResult = await authenticateSuperAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Member ID is required' }, { status: 400 });
    }

    const member = await User.findById(id);
    if (!member) {
      return NextResponse.json({ success: false, message: 'Team member record not found' }, { status: 404 });
    }

    const { requester } = authResult;

    // Self-deletion guard: A super admin cannot delete themselves
    if (requester._id.toString() === member._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Action Blocked: You cannot delete your own active administrator account.',
        },
        { status: 400 }
      );
    }

    // STRICT IMMUTABILITY GUARD: The root Super Admin (aryar0779@gmail.com) can NEVER be deleted by anyone!
    const { isRootSuperAdminEmail } = await import('../../../../lib/auth-helpers');
    if (isRootSuperAdminEmail(member.email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Security Alert: The root Super Administrator account (aryar0779@gmail.com) is permanently protected and cannot be deleted.',
        },
        { status: 400 }
      );
    }

    // All other super admins and staff members CAN be deleted
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Account "${member.name}" (${member.email}) removed successfully.`,
    });
  } catch (error: any) {
    console.error('[Admin Team DELETE Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete team member' },
      { status: 500 }
    );
  }
}
