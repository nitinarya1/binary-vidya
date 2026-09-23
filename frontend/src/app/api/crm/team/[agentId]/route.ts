import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db';
import { User } from '../../../../../lib/models';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function DELETE(
  req: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    await connectDB();
    await User.findByIdAndUpdate(params.agentId, {
      $set: { isTeamMember: false, teamStatus: 'suspended' },
    });
    return NextResponse.json({ success: true, message: 'Agent removed from sales team.' });
  } catch (dbErr) {
    console.warn('[CRM Team DELETE Direct DB failed, proxying to backend]:', dbErr);
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
}

export async function PATCH(
  req: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    const body = await req.json();
    const { team, department } = body;
    const chosenTeam = team || department;

    if (!chosenTeam) {
      return NextResponse.json({ success: false, message: 'Team is required.' }, { status: 400 });
    }

    await connectDB();
    const updated = await User.findByIdAndUpdate(
      params.agentId,
      { $set: { department: chosenTeam, salesTeam: chosenTeam } },
      { new: true }
    ).select('name email phone department salesTeam teamStatus role');

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Agent not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, agent: updated, message: `Team updated to ${chosenTeam}.` });
  } catch (dbErr) {
    console.warn('[CRM Team PATCH Direct DB failed, proxying to backend]:', dbErr);
    try {
      const body = await req.json().catch(() => ({}));
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
}
