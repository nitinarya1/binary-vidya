import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function PUT(req: Request, { params }: { params: { leadId: string } }) {
  try {
    const { leadId } = params;
    const body = await req.json();
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';

    const res = await fetch(`${BACKEND}/api/crm/leads/${leadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { leadId: string } }) {
  try {
    const { leadId } = params;
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';

    const res = await fetch(`${BACKEND}/api/crm/leads/${leadId}`, {
      method: 'DELETE',
      headers: {
        Cookie: cookieHeader,
        Authorization: authHeader,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to delete lead' }, { status: 500 });
  }
}
