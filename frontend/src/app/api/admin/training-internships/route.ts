import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User, TrainingInternship } from '../../../../lib/models';
import { FRONTEND_INTERNSHIP_PROGRAM } from '../../../../lib/trainingProgramData';

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
  const hasTrainingPerm = requester.isTeamMember && requester.teamStatus !== 'suspended' && requester.permissions?.manageTraining;

  if (!isSuper && !hasTrainingPerm) {
    return { error: 'Access denied: Super Administrator or Training Management permission required', status: 403 };
  }

  return { requester };
}



// GET: Fetch all training & internship programs
export async function GET(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { track: { $regex: search, $options: 'i' } },
        { eligibility: { $regex: search, $options: 'i' } },
      ];
    }

    const programs = await TrainingInternship.find(query).sort({ createdAt: -1 }).lean();

    const totalPrograms = await TrainingInternship.countDocuments();
    const activeInternships = await TrainingInternship.countDocuments({ type: 'internship', status: 'open' });
    const activeTrainings = await TrainingInternship.countDocuments({ type: 'training', status: 'open' });
    const totalApplicants = (await TrainingInternship.aggregate([{ $group: { _id: null, total: { $sum: '$applicantsCount' } } }]))[0]?.total || 0;

    return NextResponse.json({
      success: true,
      programs: programs.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        subtitle: p.subtitle || '',
        thumbnail: p.thumbnail || '',
        slug: p.slug,
        domain: p.domain || p.track || 'Web Development',
        track: p.track || p.domain || 'Frontend Developer',
        type: p.type || 'internship',
        duration: p.duration || '2 Months Internship + Training',
        mode: p.mode || 'Live Online • Weekend Classes',
        stipendOrFee: p.stipendOrFee || `₹${p.trainingPrice || 2400} Tuition • Free Internship`,
        trainingPrice: p.trainingPrice !== undefined ? p.trainingPrice : 2400,
        originalPrice: p.originalPrice !== undefined ? p.originalPrice : 7999,
        internshipPrice: p.internshipPrice !== undefined ? p.internshipPrice : 0,
        schedule: p.schedule || {
          badge: 'Weekend Live Batches',
          days: 'Every Saturday & Sunday',
          timings: 'Live Interactive Sessions + 24/7 Session Recordings',
          flexibility: 'Specially crafted for College Students & Working Professionals',
        },
        durations: p.durations || {
          total: p.duration || '2 Months Internship + Training',
          trainingWeeks: '4 Weeks Intensive Live Training',
          internshipWeeks: '2 Months Hands-on Industrial Internship',
        },
        sections: p.sections || [],
        credentials: p.credentials || [],
        eligibility: p.eligibility || 'College Students & Working Professionals',
        perks: p.perks || [],
        deadline: p.deadline || 'Rolling Admissions',
        status: p.status || 'open',
        applicantsCount: p.applicantsCount || 0,
        createdAt: p.createdAt,
      })),
      metrics: {
        totalPrograms,
        activeInternships,
        activeTrainings,
        totalApplicants,
      },
    });
  } catch (error: any) {
    console.error('[Admin Training GET Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch programs' }, { status: 500 });
  }
}

// POST: Create a new program
export async function POST(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await req.json();
    const {
      title,
      subtitle,
      thumbnail,
      domain,
      track,
      type,
      duration,
      mode,
      stipendOrFee,
      trainingPrice,
      originalPrice,
      internshipPrice,
      schedule,
      durations,
      sections,
      credentials,
      eligibility,
      perks,
      deadline,
      status,
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, message: 'Internship title is required' }, { status: 400 });
    }

    const effectiveDomain = (domain || track || title || 'Engineering').trim();
    const effectiveDescription = (body.description || subtitle || '').trim();

    const slug = (body.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const formattedPerks = Array.isArray(perks)
      ? perks
      : typeof perks === 'string'
      ? perks.split('\n').map((p: string) => p.trim()).filter(Boolean)
      : [];

    const newProgram = await TrainingInternship.create({
      title: title.trim(),
      description: effectiveDescription,
      subtitle: subtitle ? subtitle.trim() : effectiveDescription,
      thumbnail: thumbnail ? thumbnail.trim() : '',
      slug,
      domain: effectiveDomain,
      track: track ? track.trim() : effectiveDomain,
      type: type || 'internship',
      duration: duration || '2 Months Internship + Training',
      mode: mode || 'Live Online • Weekend Classes',
      stipendOrFee: stipendOrFee || `₹${trainingPrice || 2400} Tuition • Free Internship`,
      trainingPrice: Number(trainingPrice) || 2400,
      originalPrice: Number(originalPrice) || 7999,
      internshipPrice: Number(internshipPrice) || 0,
      schedule: schedule || {
        badge: 'Weekend Live Batches',
        days: 'Every Saturday & Sunday',
        timings: 'Live Interactive Sessions + 24/7 Session Recordings',
        flexibility: 'Specially crafted for College Students & Working Professionals',
      },
      durations: durations || {
        total: duration || '2 Months Internship + Training',
        trainingWeeks: '4 Weeks Intensive Live Training',
        internshipWeeks: '2 Months Hands-on Industrial Internship',
      },
      sections: sections || [],
      credentials: credentials || [],
      eligibility: eligibility || 'College Students, Freshers & Working Professionals',
      perks: formattedPerks,
      deadline: deadline || 'Rolling Admissions',
      status: status || 'open',
      applicantsCount: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Training & Internship program created successfully!',
      program: newProgram,
    });
  } catch (error: any) {
    console.error('[Admin Training POST Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create program' }, { status: 500 });
  }
}

// PUT: Update a program
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
      return NextResponse.json({ success: false, message: 'Program ID required for update' }, { status: 400 });
    }

    if (updates.perks && typeof updates.perks === 'string') {
      updates.perks = updates.perks.split('\n').map((p: string) => p.trim()).filter(Boolean);
    }

    if (updates.trainingPrice !== undefined) updates.trainingPrice = Number(updates.trainingPrice);
    if (updates.originalPrice !== undefined) updates.originalPrice = Number(updates.originalPrice);
    if (updates.internshipPrice !== undefined) updates.internshipPrice = Number(updates.internshipPrice);

    const updated = await TrainingInternship.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Training & Internship program updated successfully',
      program: updated,
    });
  } catch (error: any) {
    console.error('[Admin Training PUT Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update program' }, { status: 500 });
  }
}

// DELETE: Delete a program
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
      return NextResponse.json({ success: false, message: 'Program ID parameter is required' }, { status: 400 });
    }

    const deleted = await TrainingInternship.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Training & Internship program deleted successfully',
    });
  } catch (error: any) {
    console.error('[Admin Training DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete program' }, { status: 500 });
  }
}
