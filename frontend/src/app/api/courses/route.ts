import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { Course } from '../../../lib/models';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Attempt to proxy/fetch from Express backend if available
    const { searchParams } = new URL(req.url);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    
    try {
      const qs = searchParams.toString();
      const res = await fetch(`${backendUrl}/api/courses${qs ? `?${qs}` : ''}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (backendErr) {
      // Backend unavailable or internal fallback: directly fetch from Mongo Atlas
      console.warn('[Next.js Courses API] Express backend fetch fallback to direct DB');
    }

    await connectDB();

    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const status = searchParams.get('status') || 'active';

    const query: any = {};
    if (status !== 'all') query.status = status;
    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    if (level && level !== 'all') query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let courseQuery = Course.find(query).sort({ createdAt: -1 });
    if (limit) courseQuery = courseQuery.limit(Number(limit));

    const courses = await courseQuery.lean();

    const formatted = courses.map((c: any) => {
      const chapters = Array.isArray(c.chapters) ? c.chapters : [];
      let totalLessons = 0;
      chapters.forEach((ch: any) => {
        if (Array.isArray(ch.lessons)) totalLessons += ch.lessons.length;
      });
      if (totalLessons === 0 && Array.isArray(c.modules)) {
        totalLessons = c.modules.reduce((sum: number, m: any) => sum + (m.lecturesCount || 0), 0);
      }

      return {
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        level: c.level,
        duration: c.duration,
        price: c.price,
        instructor: c.instructor,
        thumbnail: c.thumbnail || '',
        tags: c.tags || [],
        chapters: chapters,
        chaptersCount: chapters.length,
        totalLessons: totalLessons || 20,
        modules: c.modules || [],
        status: c.status,
        enrolledCount: c.enrolledCount || 0,
        rating: c.rating || 4.8,
        createdAt: c.createdAt,
      };
    });

    const categoriesList = await Course.distinct('category', { status: 'active' });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      categories: categoriesList,
      courses: formatted,
    });
  } catch (error: any) {
    console.error('[Public Courses GET Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
