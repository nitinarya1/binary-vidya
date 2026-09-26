import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  const hasPerm =
    requester.isTeamMember &&
    requester.teamStatus !== 'suspended' &&
    (requester.permissions?.manageCourses || requester.permissions?.manageTraining);

  if (!isSuper && !hasPerm) {
    return { error: 'Access denied: Super Admin or Course/Training Management permission required', status: 403 };
  }

  return { requester };
}

export async function POST(req: Request) {
  try {
    const authResult = await authenticateAdmin(req);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'binaryvidya/media';

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dcqgca3p4';
    const apiKey = process.env.CLOUDINARY_API_KEY || '859622467181683';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'v3V44AtCU0JlB-TwyEsAl_fL1gE';

    const fileName = file.name || 'file';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // Determine resource type
    let resourceType: 'video' | 'image' | 'raw' = 'raw';
    if (['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'].includes(ext) || file.type.startsWith('video/')) {
      resourceType = 'video';
    } else if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext) || file.type.startsWith('image/')) {
      resourceType = 'image';
    } else {
      // ppt, pptx, pdf, zip, doc, etc.
      resourceType = 'raw';
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('api_key', apiKey);
    uploadFormData.append('timestamp', timestamp.toString());
    uploadFormData.append('folder', folder);
    uploadFormData.append('signature', signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const cldRes = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadFormData,
    });

    const cldData = await cldRes.json();

    if (!cldRes.ok || cldData.error) {
      console.error('[Cloudinary Upload Error]:', cldData.error);
      return NextResponse.json(
        {
          success: false,
          message: cldData.error?.message || 'Failed to upload media to Cloudinary',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: cldData.secure_url || cldData.url,
      originalFilename: fileName,
      bytes: cldData.bytes,
      resourceType,
      format: cldData.format || ext,
    });
  } catch (error: any) {
    console.error('[Admin Upload Route Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}
