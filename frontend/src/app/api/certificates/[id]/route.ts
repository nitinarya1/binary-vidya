import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function GET(
  req: NextRequest,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Certificate ID is required' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/certificates/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Cert Proxy GET Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}
