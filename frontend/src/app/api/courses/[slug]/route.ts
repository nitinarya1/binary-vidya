import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { Course } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    try {
      const res = await fetch(`${backendUrl}/api/courses/${slug}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (backendErr) {
      console.warn('[Next.js Course Slug API] Express backend fetch fallback to direct DB');
    }

    await connectDB();

    let course: any = await Course.findOne({ slug }).lean();
    if (!course && slug.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(slug).lean();
    }
    if (!course) {
      course = await Course.findOne({ title: { $regex: new RegExp(`^${slug.replace(/-/g, ' ')}$`, 'i') } }).lean();
    }
    if (!course) {
      course = await Course.findOne({ slug: { $regex: new RegExp(slug, 'i') } }).lean();
    }

    if (!course) {
      return NextResponse.json(
        { success: false, message: `Course "${slug}" not found` },
        { status: 404 }
      );
    }

    const chapters = Array.isArray(course.chapters) ? course.chapters : [];
    let totalLessons = 0;
    chapters.forEach((ch: any) => {
      if (Array.isArray(ch.lessons)) totalLessons += ch.lessons.length;
    });

    return NextResponse.json({
      success: true,
      course: {
        id: course._id.toString(),
        title: course.title,
        slug: course.slug,
        description: course.description,
        category: course.category,
        level: course.level,
        duration: course.duration,
        price: course.price,
        instructor: course.instructor,
        thumbnail: course.thumbnail || '',
        tags: course.tags || [],
        chapters: chapters,
        chaptersCount: chapters.length,
        totalLessons: totalLessons || 20,
        modules: course.modules || [],
        status: course.status,
        enrolledCount: course.enrolledCount || 0,
        rating: course.rating || 4.8,
        createdAt: course.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Public Course Details GET Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
