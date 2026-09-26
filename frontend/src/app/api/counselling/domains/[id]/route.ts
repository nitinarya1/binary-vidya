import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { CounsellingDomain } from '../../../../../lib/models';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

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
 * PUT /api/counselling/domains/[id]
 * Updates a domain (name, description, order, isActive).
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, description, order, isActive } = body;

    const domain = await CounsellingDomain.findById(id);
    if (!domain) {
      return NextResponse.json(
        { success: false, message: 'Domain not found.' },
        { status: 404 }
      );
    }

    if (name && name.trim()) {
      domain.name = name.trim();
      domain.slug = slugify(name.trim());
    }
    if (typeof description === 'string') {
      domain.description = description.trim();
    }
    if (typeof order === 'number') {
      domain.order = order;
    }
    if (typeof isActive === 'boolean') {
      domain.isActive = isActive;
    }

    await domain.save();

    return NextResponse.json({
      success: true,
      message: 'Domain updated successfully.',
      domain: {
        id: domain._id.toString(),
        name: domain.name,
        slug: domain.slug,
        description: domain.description,
        order: domain.order,
        isActive: domain.isActive,
      },
    });
  } catch (err: any) {
    console.error('[PUT /api/counselling/domains/[id] Error]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update domain.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/counselling/domains/[id]
 * Deletes a domain.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const deleted = await CounsellingDomain.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Domain not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully.',
    });
  } catch (err: any) {
    console.error('[DELETE /api/counselling/domains/[id] Error]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to delete domain.' },
      { status: 500 }
    );
  }
}
