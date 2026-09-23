import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function DELETE(
  req: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    const res = await fetch(`${BACKEND}/api/crm/team/${params.agentId}`, {
      method: 'DELETE',
      headers: { Cookie: req.headers.get('cookie') || '' },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/api/crm/team/${params.agentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: req.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
