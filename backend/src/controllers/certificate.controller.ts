import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Certificate } from '../models/Certificate';
import { Enrollment } from '../models/Enrollment';
import { Course } from '../models/Course';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'binary_vidya_super_secret_jwt_key_2025_987654321';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function extractUserEmail(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.email) return decoded.email.toLowerCase().trim();
    } catch (e) {}
  }

  const queryEmail = (req.query.email as string) || (req.body.userEmail as string) || (req.body.email as string);
  if (queryEmail && queryEmail.trim()) {
    return queryEmail.toLowerCase().trim();
  }

  return null;
}

/**
 * Generate a unique, verifiable Certificate ID
 * Format: BV-CERT-2026-XXXXXX
 */
function generateCertificateId(): string {
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `BV-CERT-2026-${randomSuffix}`;
}

/**
 * POST /api/certificates/issue
 * Confirms student legal name, completes course, and generates/returns official Certificate
 */
export const issueCertificate = async (req: Request, res: Response) => {
  try {
    const email = extractUserEmail(req);
    const { courseId, studentName } = req.body;

    if (!email) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to claim your certificate.',
      });
    }

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ success: false, message: 'Please confirm your full legal name.' });
    }

    const trimmedName = studentName.trim();

    // 1. Verify that user is enrolled in this course
    const enrollment = await Enrollment.findOne({
      userEmail: email,
      $or: [
        { courseId: courseId },
        { courseId: courseId.toString() },
      ],
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        locked: true,
        message: 'You are not enrolled in this course. Please enroll before claiming a certificate.',
      });
    }

    // 2. Fetch Course details to verify total curriculum lessons
    let course = null;
    if (courseId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(courseId);
    }
    if (!course) {
      course = await Course.findOne({ slug: courseId });
    }

    const courseTitle = course?.title || enrollment?.courseTitle || 'Engineering Masterclass';
    const courseSlug = course?.slug || (typeof courseId === 'string' ? courseId : '');
    const instructor = course?.instructor || 'Binary Vidya Technical Academy Faculty';
    const batchName = enrollment?.batchName || 'Cohort 2026 - Active';

    // Calculate total required video lectures
    let totalLessons = 0;
    if (course && Array.isArray(course.chapters)) {
      course.chapters.forEach((ch: any) => {
        if (Array.isArray(ch.lessons)) totalLessons += ch.lessons.length;
      });
    }
    if (totalLessons === 0 && course && Array.isArray(course.modules)) {
      totalLessons = course.modules.reduce((acc: number, m: any) => acc + (m.lecturesCount || 0), 0);
    }
    if (totalLessons === 0) totalLessons = 1;

    // 3. Check if Certificate already exists for this student & course
    let certificate = await Certificate.findOne({
      userEmail: email,
      courseId: course ? course._id.toString() : courseId,
    });

    // 4. STRICT COMPLETION GATING: If no certificate exists yet, student MUST have completed all videos
    const completedLessonsCount = Array.isArray(enrollment.completedLessons) ? enrollment.completedLessons.length : 0;
    const progress = enrollment.progressPercentage || 0;

    if (!certificate) {
      const isComplete = completedLessonsCount >= totalLessons && progress >= 100;
      if (!isComplete) {
        return res.status(403).json({
          success: false,
          locked: true,
          message: `Certificate Locked: You have completed ${completedLessonsCount} of ${totalLessons} video lectures (${progress}%). You must watch and complete 100% of the course videos to earn your certificate.`,
          completedLessonsCount,
          totalLessons,
          progressPercentage: progress,
        });
      }
    }

    // 5. Update User profile name if adjusted by student
    try {
      await User.findOneAndUpdate(
        { email },
        { $set: { name: trimmedName } },
        { new: true }
      );
    } catch (uErr) {
      console.warn('[User Name Update Note]:', uErr);
    }

    if (certificate) {
      // Update with confirmed name and ensure verified status
      certificate.studentName = trimmedName;
      certificate.courseTitle = courseTitle;
      certificate.verificationUrl = `${APP_URL}/certificates/${certificate.certificateId}`;
      await certificate.save();
    } else {
      // Create new Certificate with unique ID
      let certId = generateCertificateId();
      // Ensure absolute uniqueness
      let collisionCheck = await Certificate.findOne({ certificateId: certId });
      while (collisionCheck) {
        certId = generateCertificateId();
        collisionCheck = await Certificate.findOne({ certificateId: certId });
      }

      certificate = await Certificate.create({
        certificateId: certId,
        userId: enrollment?.userId || '',
        userEmail: email,
        studentName: trimmedName,
        courseId: course ? course._id.toString() : courseId,
        courseTitle,
        courseSlug,
        batchName,
        instructor,
        issuedAt: new Date(),
        grade: 'Verified Honors',
        status: 'verified',
        verificationUrl: `${APP_URL}/certificates/${certId}`,
      });
    }

    // 5. Update or Upsert Enrollment record to mark 100% completed & store certificate details
    await Enrollment.findOneAndUpdate(
      {
        userEmail: email,
        $or: [
          { courseId: courseId },
          { courseId: course ? course._id.toString() : courseId },
          { courseId: courseSlug },
        ],
      },
      {
        $set: {
          userEmail: email,
          userName: trimmedName,
          courseId: course ? course._id.toString() : courseId,
          courseTitle: courseTitle,
          batchName: batchName,
          type: 'course',
          status: 'completed',
          progressPercentage: 100,
          certificateId: certificate.certificateId,
          certificateIssuedAt: certificate.issuedAt,
          certificateRecipientName: trimmedName,
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Certificate confirmed and generated successfully!',
      certificateId: certificate.certificateId,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        batchName: certificate.batchName,
        instructor: certificate.instructor,
        issuedAt: certificate.issuedAt,
        grade: certificate.grade,
        verificationUrl: certificate.verificationUrl,
      },
    });
  } catch (error: any) {
    console.error('[Issue Certificate Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to issue certificate',
    });
  }
};

/**
 * GET /api/certificates/:certificateId
 * Public endpoint to verify and display any certificate by its ID
 */
export const getCertificateById = async (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;

    if (!certificateId) {
      return res.status(400).json({ success: false, message: 'Certificate ID is required.' });
    }

    const certificate = await Certificate.findOne({
      certificateId: { $regex: new RegExp(`^${certificateId.trim()}$`, 'i') },
    }).lean();

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: `Certificate with ID "${certificateId}" was not found or is invalid.`,
      });
    }

    res.json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        courseSlug: certificate.courseSlug,
        batchName: certificate.batchName,
        instructor: certificate.instructor,
        issuedAt: certificate.issuedAt,
        grade: certificate.grade,
        status: certificate.status,
        verificationUrl: certificate.verificationUrl || `${APP_URL}/certificates/${certificate.certificateId}`,
        createdAt: certificate.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Get Certificate Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve certificate details',
    });
  }
};

/**
 * GET /api/certificates/my-certificates
 * Returns all certificates awarded to the logged-in student
 */
export const getMyCertificates = async (req: Request, res: Response) => {
  try {
    const email = extractUserEmail(req);

    if (!email) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view your certificates.',
        certificates: [],
      });
    }

    const certificates = await Certificate.find({ userEmail: email }).sort({ issuedAt: -1 }).lean();

    res.json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error: any) {
    console.error('[Get My Certificates Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student certificates',
      certificates: [],
    });
  }
};
