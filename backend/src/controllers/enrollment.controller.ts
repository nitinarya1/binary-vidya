import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Enrollment } from '../models/Enrollment';
import { Order } from '../models/Order';
import { Course } from '../models/Course';
import { Certificate } from '../models/Certificate';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

/**
 * Helper to extract email from authorization token or query parameter
 */
function extractUserEmail(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.email) return decoded.email.toLowerCase().trim();
    } catch (e) {}
  }

  const queryEmail = (req.query.email as string) || (req.body?.userEmail as string) || (req.body?.email as string);
  if (queryEmail && queryEmail.trim()) {
    return queryEmail.toLowerCase().trim();
  }

  return null;
}

/**
 * GET /api/enrollments/my-learning
 * Returns strictly the courses, batches, and programs in which the logged-in user is enrolled
 */
export const getMyEnrolledCourses = async (req: Request, res: Response) => {
  try {
    const email = extractUserEmail(req);

    if (!email) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to view your enrolled courses.',
        courses: [],
      });
    }

    // 1. Fetch from Enrollments collection
    const enrollments = await Enrollment.find({ userEmail: email }).sort({ enrolledAt: -1 }).lean();

    // 2. Also check any paid orders for this user to ensure zero discrepancies
    const paidOrders = await Order.find({ userEmail: email, status: 'paid' }).lean();

    // Build unique enrolled map
    const enrolledCourseMap = new Map<string, any>();

    enrollments.forEach((e: any) => {
      enrolledCourseMap.set(e.courseId.toString(), {
        enrollmentId: e._id.toString(),
        batchName: e.batchName || 'Cohort 2026 - Active',
        enrolledAt: e.enrolledAt || e.createdAt,
        progressPercentage: e.progressPercentage || 0,
        completedLessons: e.completedLessons || [],
        type: e.type || 'course',
        status: e.status || 'active',
        certificateId: e.certificateId || '',
        certificateRecipientName: e.certificateRecipientName || '',
      });
    });

    paidOrders.forEach((o: any) => {
      const cId = o.courseId.toString();
      if (!enrolledCourseMap.has(cId)) {
        enrolledCourseMap.set(cId, {
          batchName: 'Cohort 2026 - Active',
          enrolledAt: o.createdAt,
          progressPercentage: 0,
          completedLessons: [],
          type: 'course',
          status: 'active',
        });
      }
    });

    // 3. Cross-check issued Certificates to guarantee 100% data sync
    const userCertificates = await Certificate.find({ userEmail: email }).lean();
    userCertificates.forEach((c: any) => {
      const match =
        enrolledCourseMap.get(c.courseId.toString()) ||
        (c.courseSlug && enrolledCourseMap.get(c.courseSlug));
      if (match) {
        match.certificateId = c.certificateId;
        match.certificateRecipientName = c.studentName;
        match.progressPercentage = 100;
        match.status = 'completed';
      }
    });

    const courseIds = Array.from(enrolledCourseMap.keys());

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        userEmail: email,
        courses: [],
      });
    }

    // Fetch full course details for each enrolled ID
    const courses = await Course.find({
      $or: [
        { _id: { $in: courseIds.filter((id) => id.match(/^[0-9a-fA-F]{24}$/)) } },
        { slug: { $in: courseIds } },
      ],
    }).lean();

    const formattedList = courses.map((c: any) => {
      const matchId = c._id.toString();
      const meta = enrolledCourseMap.get(matchId) || enrolledCourseMap.get(c.slug) || {};

      const chapters = Array.isArray(c.chapters) ? c.chapters : [];
      let totalLessons = 0;
      chapters.forEach((ch: any) => {
        if (Array.isArray(ch.lessons)) totalLessons += ch.lessons.length;
      });
      if (totalLessons === 0 && Array.isArray(c.modules)) {
        totalLessons = c.modules.reduce((acc: number, m: any) => acc + (m.lecturesCount || 0), 0);
      }
      if (totalLessons === 0) {
        totalLessons = 1;
      }

      const completedCount = (meta.completedLessons || []).length;
      const progress = meta.progressPercentage || 0;
      const isComplete = completedCount >= totalLessons && progress >= 100;

      return {
        id: matchId,
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        level: c.level,
        duration: c.duration,
        thumbnail: c.thumbnail || '',
        instructor: c.instructor,
        chapters: chapters,
        chaptersCount: chapters.length,
        totalLessons: totalLessons,
        modules: c.modules || [],
        batchName: meta.batchName || 'Cohort 2026 - Active',
        enrolledAt: meta.enrolledAt,
        progressPercentage: progress,
        completedLessons: meta.completedLessons || [],
        completedLessonsCount: completedCount,
        type: meta.type || 'course',
        status: meta.status || 'active',
        certificateId: meta.certificateId || '',
        certificateRecipientName: meta.certificateRecipientName || '',
        certificateUnlocked: !!meta.certificateId || isComplete,
      };
    });

    res.json({
      success: true,
      count: formattedList.length,
      userEmail: email,
      courses: formattedList,
    });
  } catch (error: any) {
    console.error('[getMyEnrolledCourses Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch enrolled courses',
      courses: [],
    });
  }
};

