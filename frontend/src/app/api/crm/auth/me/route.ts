import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

function forwardCookie(req: Request) {
  return req.headers.get('cookie') || '';
}

function getCookieValue(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function GET(req: Request) {
  const cookieStr = forwardCookie(req);
  const token = getCookieValue(cookieStr, 'crm_token');

  // Try fast local JWT verification first if token exists
  if (token) {
    try {
      const jwt = (await import('jsonwebtoken')).default;
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.id) {
        return NextResponse.json({
          success: true,
          user: decoded,
        });
      }
    } catch {}
  }

  try {
    const res = await fetch(`${BACKEND}/api/crm/auth/me`, {
      headers: { Cookie: cookieStr },
      credentials: 'include',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const response = NextResponse.json({ success: true, message: 'Logged out.' });
  response.cookies.delete('crm_token');

  // Also call backend logout
  try {
    await fetch(`${BACKEND}/api/crm/auth/logout`, {
      method: 'POST',
      headers: { Cookie: forwardCookie(req) },
      credentials: 'include',
    });
  } catch {}

  return response;
}
