'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import styles from './course-detail.module.css';
import {
  Sparkles,
  Star,
  Clock,
  Layers,
  Video,
  Award,
  CheckCircle2,
  Users,
  ShieldCheck,
  PlayCircle,
  Film,
  ArrowRight,
  ChevronRight,
  Code2,
  Terminal,
  Laptop,
  Briefcase,
  UserCheck,
  Check,
  Share2,
  X,
} from 'lucide-react';
import { VideoPlayer } from '../../../components/VideoPlayer';

interface VideoLesson {
  id?: string;
  title: string;
  videoUrl: string;
  duration: string;
  thumbnail?: string;
  description?: string;
}

interface Chapter {
  id?: string;
  title: string;
  description?: string;
  lessons: VideoLesson[];
}

interface CourseData {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price: number;
  instructor: string;
  thumbnail?: string;
  tags?: string[];
  chapters?: Chapter[];
  chaptersCount?: number;
  totalLessons?: number;
  rating?: number;
  enrolledCount?: number;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewLesson, setPreviewLesson] = useState<{ title: string; videoUrl: string; thumbnail?: string } | null>(null);

  useEffect(() => {
    async function loadCourse() {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${slug}`);
        const data = await res.json();
        if (data.success && data.course) {
          setCourse(data.course);
        } else {
          setErrorMsg(data.message || 'Course not found');
        }
      } catch (err: any) {
        console.error('Failed to load course details:', err);
        setErrorMsg('Failed to load course. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#64748b' }}>
            Loading Course Curriculum &amp; Media...
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className={styles.container}>
        <div style={{ maxWidth: '600px', margin: '80px auto', padding: '40px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Course Not Found
          </h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>
            {errorMsg || "The course you're looking for doesn't exist or is currently unpublished."}
          </p>
          <Link href="/courses" style={{ padding: '10px 20px', borderRadius: '8px', background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
            Browse All Masterclasses
          </Link>
        </div>
      </div>
    );
  }

  // Calculate pricing & discount
  const originalPrice = Math.round((course.price || 2999) * 2.2);
  const discountPercent = course.price > 0 ? Math.round(((originalPrice - course.price) / originalPrice) * 100) : 100;
  const totalChapters = course.chapters?.length || course.chaptersCount || 1;
  const totalLessons = course.totalLessons || 12;

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navWrapper}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.brandLogo}>BV</div>
            <div>
              <div className={styles.brandName}>Binary Vidya</div>
              <div className={styles.brandTagline}>Technical Academy</div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link href="/courses" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: 700, color: '#2563eb' }}>
              &larr; All Courses
            </Link>
            {user && (
              <div className={styles.userPill}>
                <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }} title="View & Edit Profile">
                  <div className={styles.userAvatar}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                      user.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className={styles.userName}>{user.name}</div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Breadcrumbs */}
      <div className={styles.breadcrumbBar}>
        <Link href="/" className={styles.breadcrumbLink}>
          Home
        </Link>
        <ChevronRight size={14} />
        <Link href="/courses" className={styles.breadcrumbLink}>
          Courses
        </Link>
        <ChevronRight size={14} />
        <span className={styles.breadcrumbActive}>{course.title}</span>
      </div>

      {/* HERO SECTION */}
      <header className={styles.heroSection}>
        <div className={styles.heroGrid}>
          {/* Left Hero Details */}
          <div>
            <div className={styles.tagRow}>
              <span className={styles.categoryTag}>{course.category}</span>
              <span className={styles.levelTag}>{course.level} Level</span>
            </div>

            <h1 className={styles.courseTitle}>{course.title}</h1>
            <p className={styles.courseDesc}>{course.description}</p>

            <div className={styles.ratingRow}>
              <div className={styles.starsBox}>
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <span>{course.rating || 4.9}</span>
              </div>
              <span>•</span>
              <span>{(course.enrolledCount || 120).toLocaleString()} engineers enrolled</span>
              <span>•</span>
              <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} /> Verified Certification
              </span>
            </div>

            {/* Instructor Card */}
            <div className={styles.instructorCard}>
              <div className={styles.instructorAvatar}>
                {course.instructor.charAt(0)}
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Curriculum Creator &amp; Lead Faculty
                </span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {course.instructor}
                </div>
              </div>
            </div>

            {/* Price & Discount Box */}
            <div className={styles.priceBox}>
              <div className={styles.priceRow}>
                <span className={styles.currentPrice}>
                  {course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'Free Access'}
                </span>
                {course.price > 0 && (
                  <>
                    <span className={styles.originalPrice}>
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className={styles.discountBadge}>
                      {discountPercent}% OFF • Scholarship Tier
                    </span>
                  </>
                )}
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
                One-time enrollment fee. Includes lifetime unlimited access, project codebases, and digital certificate.
              </p>

              <Link href={`/courses/${course.slug || course.id}/checkout`} className={styles.heroEnrollBtn}>
                Enroll Now <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Right Hero: High-Res Thumbnail Preview Card */}
          <div className={styles.visualCard}>
            <div className={styles.thumbnailContainer}>
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className={styles.thumbnailImg} />
              ) : (
                <div className={styles.thumbnailPlaceholder}>
                  <div style={{ textAlign: 'center' }}>
                    <PlayCircle size={52} color="#ffffff" style={{ opacity: 0.9, marginBottom: '8px' }} />
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>{course.category}</div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.visualHighlights}>
              <div className={styles.highlightItem}>
                <Clock size={16} color="#2563eb" />
                <span>{course.duration} comprehensive duration</span>
              </div>
              <div className={styles.highlightItem}>
                <Layers size={16} color="#2563eb" />
                <span>{totalChapters} structured chapters</span>
              </div>
              <div className={styles.highlightItem}>
                <Video size={16} color="#2563eb" />
                <span>{totalLessons} hands-on video lectures</span>
              </div>
              <div className={styles.highlightItem}>
                <Award size={16} color="#2563eb" />
                <span>Verifiable digital certification</span>
              </div>
              <div className={styles.highlightItem}>
                <CheckCircle2 size={16} color="#2563eb" />
                <span>Lifetime access with all future updates</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 1. CURRICULUM SECTION */}
      <section className={styles.contentSection} id="curriculum">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Layers size={14} /> Step-By-Step Syllabus
          </div>
          <h2 className={styles.sectionTitle}>Course Curriculum &amp; Video Lessons</h2>
          <p className={styles.sectionSubtitle}>
            Explore the multi-chapter learning path. Each lesson includes production code and hands-on deliverables.
          </p>
        </div>

        {course.chapters && course.chapters.length > 0 ? (
          <div>
            {course.chapters.map((chapter, chIdx) => (
              <div key={chapter.id || chIdx} className={styles.chapterCard}>
                <div className={styles.chapterHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: '#2563eb', color: '#ffffff', padding: '3px 8px', borderRadius: '6px' }}>
                      CHAPTER {chIdx + 1}
                    </span>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{chapter.title}</strong>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    {chapter.lessons?.length || 0} Lessons
                  </span>
                </div>

                {chapter.description && (
                  <p style={{ margin: '10px 20px', fontSize: '13px', color: '#64748b' }}>
                    {chapter.description}
                  </p>
                )}

                <div>
                  {chapter.lessons && chapter.lessons.map((lesson, lIdx) => (
                    <div
                      key={lesson.id || lIdx}
                      className={styles.lessonRow}
                      onClick={() => setPreviewLesson(lesson)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                        {lesson.thumbnail ? (
                          <img src={lesson.thumbnail} alt={lesson.title} className={styles.lessonThumb} />
                        ) : (
                          <div className={styles.lessonThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <Film size={18} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                            {lesson.title}
                          </div>
                          {lesson.description && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {lesson.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                          <Clock size={13} /> {lesson.duration || '15 Mins'}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#2563eb',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <PlayCircle size={13} /> Preview
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
            Curriculum overview is being finalized. Full syllabus will be unlocked upon enrollment.
          </div>
        )}
      </section>

      {/* 2. WHO THIS IS FOR SECTION */}
      <section className={styles.contentSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Users size={14} /> Target Audience
          </div>
          <h2 className={styles.sectionTitle}>Who This Masterclass Is For</h2>
          <p className={styles.sectionSubtitle}>
            Engineered to cater to diverse backgrounds seeking technical depth and real-world proficiency.
          </p>
        </div>

        <div className={styles.personaGrid}>
          <div className={styles.personaCard}>
            <div className={styles.personaIconBox}>
              <Terminal size={22} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Aspiring Software Developers
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Learners looking to build a rock-solid engineering foundation with production architectures instead of shallow tutorials.
              </p>
            </div>
          </div>

          <div className={styles.personaCard}>
            <div className={styles.personaIconBox}>
              <Laptop size={22} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Computer Science &amp; Engineering Students
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                College students wanting to bridge the gap between academic textbooks and real tech industry expectations for placements.
              </p>
            </div>
          </div>

          <div className={styles.personaCard}>
            <div className={styles.personaIconBox}>
              <Briefcase size={22} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Working Engineers Looking to Upskill
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Professionals transitioning to modern stacks, distributed systems, cloud containers, or AI pipelines to accelerate career growth.
              </p>
            </div>
          </div>

          <div className={styles.personaCard}>
            <div className={styles.personaIconBox}>
              <UserCheck size={22} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Product &amp; FAANG Interview Candidates
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Engineers preparing for rigorous technical interviews, system design rounds, and high-frequency live coding assessments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHAT YOU GET SECTION */}
      <section className={styles.contentSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Sparkles size={14} /> Tangible Deliverables
          </div>
          <h2 className={styles.sectionTitle}>What You Get With Your Enrollment</h2>
          <p className={styles.sectionSubtitle}>
            Complete learning ecosystem designed to turn concepts into shipped, production-tested software.
          </p>
        </div>

        <div className={styles.deliverablesGrid}>
          <div className={styles.deliverableCard}>
            <div className={styles.deliverableIcon}>
              <Video size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Full Multi-Chapter Video Tracks
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
              On-demand high-definition video masterclasses with individual lesson bookmarks, code breakdowns, and zero fluff.
            </p>
          </div>

          <div className={styles.deliverableCard}>
            <div className={styles.deliverableIcon}>
              <Code2 size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Production Capstone Repositories
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
              Direct access to clean, modular starter boilerplates and end-to-end GitHub code repositories for your portfolio.
            </p>
          </div>

          <div className={styles.deliverableCard}>
            <div className={styles.deliverableIcon}>
              <Award size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Verifiable Digital Certification
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
              Receive an authentic, shareable credential with a unique verification URL for LinkedIn and employer resumes.
            </p>
          </div>

          <div className={styles.deliverableCard}>
            <div className={styles.deliverableIcon}>
              <Clock size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Lifetime Unlimited Access
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
              Study at your own pace without arbitrary deadlines. Receive all future syllabus refreshes and lectures at zero extra cost.
            </p>
          </div>

          <div className={styles.deliverableCard}>
            <div className={styles.deliverableIcon}>
              <Users size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Discord Community &amp; Mentor Q&amp;A
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
              Collaborate with 15,000+ peers, participate in live hack sessions, and receive code feedback from experienced mentors.
            </p>
          </div>

          <div className={styles.deliverableCard}>
            <div className={styles.deliverableIcon}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Institutional Guarantee
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
              Backed by Binary Vidya&apos;s commitment to technical rigor. 100% money-back satisfaction guarantee within 7 days.
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <div className={styles.bottomBanner}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px' }}>
            Ready to Master {course.title}?
          </h2>
          <p style={{ fontSize: '15px', color: '#cbd5e1', marginBottom: '28px', lineHeight: 1.6 }}>
            Join thousands of ambitious engineers who have transformed their technical careers with Binary Vidya.
          </p>

          <Link
            href={`/courses/${course.slug || course.id}/checkout`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 36px',
              borderRadius: '12px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            }}
          >
            Enroll Now for {course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'Free'} <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Video Player Preview Modal */}
      {previewLesson && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPreviewLesson(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '880px',
              background: '#0f172a',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#1e293b',
                color: '#fff',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase' }}>
                  Curriculum Video Lecture Preview
                </span>
                <h4 style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 700 }}>
                  {previewLesson.title}
                </h4>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              <VideoPlayer
                src={previewLesson.videoUrl}
                title={previewLesson.title}
                poster={previewLesson.thumbnail || course?.thumbnail}
                autoPlay={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
