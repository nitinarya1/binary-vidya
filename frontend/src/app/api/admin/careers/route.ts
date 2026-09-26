import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User, Career } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

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
    return { error: 'Invalid or expired session', status: 401 };
  }

  await connectDB();
  const requester: any = await User.findById(decoded.id).lean();
  if (!requester) {
    return { error: 'Administrator account not found', status: 404 };
  }

  const { isSuperAdminEmail } = await import('../../../../lib/auth-helpers');
  const isSuper = isSuperAdminEmail(requester.email) && requester.teamStatus !== 'suspended';
  const hasCareersPerm = requester.isTeamMember && requester.teamStatus !== 'suspended' && requester.permissions?.manageCareers;

  if (!isSuper && !hasCareersPerm) {
    return { error: 'Access denied: Super Administrator or Careers Management permission required', status: 403 };
  }

  return { requester };
}



// GET: Fetch all career listings
export async function GET(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (department && department !== 'all') query.department = department;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const careers = await Career.find(query).sort({ createdAt: -1 }).lean();

    const totalJobs = await Career.countDocuments();
    const activeJobs = await Career.countDocuments({ status: 'active' });
    const closedJobs = await Career.countDocuments({ status: 'closed' });
    const totalApplicants = (await Career.aggregate([{ $group: { _id: null, total: { $sum: '$applicantsCount' } } }]))[0]?.total || 0;

    return NextResponse.json({
      success: true,
      careers: careers.map((c: any) => ({
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        department: c.department,
        employmentType: c.employmentType,
        location: c.location,
        experience: c.experience,
        salary: c.salary,
        description: c.description,
        requirements: c.requirements || [],
        responsibilities: c.responsibilities || [],
        deadline: c.deadline || 'Open',
        status: c.status,
        applicantsCount: c.applicantsCount || 0,
        createdAt: c.createdAt,
      })),
      metrics: {
        totalJobs,
        activeJobs,
        closedJobs,
        totalApplicants,
      },
    });
  } catch (error: any) {
    console.error('[Admin Careers GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch careers' }, { status: 500 });
  }
}

// POST: Create a new job opening
export async function POST(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const { title, department, employmentType, location, experience, salary, description, requirements, responsibilities, deadline, status } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, message: 'Job title and description are required' }, { status: 400 });
    }

    const slug = (body.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const dept = (department && department.trim()) || 'Engineering & Operations';

    const newCareer = await Career.create({
      title: title.trim(),
      slug,
      department: dept,
      employmentType: (employmentType || 'full-time').toLowerCase(),
      location: (location && location.trim()) || 'Remote',
      experience: experience || '1-3 Years',
      salary: salary || 'Competitive',
      description: description.trim(),
      requirements: Array.isArray(requirements) ? requirements : typeof requirements === 'string' ? requirements.split('\n').map((r: string) => r.trim()).filter(Boolean) : [],
      responsibilities: Array.isArray(responsibilities) ? responsibilities : typeof responsibilities === 'string' ? responsibilities.split('\n').map((r: string) => r.trim()).filter(Boolean) : [],
      deadline: deadline || 'Open until filled',
      status: status || 'active',
      applicantsCount: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Career opening posted successfully!',
      career: newCareer,
    });
  } catch (error: any) {
    console.error('[Admin Careers POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create career' }, { status: 500 });
  }
}

// PUT: Update a career opening
export async function PUT(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Career ID required for update' }, { status: 400 });
    }

    if (updates.requirements && typeof updates.requirements === 'string') {
      updates.requirements = updates.requirements.split('\n').map((r: string) => r.trim()).filter(Boolean);
    }
    if (updates.responsibilities && typeof updates.responsibilities === 'string') {
      updates.responsibilities = updates.responsibilities.split('\n').map((r: string) => r.trim()).filter(Boolean);
    }

    const updated = await Career.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Career opening not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Career opening updated successfully',
      career: updated,
    });
  } catch (error: any) {
    console.error('[Admin Careers PUT Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update career' }, { status: 500 });
  }
}

// DELETE: Delete a career opening
export async function DELETE(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Career ID parameter is required' }, { status: 400 });
    }

    const deleted = await Career.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Career opening not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Career opening deleted successfully',
    });
  } catch (error: any) {
    console.error('[Admin Careers DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete career' }, { status: 500 });
  }
}
