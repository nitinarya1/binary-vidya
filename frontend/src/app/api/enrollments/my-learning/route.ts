import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    const authHeader = req.headers.get('authorization');
    const headers: any = { 'Content-Type': 'application/json' };
    if (authHeader) headers['authorization'] = authHeader;

    const res = await fetch(`${backendUrl}/api/enrollments/my-learning?${searchParams.toString()}`, {
      headers,
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Next.js My-Learning Proxy Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch enrolled courses', courses: [] },
      { status: 500 }
    );
  }
}
