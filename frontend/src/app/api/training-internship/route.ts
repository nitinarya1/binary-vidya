import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { TrainingInternship } from '../../../lib/models';
import { FRONTEND_INTERNSHIP_PROGRAM } from '../../../../../backend/src/controllers/training.controller';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug') || 'frontend-developer-training-internship';

    try {
      await connectDB();
      const dbProgram = await TrainingInternship.findOne({
        $or: [
          { slug },
          { track: /Frontend/i },
          { title: /Frontend/i }
        ],
        status: { $ne: 'closed' }
      }).lean();

      if (dbProgram) {
        const p = dbProgram as any;
        const formattedProgram = {
          id: p._id?.toString() || p.slug || slug,
          slug: p.slug || slug,
          title: p.title || FRONTEND_INTERNSHIP_PROGRAM.title,
          subtitle: p.subtitle || FRONTEND_INTERNSHIP_PROGRAM.subtitle,
          track: p.track || FRONTEND_INTERNSHIP_PROGRAM.track,
          mode: p.mode || FRONTEND_INTERNSHIP_PROGRAM.mode,
          schedule: p.schedule || FRONTEND_INTERNSHIP_PROGRAM.schedule,
          duration: p.durations || {
            total: p.duration || FRONTEND_INTERNSHIP_PROGRAM.duration.total,
            trainingWeeks: FRONTEND_INTERNSHIP_PROGRAM.duration.trainingWeeks,
            internshipWeeks: FRONTEND_INTERNSHIP_PROGRAM.duration.internshipWeeks,
          },
          pricing: {
            trainingPrice: p.trainingPrice !== undefined ? p.trainingPrice : FRONTEND_INTERNSHIP_PROGRAM.pricing.trainingPrice,
            originalPrice: p.originalPrice !== undefined ? p.originalPrice : FRONTEND_INTERNSHIP_PROGRAM.pricing.originalPrice,
            discountPercentage: Math.round(
              (1 - ((p.trainingPrice !== undefined ? p.trainingPrice : 2400) / (p.originalPrice || 7999))) * 100
            ) || FRONTEND_INTERNSHIP_PROGRAM.pricing.discountPercentage,
            internshipPrice: p.internshipPrice !== undefined ? p.internshipPrice : 0,
            internshipStatusText: (p.internshipPrice === 0 || p.internshipPrice === undefined)
              ? '100% Free of Cost (Bundled with Training)'
              : `₹${p.internshipPrice}`,
            currency: 'INR',
            currencySymbol: '₹',
          },
          sections: p.sections && p.sections.length > 0
            ? p.sections
            : FRONTEND_INTERNSHIP_PROGRAM.sections,
          credentials: p.credentials && p.credentials.length > 0
            ? p.credentials
            : FRONTEND_INTERNSHIP_PROGRAM.credentials,
          highlights: p.perks && p.perks.length > 0
            ? p.perks
            : FRONTEND_INTERNSHIP_PROGRAM.highlights,
        };

        return NextResponse.json({
          success: true,
          program: formattedProgram,
        });
      }
    } catch (dbErr) {
      console.warn('[Next.js Training Internship API] MongoDB query error, falling back:', dbErr);
    }

    // Fallback to Express backend if running
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
      // ignore
    }

    // Fallback static payload if backend server or DB is unreachable
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
