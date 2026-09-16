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

// Initial curated starter careers / job openings
const INITIAL_CAREERS = [
  {
    title: 'Senior Full Stack Engineering Instructor & Mentor',
    slug: 'senior-full-stack-engineering-instructor-mentor',
    department: 'Curriculum & Instruction',
    employmentType: 'full-time',
    location: 'Remote / Bangalore',
    experience: '3-6 Years',
    salary: '₹14,00,000 - ₹22,00,000 PA',
    description: 'Lead high-impact live cohorts, architect modern MERN & Next.js curriculum, conduct interactive code reviews, and mentor future software engineers.',
    requirements: [
      'Strong expertise in TypeScript, React, Next.js, Node.js, and MongoDB/PostgreSQL',
      'Prior experience teaching, mentoring, or conducting technical workshops',
      'Excellent communication and empathetic leadership skills',
      'Passion for developer education and hands-on project building',
    ],
    responsibilities: [
      'Deliver interactive live coding masterclasses and workshops',
      'Design capstone projects, coding challenges, and automated test suites',
      'Provide regular code reviews and technical feedback to learners',
    ],
    deadline: 'May 30, 2026',
    status: 'active',
    applicantsCount: 38,
  },
  {
    title: 'AI & Data Science Curriculum Lead',
    slug: 'ai-data-science-curriculum-lead',
    department: 'Curriculum & Instruction',
    employmentType: 'full-time',
    location: 'Remote (India)',
    experience: '4-8 Years',
    salary: '₹18,00,000 - ₹28,00,000 PA',
    description: 'Design world-class AI/ML programs covering deep learning, LLMs, fine-tuning, and RAG architectures for Binary Vidya students.',
    requirements: [
      'Deep hands-on experience with Python, PyTorch, LangChain, and Vector Databases',
      'Track record in machine learning systems or AI product development',
      'Strong pedagogy background or technical content creation experience',
    ],
    responsibilities: [
      'Author hands-on AI project tutorials and cloud compute labs',
      'Collaborate with industry partner tech companies on real-world datasets',
      'Evaluate student submissions and guide capstone models',
    ],
    deadline: 'June 15, 2026',
    status: 'active',
    applicantsCount: 29,
  },
  {
    title: 'Lead Platform Fullstack Developer',
    slug: 'lead-platform-fullstack-developer',
    department: 'Engineering',
    employmentType: 'full-time',
    location: 'Remote (India)',
    experience: '3-5 Years',
    salary: '₹16,00,000 - ₹24,00,000 PA + Equity',
    description: 'Architect and scale the core Binary Vidya learning platform, interactive code sandboxes, real-time quizzes, and administrative consoles.',
    requirements: [
      'Mastery of Next.js 15, React, TailwindCSS/Vanilla CSS, MongoDB, and Redis',
      'Experience building high-performance, real-time web applications',
      'Strong understanding of caching, microservices, and serverless architectures',
    ],
    responsibilities: [
      'Build seamless, high-deliverability interactive learning UI components',
      'Optimize database queries, indexing, and API response latencies',
      'Ensure 99.9% platform uptime and zero-vulnerability security compliance',
    ],
    deadline: 'Open until filled',
    status: 'active',
    applicantsCount: 52,
  },
  {
    title: 'Student Success & Placement Officer',
    slug: 'student-success-placement-officer',
    department: 'Student Operations',
    employmentType: 'full-time',
    location: 'Hybrid / Delhi NCR',
    experience: '2-4 Years',
    salary: '₹8,00,000 - ₹12,00,000 PA + Incentives',
    description: 'Connect Binary Vidya graduates with hiring partners, coordinate corporate recruitment drives, conduct mock behavioral interviews, and track placement metrics.',
    requirements: [
      'Proven background in corporate campus placements or edtech career support',
      'Extensive network with HRs and engineering managers in top tech companies',
      'Strong organizational, relationship-building, and data management skills',
    ],
    responsibilities: [
      'Partner with tech companies to secure exclusive hiring drives for students',
      'Conduct 1-on-1 resume building, LinkedIn optimization, and mock HR rounds',
      'Maintain 100% transparent placement tracking metrics and reports',
    ],
    deadline: 'May 20, 2026',
    status: 'active',
    applicantsCount: 41,
  },
];

// GET: Fetch all career listings
export async function GET(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const count = await Career.countDocuments();
    if (count === 0) {
      await Career.insertMany(INITIAL_CAREERS);
    }

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

    if (!title || !department || !description) {
      return NextResponse.json({ success: false, message: 'Title, department, and description are required' }, { status: 400 });
    }

    const slug = (body.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const newCareer = await Career.create({
      title: title.trim(),
      slug,
      department: department.trim(),
      employmentType: employmentType || 'full-time',
      location: location || 'Remote (India)',
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
