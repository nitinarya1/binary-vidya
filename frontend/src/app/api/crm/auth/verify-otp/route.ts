import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/** Proxy CRM verify-otp request to backend, forwarding crm_token cookie */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cookieHeader = req.headers.get('cookie') || '';

    const res = await fetch(`${BACKEND}/api/crm/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });

    // Forward Set-Cookie (crm_token) from backend
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      response.headers.set('Set-Cookie', setCookie);
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'OTP verification failed.' }, { status: 500 });
  }
}
