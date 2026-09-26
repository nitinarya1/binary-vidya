import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { Enrollment, Order, Course, TrainingInternship, Certificate } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

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

async function queryMongoDirectly(email: string) {
  await connectDB();
  const normalizedEmail = email.toLowerCase().trim();

  const [enrollments, paidOrders, userCertificates] = await Promise.all([
    Enrollment.find({ userEmail: normalizedEmail }).sort({ enrolledAt: -1 }).lean(),
    Order.find({ userEmail: normalizedEmail, status: 'paid' }).lean(),
    Certificate.find({ userEmail: normalizedEmail }).lean(),
  ]);

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
    return [];
  }

  const validObjectIds = courseIds.filter((id) => id.match(/^[0-9a-fA-F]{24}$/));

  const [courses, internships] = await Promise.all([
    Course.find({
      $or: [{ _id: { $in: validObjectIds } }, { slug: { $in: courseIds } }],
    }).lean(),
    TrainingInternship.find({
      $or: [{ _id: { $in: validObjectIds } }, { slug: { $in: courseIds } }],
    }).lean(),
  ]);

  const formattedList: any[] = [];
  const addedIds = new Set<string>();

  // Format courses
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
    if (totalLessons === 0) totalLessons = 1;

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

  // Format internships
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

  // Fallback for any internship purchases not yet in TrainingInternship collection
  for (const [key, meta] of Array.from(enrolledCourseMap.entries())) {
    if (addedIds.has(key)) continue;

    const isInternshipKey =
      key.toLowerCase().includes('internship') ||
      key.toLowerCase().includes('training') ||
      meta.type === 'internship' ||
      (meta.courseTitle && (meta.courseTitle.toLowerCase().includes('internship') || meta.courseTitle.toLowerCase().includes('training')));

    if (isInternshipKey) {
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

  return formattedList;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const authHeader = req.headers.get('authorization');
    const headers: any = { 'Content-Type': 'application/json' };
    if (authHeader) headers['authorization'] = authHeader;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${backendUrl}/api/enrollments/my-learning?${searchParams.toString()}`, {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.courses) && data.courses.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (backendErr) {
    console.warn('[Next.js My-Learning Proxy fallback to MongoDB direct query]');
  }

  // Fallback to direct MongoDB query
  try {
    if (email) {
      const directCourses = await queryMongoDirectly(email);
      return NextResponse.json({
        success: true,
        count: directCourses.length,
        userEmail: email,
        courses: directCourses,
      });
    }

    return NextResponse.json({
      success: true,
      count: 0,
      courses: [],
    });
  } catch (error: any) {
    console.error('[Next.js My-Learning Direct Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch enrolled courses', courses: [] },
      { status: 500 }
    );
  }
}