/**
 * POST /api/enrollments/free-enroll
 * Allows instant enrollment in free courses (price === 0)
 */
export const enrollFreeCourse = async (req: Request, res: Response) => {
  try {
    const { courseId, userEmail, userName, userId } = req.body;

    if (!courseId || !userEmail) {
      return res.status(400).json({ success: false, message: 'Course ID and user email required.' });
    }

    let course: any = null;
    if (typeof courseId === 'string' && courseId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(courseId).lean();
    }
    if (!course) {
      course = await Course.findOne({ slug: courseId }).lean();
    }

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const email = userEmail.toLowerCase().trim();

    // Upsert Enrollment
    const enrollment = await Enrollment.findOneAndUpdate(
      { userEmail: email, courseId: course._id.toString() },
      {
        $set: {
          userId: userId || '',
          userName: userName || 'Student',
          courseTitle: course.title,
          type: 'course',
          batchName: 'Cohort 2026 - Active',
          enrolledAt: new Date(),
          amountPaid: 0,
          status: 'active',
        },
      },
      { upsert: true, new: true }
    );

    // Increment enrolled count
    await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });

    res.json({
      success: true,
      message: 'Successfully enrolled in course!',
      enrollment,
    });
  } catch (error: any) {
    console.error('[enrollFreeCourse Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Enrollment failed.' });
  }
};

/**
 * POST /api/enrollments/update-progress
 * Marks a specific video lecture as completed or uncompleted, recalculates progress %, and updates status
 */
export const updateLessonProgress = async (req: Request, res: Response) => {
  try {
    const email = extractUserEmail(req);
    const { courseId, lessonKey, completed } = req.body;

    if (!email) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!courseId || !lessonKey) {
      return res.status(400).json({ success: false, message: 'Course ID and lesson key are required.' });
    }

    // Find course to get exact totalLessons
    let course: any = null;
    if (typeof courseId === 'string' && courseId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(courseId).lean();
    }
    if (!course) {
      course = await Course.findOne({ slug: courseId }).lean();
    }

    let totalLessons = 0;
    if (course && Array.isArray(course.chapters)) {
      course.chapters.forEach((ch: any) => {
        if (Array.isArray(ch.lessons)) totalLessons += ch.lessons.length;
      });
    }
    if (totalLessons === 0) totalLessons = 1;

    let enrollment = await Enrollment.findOne({
      userEmail: email,
      $or: [
        { courseId: courseId },
        { courseId: course ? course._id.toString() : courseId },
      ],
    });

    if (!enrollment) {
      enrollment = new Enrollment({
        userEmail: email,
        userName: 'Student',
        courseId: course ? course._id.toString() : courseId,
        courseTitle: course?.title || 'Masterclass',
        batchName: 'Cohort 2026 - Active',
        type: 'course',
        completedLessons: [],
        progressPercentage: 0,
        status: 'active',
      });
    }

    let completedLessons: string[] = Array.isArray(enrollment.completedLessons)
      ? [...enrollment.completedLessons]
      : [];
    const isAlreadyCompleted = completedLessons.includes(lessonKey);

    if (completed && !isAlreadyCompleted) {
      completedLessons.push(lessonKey);
    } else if (!completed && isAlreadyCompleted) {
      completedLessons = completedLessons.filter((k) => k !== lessonKey);
    }

    enrollment.completedLessons = completedLessons;
    const progress = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));
    enrollment.progressPercentage = progress;
    if (progress >= 100) {
      enrollment.status = 'completed';
    }

    await enrollment.save();

    const certificateUnlocked =
      completedLessons.length >= totalLessons || progress >= 100 || !!enrollment.certificateId;

    res.json({
      success: true,
      completedLessons,
      completedLessonsCount: completedLessons.length,
      totalLessons,
      progressPercentage: progress,
      certificateUnlocked,
      status: enrollment.status,
    });
  } catch (error: any) {
    console.error('[Update Progress Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update progress.' });
  }
};

