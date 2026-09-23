import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/** Proxy CRM send-otp request to backend */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cookieHeader = req.headers.get('cookie') || '';

    const res = await fetch(`${BACKEND}/api/crm/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to send verification code.' }, { status: 500 });
  }
}
