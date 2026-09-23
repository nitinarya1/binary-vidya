import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function extractUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (e) {}
  }
  return null;
}

// GET /api/auth/profile - Fetch profile + student stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const decoded = extractUser(req);
    const emailParam = searchParams.get('email');
    const userEmail = (decoded?.email || emailParam || '').toLowerCase().trim();
    const userId = decoded?.id;

    if (!userEmail && !userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = userId ? await User.findById(userId).lean() : await User.findOne({ email: userEmail }).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Fetch enrolled stats safely
    const effectiveEmail = user.email || userEmail;
    let enrolledCount = 0;
    let certificatesCount = 0;
    try {
      const EnrollmentModel =
        mongoose.models.Enrollment ||
        mongoose.model('Enrollment', new mongoose.Schema({ userEmail: String }, { strict: false }));
      enrolledCount = await EnrollmentModel.countDocuments({ userEmail: effectiveEmail });
    } catch (e) {}

    try {
      const CertificateModel =
        mongoose.models.Certificate ||
        mongoose.model('Certificate', new mongoose.Schema({ userEmail: String }, { strict: false }));
      certificatesCount = await CertificateModel.countDocuments({ userEmail: effectiveEmail });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      user: {
        id: (user as any)._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        dateOfBirth: (user as any).dateOfBirth || '',
        gender: (user as any).gender || '',
        role: user.role,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
      stats: {
        enrolledCount,
        certificatesCount,
      },
    });
  } catch (error: any) {
    console.error('[API Profile GET Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT / POST /api/auth/profile - Update profile details
export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  try {
    const body = await req.json();
    const decoded = extractUser(req);
    const userEmail = (decoded?.email || body.email || body.userEmail || '').toLowerCase().trim();
    const userId = decoded?.id || body.userId;

    if (!userEmail && !userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to update profile' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = userId ? await User.findById(userId) : await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const { name, dateOfBirth, gender, avatar, phone } = body;
    const updateFields: any = {};
    const unsetFields: any = {};

    if (name && typeof name === 'string' && name.trim()) {
      updateFields.name = name.trim();
    }
    if (dateOfBirth !== undefined) {
      updateFields.dateOfBirth = (dateOfBirth || '').toString().trim();
    }
    if (gender !== undefined) {
      const g = (gender || '').toString().toLowerCase().trim();
      updateFields.gender = ['male', 'female', 'other', 'prefer-not-to-say'].includes(g) ? g : '';
    }
    if (avatar !== undefined) {
      updateFields.avatar = (avatar || '').toString().trim();
    }
    if (phone !== undefined) {
      const trimmedPhone = phone ? phone.trim() : '';
      if (trimmedPhone && trimmedPhone !== user.phone) {
        const existingWithPhone = await User.findOne({ phone: trimmedPhone, _id: { $ne: user._id } });
        if (existingWithPhone) {
          return NextResponse.json(
            { success: false, message: 'This mobile number is already linked to another account.' },
            { status: 400 }
          );
        }
        updateFields.phone = trimmedPhone;
      } else if (!trimmedPhone) {
        // IMPORTANT: In MongoDB sparse indexes, an empty string `""` is treated as a duplicate key!
        // We must $unset the phone property when empty so it does NOT conflict with the unique index.
        unsetFields.phone = 1;
      }
    }

    const updateQuery: any = {};
    if (Object.keys(updateFields).length > 0) {
      updateQuery.$set = updateFields;
    }
    if (Object.keys(unsetFields).length > 0) {
      updateQuery.$unset = unsetFields;
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateQuery,
      { new: true, strict: false }
    ).lean();

    // Also forward to backend if running to keep 100% in-sync
    try {
      const authHeader = req.headers.get('authorization');
      const headers: any = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;
      fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          email: user.email,
          ...updateFields,
        }),
      }).catch(() => {});
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: (updatedUser as any)?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        phone: updatedUser?.phone || '',
        avatar: (updatedUser as any)?.avatar || '',
        dateOfBirth: (updatedUser as any)?.dateOfBirth || '',
        gender: (updatedUser as any)?.gender || '',
        role: updatedUser?.role,
        authProvider: updatedUser?.authProvider,
      },
    });
  } catch (error: any) {
    console.error('[API Profile Update Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
