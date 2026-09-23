import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function forwardCookie(req: Request) {
  return req.headers.get('cookie') || '';
}

export async function GET(req: Request) {
  try {
    const res = await fetch(`${BACKEND}/api/crm/auth/me`, {
      headers: { Cookie: forwardCookie(req) },
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
