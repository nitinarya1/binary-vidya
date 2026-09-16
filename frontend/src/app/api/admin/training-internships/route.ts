import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User, TrainingInternship } from '../../../../lib/models';

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
  const requester = await User.findById(decoded.id);
  if (!requester) {
    return { error: 'Administrator account not found', status: 404 };
  }

  const { isSuperAdminEmail } = await import('../../../../lib/auth-helpers');
  if (!isSuperAdminEmail(requester.email)) {
    return { error: 'Access denied: Super Administrator access only', status: 403 };
  }

  return { requester };
}

// Initial curated starter training & internship programs
const INITIAL_PROGRAMS = [
  {
    title: 'Full Stack Web Engineering Summer Internship 2026',
    slug: 'full-stack-web-engineering-summer-internship-2026',
    domain: 'MERN Stack & Next.js',
    type: 'internship',
    duration: '3 Months',
    mode: 'remote',
    stipendOrFee: 'Stipend: ₹12,000 - ₹18,000 / month',
    eligibility: 'B.Tech / BE / BCA / MCA (2025 - 2027 Batches)',
    perks: [
      'Official Internship Certificate',
      'Letter of Recommendation (LOR)',
      'Pre-Placement Offer (PPO) Opportunity',
      'Direct Mentorship from Senior SDEs',
      'Live Production Project Experience',
    ],
    deadline: 'April 30, 2026',
    status: 'open',
    applicantsCount: 74,
  },
  {
    title: 'Industrial AI & Machine Learning Research Fellowship',
    slug: 'industrial-ai-machine-learning-research-fellowship',
    domain: 'Applied AI & Deep Learning',
    type: 'internship',
    duration: '6 Months',
    mode: 'hybrid',
    stipendOrFee: 'Stipend: ₹15,000 - ₹25,000 / month',
    eligibility: 'Passionate coders with Python, PyTorch or Mathematics background',
    perks: [
      'Research Co-Authorship Opportunities',
      'Sponsored Cloud GPU Compute (NVIDIA A100)',
      'Verified Fellowship Credential',
      'Industry Networking with AI Startups',
    ],
    deadline: 'May 15, 2026',
    status: 'open',
    applicantsCount: 62,
  },
  {
    title: 'DevOps & Cloud Native Industrial Training Program',
    slug: 'devops-cloud-native-industrial-training-program',
    domain: 'DevOps & Site Reliability',
    type: 'training',
    duration: '8 Weeks',
    mode: 'remote',
    stipendOrFee: 'Training with Live AWS Cloud Lab Included',
    eligibility: 'Open to all Computer Science & Engineering Students',
    perks: [
      'Industrial Project Certificate',
      'Docker & Kubernetes Portfolio Architecture',
      'Interview Preparation & Resume Review',
      '100% Placement Assistance',
    ],
    deadline: 'Rolling Admissions',
    status: 'open',
    applicantsCount: 110,
  },
  {
    title: 'Cybersecurity & Ethical Hacking Hands-on Bootcamp',
    slug: 'cybersecurity-ethical-hacking-bootcamp',
    domain: 'Information Security & VAPT',
    type: 'bootcamp',
    duration: '6 Weeks',
    mode: 'remote',
    stipendOrFee: 'Includes Certified Ethical Hacker (CEH) Exam prep',
    eligibility: 'Foundational networking knowledge recommended',
    perks: [
      'Hands-on Capture The Flag (CTF) challenges',
      'Penetration Testing Toolkit Training',
      'Verified Cybersecurity Specialist Badge',
    ],
    deadline: 'May 1, 2026',
    status: 'open',
    applicantsCount: 45,
  },
];

// GET: Fetch all training & internship programs
export async function GET(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const count = await TrainingInternship.countDocuments();
    if (count === 0) {
      await TrainingInternship.insertMany(INITIAL_PROGRAMS);
    }

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
        slug: p.slug,
        domain: p.domain,
        type: p.type,
        duration: p.duration,
        mode: p.mode,
        stipendOrFee: p.stipendOrFee,
        eligibility: p.eligibility,
        perks: p.perks || [],
        deadline: p.deadline || 'Open',
        status: p.status,
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
    const { title, domain, type, duration, mode, stipendOrFee, eligibility, perks, deadline, status } = body;

    if (!title || !domain) {
      return NextResponse.json({ success: false, message: 'Title and domain are required' }, { status: 400 });
    }

    const slug = (body.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const newProgram = await TrainingInternship.create({
      title: title.trim(),
      slug,
      domain: domain.trim(),
      type: type || 'internship',
      duration: duration || '3 Months',
      mode: mode || 'remote',
      stipendOrFee: stipendOrFee || 'Stipend provided',
      eligibility: eligibility || 'Graduating students',
      perks: Array.isArray(perks) ? perks : typeof perks === 'string' ? perks.split(',').map((p: string) => p.trim()).filter(Boolean) : [],
      deadline: deadline || 'Rolling Basis',
      status: status || 'open',
      applicantsCount: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Program created successfully!',
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
      updates.perks = updates.perks.split(',').map((p: string) => p.trim()).filter(Boolean);
    }

    const updated = await TrainingInternship.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Program updated successfully',
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
      message: 'Program deleted successfully',
    });
  } catch (error: any) {
    console.error('[Admin Training DELETE Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete program' }, { status: 500 });
  }
}
