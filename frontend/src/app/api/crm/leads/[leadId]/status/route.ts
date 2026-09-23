import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function buildHeaders(req: Request) {
  return {
    'Content-Type': 'application/json',
    Cookie: req.headers.get('cookie') || '',
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/api/crm/leads/${params.leadId}/status`, {
      method: 'PATCH',
      headers: buildHeaders(req),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
