import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '../../../../lib/db';
import { User } from '../../../../lib/models';
import { sendTeamCredentialsEmail } from '../../../../lib/serverMailer';

export const dynamic = 'force-dynamic';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function buildHeaders(req: Request) {
  return {
    'Content-Type': 'application/json',
    Cookie: req.headers.get('cookie') || '',
  };
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const agents = await User.find({
      $or: [
        { department: { $in: ['CSM', 'BDA', 'Lead Generation', 'Sales', 'sales'] } },
        { salesTeam: { $in: ['CSM', 'BDA', 'Lead Generation'] } },
      ],
      isTeamMember: true,
    })
      .select('name email phone department salesTeam teamStatus isTeamMember role permissions createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, agents });
  } catch (dbErr) {
    console.warn('[CRM Team GET Direct DB failed, proxying to backend]:', dbErr);
    try {
      const res = await fetch(`${BACKEND}/api/crm/team`, { headers: buildHeaders(req) });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, team, department } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    const validTeams = ['BDA', 'Lead Generation', 'CSM'];
    const chosenTeam = validTeams.includes(team)
      ? team
      : department && validTeams.includes(department)
      ? department
      : team || 'BDA';

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    const existing = await User.findOne({ email: normalizedEmail });
    let savedAgent: any;

    if (existing) {
      const updateData: any = {
        isTeamMember: true,
        department: chosenTeam,
        salesTeam: chosenTeam,
        teamStatus: 'active',
      };
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
        updateData.mustChangePassword = true;
      }
      savedAgent = await User.findByIdAndUpdate(existing._id, { $set: updateData }, { new: true });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      savedAgent = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || undefined,
        password: hashedPassword,
        role: 'student',
        authProvider: 'local',
        isVerified: true,
        isTeamMember: true,
        department: chosenTeam,
        salesTeam: chosenTeam,
        teamStatus: 'active',
        mustChangePassword: true,
      });
    }

    // Dispatch professional welcome email with login email, temporary password, and direct sales portal login URL
    const salesLoginUrl = 'https://binaryvidya.vercel.app/sales/login';

    try {
      const emailResult = await sendTeamCredentialsEmail({
        name: savedAgent.name || name.trim(),
        email: savedAgent.email,
        temporaryPassword: password,
        department: chosenTeam,
        team: chosenTeam,
        loginUrl: salesLoginUrl,
      });
      console.log(`[Sales Team Welcome Email Dispatched] To: ${savedAgent.email} (${chosenTeam}) | Success:`, emailResult.success);
    } catch (mailErr) {
      console.error('[Sales Team Welcome Email Error]:', mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: `${savedAgent.name} successfully assigned to ${chosenTeam} sales team. Welcome email sent with login credentials!`,
        agent: {
          _id: savedAgent._id,
          name: savedAgent.name,
          email: savedAgent.email,
          phone: savedAgent.phone,
          department: savedAgent.department,
          salesTeam: savedAgent.salesTeam,
          teamStatus: savedAgent.teamStatus,
          role: savedAgent.role,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[CRM Team POST Error]:', err);
    // Fallback to proxying to backend if DB operation fails
    try {
      const res = await fetch(`${BACKEND}/api/crm/team`, {
        method: 'POST',
        headers: buildHeaders(req),
        body: JSON.stringify(await req.json().catch(() => ({}))),
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (proxyErr: any) {
      return NextResponse.json({ success: false, message: err.message || proxyErr.message }, { status: 500 });
    }
  }
}
