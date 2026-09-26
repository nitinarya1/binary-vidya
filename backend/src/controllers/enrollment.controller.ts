import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Enrollment } from '../models/Enrollment';
import { Order } from '../models/Order';
import { Course } from '../models/Course';
import { Certificate } from '../models/Certificate';
import { TrainingInternship } from '../models/TrainingInternship';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';

/**
 * Helper to build rich chapter hierarchy for training & internships
 */
function buildInternshipChapters(internshipDoc?: any) {
  if (Array.isArray(internshipDoc?.sections) && internshipDoc.sections.length > 0) {
    return internshipDoc.sections.map((sec: any, secIdx: number) => {
      const secTitle = sec.title || `Section ${secIdx + 1}: ${sec.tagline || 'Industrial Training'}`;
      const secDesc = sec.description || sec.tagline || '';
      const rawModules = Array.isArray(sec.modules) ? sec.modules : [];
      const lessons = rawModules.map((m: any, mIdx: number) => ({
        id: `sec-${secIdx}-mod-${mIdx}`,
        title: m.title || `Module ${m.moduleNumber || mIdx + 1}`,
        videoUrl: m.videoUrl || '',
        duration: m.duration || '2 Hours',
        thumbnail: internshipDoc?.thumbnail || '',
        description: Array.isArray(m.topics) ? m.topics.join(' • ') : (m.description || ''),
      }));
      return {
        id: `chapter-sec-${secIdx}`,
        title: secTitle,
        description: secDesc,
        lessons: lessons.length > 0 ? lessons : [
          {
            id: `sec-${secIdx}-default`,
            title: `${secTitle} - Session Lecture`,
            videoUrl: '',
            duration: '2 Hours',
            description: secDesc,
          },
        ],
      };
    });
  }

  return [
    {
      title: 'Section 1: Intensive Frontend Engineering Training (Weekend Classes)',
      description: 'Core HTML5/CSS3, JavaScript ES6+, TypeScript, React 18, and Next.js 14 App Router',
      lessons: [
        { title: 'Module 1.1: Semantic HTML5, CSS3 & Responsive Architecture', videoUrl: '', duration: '2 Hours' },
        { title: 'Module 1.2: Modern JavaScript (ES6+) & Asynchronous Mastery', videoUrl: '', duration: '2.5 Hours' },
        { title: 'Module 1.3: TypeScript for Scalable Frontend Systems', videoUrl: '', duration: '2 Hours' },
        { title: 'Module 1.4: React 18+ Mastery & State Architecture', videoUrl: '', duration: '3 Hours' },
        { title: 'Module 1.5: Next.js 14 App Router & Full-Stack Capabilities', videoUrl: '', duration: '3 Hours' },
        { title: 'Module 1.6: Developer Tooling, Git & Cloud Deployment', videoUrl: '', duration: '1.5 Hours' },
      ],
    },
    {
      title: 'Section 2: Production Minor Project (SaaS Pulse Dashboard)',
      description: 'SaaS Analytics Dashboard & Modular Design System Kit',
      lessons: [
        { title: 'Minor Project Kickoff & Architecture Setup', videoUrl: '', duration: '1 Hour' },
        { title: 'Building Analytics Widgets & Recharts Integration', videoUrl: '', duration: '2 Hours' },
        { title: 'Theme Switcher, Mobile Navigation & Code Review', videoUrl: '', duration: '1.5 Hours' },
      ],
    },
    {
      title: 'Section 3: Enterprise Major Project (Binary Studio Platform)',
      description: 'Full-Scale Commercial Application with Auth, Video Streaming & Razorpay',
      lessons: [
        { title: 'Major Capstone Architecture & System Design', videoUrl: '', duration: '2 Hours' },
        { title: 'Authentication, REST APIs & Video Player Integration', videoUrl: '', duration: '3 Hours' },
        { title: 'Payment Gateway Integration & Production Deployment', videoUrl: '', duration: '2.5 Hours' },
      ],
    },
  ];
}

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
      const key = e.courseId ? e.courseId.toString() : '';
      if (!key) return;
      enrolledCourseMap.set(key, {
        enrollmentId: e._id.toString(),
        courseTitle: e.courseTitle || '',
        batchName: e.batchName || (e.type === 'internship' ? 'Weekend Industrial Cohort 2026' : 'Cohort 2026 - Active'),
        enrolledAt: e.enrolledAt || e.createdAt,
        progressPercentage: e.progressPercentage || 0,
        completedLessons: e.completedLessons || [],
        type: e.type || (e.courseTitle?.toLowerCase().includes('internship') ? 'internship' : 'course'),
        status: e.status || 'active',
        certificateId: e.certificateId || '',
        certificateRecipientName: e.certificateRecipientName || '',
      });
    });

    paidOrders.forEach((o: any) => {
      const cId = o.courseId ? o.courseId.toString() : '';
      if (!cId) return;
      const isInternship =
        (o.courseTitle && (o.courseTitle.toLowerCase().includes('internship') || o.courseTitle.toLowerCase().includes('training'))) ||
        cId.toLowerCase().includes('internship') ||
        cId.toLowerCase().includes('training');

      if (!enrolledCourseMap.has(cId)) {
        enrolledCourseMap.set(cId, {
          courseTitle: o.courseTitle || '',
          batchName: isInternship ? 'Weekend Industrial Cohort 2026' : 'Cohort 2026 - Active',
          enrolledAt: o.createdAt,
          progressPercentage: 0,
          completedLessons: [],
          type: isInternship ? 'internship' : 'course',
          status: 'active',
        });
      }
    });

    // 3. Cross-check issued Certificates to guarantee 100% data sync
    const userCertificates = await Certificate.find({ userEmail: email }).lean();
    userCertificates.forEach((c: any) => {
      const match =
        enrolledCourseMap.get(c.courseId?.toString()) ||
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

    const validObjectIds = courseIds.filter((id) => id.match(/^[0-9a-fA-F]{24}$/));

    // Fetch full course details for enrolled IDs
    const courses = await Course.find({
      $or: [
        { _id: { $in: validObjectIds } },
        { slug: { $in: courseIds } },
      ],
    }).lean();

    // Fetch full training & internship details for enrolled IDs
    const internships = await TrainingInternship.find({
      $or: [
        { _id: { $in: validObjectIds } },
        { slug: { $in: courseIds } },
      ],
    }).lean();

    const formattedList: any[] = [];
    const addedIds = new Set<string>();

    // 1. Format Technical Courses
    courses.forEach((c: any) => {
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

      addedIds.add(matchId);
      if (c.slug) addedIds.add(c.slug);

      formattedList.push({
        id: matchId,
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category || 'Engineering',
        level: c.level || 'All Levels',
        duration: c.duration || '8 Weeks',
        thumbnail: c.thumbnail || '',
        instructor: c.instructor || 'Binary Vidya Faculty',
        chapters: chapters,
        chaptersCount: chapters.length,
        totalLessons: totalLessons,
        modules: c.modules || [],
        batchName: meta.batchName || 'Cohort 2026 - Active',
        enrolledAt: meta.enrolledAt,
        progressPercentage: progress,
        completedLessons: meta.completedLessons || [],
        completedLessonsCount: completedCount,
        type: 'course',
        status: meta.status || 'active',
        certificateId: meta.certificateId || '',
        certificateRecipientName: meta.certificateRecipientName || '',
        certificateUnlocked: !!meta.certificateId || isComplete,
      });
    });

    // 2. Format Training & Internships found in DB
    internships.forEach((item: any) => {
      const matchId = item._id.toString();
      const meta = enrolledCourseMap.get(matchId) || enrolledCourseMap.get(item.slug) || {};

      const chapters = buildInternshipChapters(item);
      let totalLessons = 0;
      chapters.forEach((ch: any) => {
        if (Array.isArray(ch.lessons)) totalLessons += ch.lessons.length;
      });
      if (totalLessons === 0) totalLessons = 12;

      const completedCount = (meta.completedLessons || []).length;
      const progress = meta.progressPercentage || 0;
      const isComplete = completedCount >= totalLessons && progress >= 100;

      addedIds.add(matchId);
      if (item.slug) addedIds.add(item.slug);

      formattedList.push({
        id: matchId,
        title: item.title,
        slug: item.slug || 'frontend-developer-training-internship',
        description: item.description || item.subtitle || 'Comprehensive Industrial Training & Internship with Weekend Live Batches.',
        category: 'Training & Internship',
        level: item.eligibility || 'All Levels',
        duration: item.duration || '2 Months',
        thumbnail: item.thumbnail || '',
        instructor: 'Binary Vidya Technical Mentors',
        chapters: chapters,
        chaptersCount: chapters.length,
        totalLessons: totalLessons,
        modules: [
          { title: 'Section 1: Frontend Engineering Training', lecturesCount: 6, duration: '14 Hours' },
          { title: 'Section 2: Minor Project (SaaS Pulse)', lecturesCount: 3, duration: '4.5 Hours' },
          { title: 'Section 3: Major Project (Binary Studio)', lecturesCount: 3, duration: '7.5 Hours' },
        ],
        batchName: meta.batchName || 'Weekend Industrial Cohort 2026',
        enrolledAt: meta.enrolledAt,
        progressPercentage: progress,
        completedLessons: meta.completedLessons || [],
        completedLessonsCount: completedCount,
        type: 'internship',
        status: meta.status || 'active',
        certificateId: meta.certificateId || '',
        certificateRecipientName: meta.certificateRecipientName || '',
        certificateUnlocked: !!meta.certificateId || isComplete,
      });
    });

    // 3. Fallback for any internship purchases not yet in TrainingInternship collection
    for (const [key, meta] of Array.from(enrolledCourseMap.entries())) {
      if (addedIds.has(key)) continue;

      const isInternshipKey =
        key.toLowerCase().includes('internship') ||
        key.toLowerCase().includes('training') ||
        meta.type === 'internship' ||
        (meta.courseTitle && (meta.courseTitle.toLowerCase().includes('internship') || meta.courseTitle.toLowerCase().includes('training')));

      if (isInternshipKey) {
        // Try to query any default training internship from DB
        const defaultInternship = await TrainingInternship.findOne({ status: { $ne: 'closed' } }).lean();
        const chapters = buildInternshipChapters(defaultInternship);
        let totalLessons = 0;
        chapters.forEach((ch: any) => {
          if (Array.isArray(ch.lessons)) totalLessons += ch.lessons.length;
        });
        if (totalLessons === 0) totalLessons = 12;

        const completedCount = (meta.completedLessons || []).length;
        const progress = meta.progressPercentage || 0;
        const isComplete = completedCount >= totalLessons && progress >= 100;

        addedIds.add(key);

        formattedList.push({
          id: key,
          title: meta.courseTitle || defaultInternship?.title || 'Frontend Developer Training & 2-Month Internship',
          slug: key.includes('-') ? key : defaultInternship?.slug || 'frontend-developer-training-internship',
          description: defaultInternship?.description || defaultInternship?.subtitle || 'Comprehensive Frontend Engineering Training with Weekend Live Batches, Minor & Major Projects, and 2-Month Industrial Internship.',
          category: 'Training & Internship',
          level: 'All Levels',
          duration: defaultInternship?.duration || '2 Months',
          thumbnail: defaultInternship?.thumbnail || '',
          instructor: 'Binary Vidya Technical Mentors',
          chapters: chapters,
          chaptersCount: chapters.length,
          totalLessons: totalLessons,
          modules: [
            { title: 'Section 1: Frontend Engineering Training', lecturesCount: 6, duration: '14 Hours' },
            { title: 'Section 2: Minor Project (SaaS Pulse)', lecturesCount: 3, duration: '4.5 Hours' },
            { title: 'Section 3: Major Project (Binary Studio)', lecturesCount: 3, duration: '7.5 Hours' },
          ],
          batchName: meta.batchName || 'Weekend Industrial Cohort 2026',
          enrolledAt: meta.enrolledAt,
          progressPercentage: progress,
          completedLessons: meta.completedLessons || [],
          completedLessonsCount: completedCount,
          type: 'internship',
          status: meta.status || 'active',
          certificateId: meta.certificateId || '',
          certificateRecipientName: meta.certificateRecipientName || '',
          certificateUnlocked: !!meta.certificateId || isComplete,
        });
      }
    }

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

    // Find course or internship to get exact totalLessons
    let course: any = null;
    let isInternshipProgram = false;
    if (typeof courseId === 'string' && courseId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(courseId).lean();
    }
    if (!course) {
      course = await Course.findOne({ slug: courseId }).lean();
    }
    if (!course) {
      if (typeof courseId === 'string' && courseId.match(/^[0-9a-fA-F]{24}$/)) {
        course = await TrainingInternship.findById(courseId).lean();
      }
      if (!course) {
        course = await TrainingInternship.findOne({ slug: courseId }).lean();
      }
      if (course) {
        isInternshipProgram = true;
      }
    }

    let totalLessons = 0;
    if (course) {
      if (Array.isArray(course.chapters)) {
        course.chapters.forEach((ch: any) => {
          if (Array.isArray(ch.lessons)) totalLessons += ch.lessons.length;
        });
      } else if (Array.isArray(course.sections)) {
        course.sections.forEach((sec: any) => {
          if (Array.isArray(sec.modules)) totalLessons += sec.modules.length;
        });
      }
    }
    if (totalLessons === 0) {
      totalLessons = isInternshipProgram || (typeof courseId === 'string' && courseId.includes('internship')) ? 12 : 1;
    }

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

