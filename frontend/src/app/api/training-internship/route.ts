import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { TrainingInternship } from '../../../lib/models';
import { FRONTEND_INTERNSHIP_PROGRAM } from '../../../lib/trainingProgramData';

export const dynamic = 'force-dynamic';

function formatSingleProgram(p: any, defaultSlug?: string) {
  const slug = p.slug || defaultSlug || FRONTEND_INTERNSHIP_PROGRAM.slug;
  const trainingPrice = p.trainingPrice !== undefined ? Number(p.trainingPrice) : 2400;
  const originalPrice = p.originalPrice !== undefined ? Number(p.originalPrice) : 7999;
  const internshipPrice = p.internshipPrice !== undefined ? Number(p.internshipPrice) : 0;

  return {
    id: p._id?.toString() || slug,
    slug,
    title: p.title || FRONTEND_INTERNSHIP_PROGRAM.title,
    subtitle: p.subtitle || FRONTEND_INTERNSHIP_PROGRAM.subtitle,
    thumbnail: p.thumbnail || '',
    track: p.track || p.domain || 'Software Engineer',
    domain: p.domain || p.track || 'Engineering',
    type: p.type || 'internship',
    mode: p.mode || 'Live Online • Weekend Classes',
    schedule: p.schedule || {
      badge: 'Weekend Live Batches',
      days: 'Every Saturday & Sunday',
      timings: 'Live Interactive Sessions + 24/7 Session Recordings',
      flexibility: 'Specially crafted for College Students & Working Professionals',
    },
    duration: p.durations || {
      total: p.duration || '2 Months Internship + Training',
      trainingWeeks: '4 Weeks Intensive Live Training',
      internshipWeeks: '2 Months Hands-on Industrial Internship',
    },
    rawDuration: p.duration || '2 Months Internship + Training',
    pricing: {
      trainingPrice,
      originalPrice,
      discountPercentage: Math.round((1 - (trainingPrice / (originalPrice || 7999))) * 100) || 70,
      internshipPrice,
      internshipStatusText:
        internshipPrice === 0
          ? '100% Free of Cost (Bundled with Training)'
          : `₹${internshipPrice.toLocaleString('en-IN')}`,
      currency: 'INR',
      currencySymbol: '₹',
    },
    sections: p.sections && p.sections.length > 0 ? p.sections : FRONTEND_INTERNSHIP_PROGRAM.sections,
    credentials:
      p.credentials && p.credentials.length > 0 ? p.credentials : FRONTEND_INTERNSHIP_PROGRAM.credentials,
    highlights:
      p.perks && p.perks.length > 0
        ? p.perks
        : (FRONTEND_INTERNSHIP_PROGRAM as any).benefits || [],
    eligibility: p.eligibility || 'College Students, Freshers & Working Professionals',
    deadline: p.deadline || 'Rolling Admissions',
    status: p.status || 'open',
    applicantsCount: p.applicantsCount || 0,
    createdAt: p.createdAt,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    try {
      await connectDB();

      // Retrieve all programs that are not closed
      const dbPrograms = await TrainingInternship.find({
        status: { $ne: 'closed' },
      })
        .sort({ createdAt: -1 })
        .lean();

      const formattedPrograms = (dbPrograms || []).map((p) => formatSingleProgram(p));

      let activeProgram = null;
      if (slug && formattedPrograms.length > 0) {
        activeProgram = formattedPrograms.find(
          (p) => p.slug === slug || p.id === slug
        );
      }
      if (!activeProgram && formattedPrograms.length > 0) {
        activeProgram =
          formattedPrograms.find((p) => /frontend/i.test(p.slug) || /frontend/i.test(p.title)) ||
          formattedPrograms[0];
      }
      if (!activeProgram) {
        activeProgram = formatSingleProgram(FRONTEND_INTERNSHIP_PROGRAM, slug || FRONTEND_INTERNSHIP_PROGRAM.slug);
      }

      return NextResponse.json({
        success: true,
        programs: formattedPrograms.length > 0 ? formattedPrograms : [activeProgram],
        program: activeProgram,
        total: formattedPrograms.length > 0 ? formattedPrograms.length : 1,
      });
    } catch (dbErr) {
      console.warn('[Next.js Training Internship API] MongoDB query error:', dbErr);
      return NextResponse.json({
        success: true,
        programs: [],
        program: null,
        total: 0,
      });
    }
  } catch (error: any) {
    console.error('[Next.js Training Internship GET Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch training and internship programs' },
      { status: 500 }
    );
  }
}
