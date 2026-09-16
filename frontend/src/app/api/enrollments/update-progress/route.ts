import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const authHeader = req.headers.get('authorization');
    const headers: any = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${BACKEND_URL}/api/enrollments/update-progress`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Progress Proxy Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update lesson progress' },
      { status: 500 }
    );
  }
}
