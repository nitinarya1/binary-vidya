import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { CounsellingDomain, User } from '../../../../lib/models';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

const DEFAULT_DOMAINS = [
  'Full Stack Development',
  'Data Science',
  'Data Analytics',
  'App Development',
  'Cyber Security',
  'Cloud / DevOps',
  'AI / ML',
  'Web Development',
  'Generative AI & LLM',
  'Prompt Engineering',
];

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function verifyAuth(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const crmMatch = cookieHeader.match(/(?:^|;\s*)crm_token=([^;]*)/);
  const userMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const rawToken = (crmMatch ? decodeURIComponent(crmMatch[1]) : null) ||
                   (userMatch ? decodeURIComponent(userMatch[1]) : null) ||
                   bearerToken;

  if (!rawToken) return null;

  try {
    const decoded: any = jwt.verify(rawToken, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

/**
 * GET /api/counselling/domains
 * Publicly fetches all active domains (or all domains if admin param is set).
 * Auto-seeds default domains if collection is empty.
 */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const includeAll = searchParams.get('all') === 'true';

    // Check count and seed if empty
    const count = await CounsellingDomain.countDocuments();
    if (count === 0) {
      const seedData = DEFAULT_DOMAINS.map((name, index) => ({
        name,
        slug: slugify(name),
        order: (index + 1) * 10,
        isActive: true,
        createdBy: 'system_seed',
      }));
      await CounsellingDomain.insertMany(seedData);
    }

    const query = includeAll ? {} : { isActive: true };
    const domains = await CounsellingDomain.find(query).sort({ order: 1, createdAt: 1 }).lean();

    return NextResponse.json({
      success: true,
      domains: domains.map((d: any) => ({
        id: d._id.toString(),
        name: d.name,
        slug: d.slug,
        description: d.description || '',
        order: d.order || 0,
        isActive: d.isActive !== false,
        createdAt: d.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('[GET /api/counselling/domains Error]:', err);
    // Fallback gracefully so public form never fails
    return NextResponse.json({
      success: true,
      domains: DEFAULT_DOMAINS.map((name, idx) => ({
        id: `default-${idx}`,
        name,
        slug: slugify(name),
        description: '',
        order: (idx + 1) * 10,
        isActive: true,
      })),
      fallback: true,
    });
  }
}

/**
 * POST /api/counselling/domains
 * Allows Lead Generation team, CRM Agents, CRM Admin, and Super Admin to add new domains.
 */
export async function POST(req: Request) {
  try {
    await connectDB();

    // Verify authorized user
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to manage domains.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, order, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Domain name is required.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const slug = slugify(trimmedName);

    // Check duplicate
    const existing = await CounsellingDomain.findOne({
      $or: [{ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } }, { slug }],
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A domain with this name already exists.' },
        { status: 400 }
      );
    }

    const newDomain = await CounsellingDomain.create({
      name: trimmedName,
      slug,
      description: description?.trim() || '',
      order: typeof order === 'number' ? order : 100,
      isActive: isActive !== false,
      createdBy: authUser.name || authUser.email || authUser.id || 'agent',
    });

    return NextResponse.json({
      success: true,
      message: 'Counselling domain created successfully.',
      domain: {
        id: newDomain._id.toString(),
        name: newDomain.name,
        slug: newDomain.slug,
        description: newDomain.description,
        order: newDomain.order,
        isActive: newDomain.isActive,
      },
    });
  } catch (err: any) {
    console.error('[POST /api/counselling/domains Error]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to create domain.' },
      { status: 500 }
    );
  }
}
