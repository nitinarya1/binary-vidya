import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${backendUrl}/api/training-internship`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (backendErr) {
      console.warn('[Next.js Training Internship API] Express fallback');
    }

    // Fallback static payload if backend server is unreachable
    const { FRONTEND_INTERNSHIP_PROGRAM } = await import('../../../../../backend/src/controllers/training.controller');
    return NextResponse.json({
      success: true,
      program: FRONTEND_INTERNSHIP_PROGRAM,
    });
  } catch (error: any) {
    console.error('[Next.js Training Internship GET Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch training and internship program' },
      { status: 500 }
    );
  }
}
