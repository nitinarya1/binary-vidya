import { Request, Response } from 'express';
import { Course } from '../models/Course';

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const { category, level, search, limit, status } = req.query;

    const query: any = {};

    // Filter by published status by default for students
    if (status) {
      if (status !== 'all') query.status = status;
    } else {
      query.status = 'active';
    }

    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (level && level !== 'all') {
      query.level = level;
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let courseQuery = Course.find(query).sort({ createdAt: -1 });
    if (limit) {
      courseQuery = courseQuery.limit(Number(limit));
    }

    const courses = await courseQuery.lean();

    // Map courses with computed summary counts
    const formatted = courses.map((c: any) => {
      const chapters = Array.isArray(c.chapters) ? c.chapters : [];
      let totalLessons = 0;
      chapters.forEach((ch: any) => {
        if (Array.isArray(ch.lessons)) {
          totalLessons += ch.lessons.length;
        }
      });

      // fallback to modules count if 0 lessons
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

    res.json({
      success: true,
      count: formatted.length,
      categories: categoriesList,
      courses: formatted,
    });
  } catch (error: any) {
    console.error('[getAllCourses Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch courses from backend',
    });
  }
};

/**
 * GET /api/courses/:slugOrId
 * Public endpoint to fetch single course details with complete chapters and video lessons
 */
export const getCourseBySlug = async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;

    let course: any = await Course.findOne({ slug: slugOrId }).lean();
    if (!course && slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(slugOrId).lean();
    }
    if (!course) {
      course = await Course.findOne({ title: { $regex: new RegExp(`^${slugOrId.replace(/-/g, ' ')}$`, 'i') } }).lean();
    }
    if (!course) {
      course = await Course.findOne({ slug: { $regex: new RegExp(slugOrId, 'i') } }).lean();
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course with identifier "${slugOrId}" not found`,
      });
    }

    const chapters = Array.isArray(course.chapters) ? course.chapters : [];
    let totalLessons = 0;
    chapters.forEach((ch: any) => {
      if (Array.isArray(ch.lessons)) {
        totalLessons += ch.lessons.length;
      }
    });

    res.json({
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
    console.error('[getCourseBySlug Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch course details',
    });
  }
};
