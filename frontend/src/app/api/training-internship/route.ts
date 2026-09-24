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

      if (dbPrograms && dbPrograms.length > 0) {
        const formattedPrograms = dbPrograms.map((p) => formatSingleProgram(p));

        // Find specific requested program or default to first / matching slug
        let activeProgram = null;
        if (slug) {
          activeProgram = formattedPrograms.find(
            (p) => p.slug === slug || p.id === slug
          );
        }
        if (!activeProgram) {
          // If no slug or not found, try finding frontend or first
          activeProgram =
            formattedPrograms.find((p) => /frontend/i.test(p.slug) || /frontend/i.test(p.title)) ||
            formattedPrograms[0];
        }

        return NextResponse.json({
          success: true,
          programs: formattedPrograms,
          program: activeProgram,
          total: formattedPrograms.length,
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

    // Default static fallback with single standard program wrapped in programs array
    const defaultProgram = formatSingleProgram(FRONTEND_INTERNSHIP_PROGRAM);
    return NextResponse.json({
      success: true,
      programs: [defaultProgram],
      program: defaultProgram,
      total: 1,
    });
  } catch (error: any) {
    console.error('[Next.js Training Internship GET Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch training and internship programs' },
      { status: 500 }
    );
  }
}
