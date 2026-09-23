'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './my-learning.module.css';
import { VideoPlayer } from '../../components/VideoPlayer';
import { ConfirmNameModal } from '../../components/ConfirmNameModal';
import {
  BookOpen,
  GraduationCap,
  Layers,
  Video,
  Clock,
  Award,
  CheckCircle2,
  PlayCircle,
  Play,
  ChevronLeft,
  ChevronRight,
  Film,
  ArrowRight,
  Sparkles,
  Search,
  ShieldCheck,
  X,
  LogOut,
  User as UserIcon,
  HelpCircle,
  Lock,
} from 'lucide-react';

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

interface EnrolledCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  thumbnail?: string;
  instructor: string;
  chapters?: Chapter[];
  chaptersCount?: number;
  totalLessons?: number;
  batchName: string;
  enrolledAt: string;
  progressPercentage: number;
  completedLessons?: string[];
  completedLessonsCount: number;
  type: 'course' | 'internship';
  status: 'active' | 'completed' | 'paused';
  certificateUnlocked: boolean;
  certificateId?: string;
  certificateRecipientName?: string;
}

export default function MyLearningDashboardPage() {
  const router = useRouter();
  const { user, token, logout, isLoading: authLoading } = useAuth();

  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'course' | 'internship'>('all');
  const [activeLectureCourse, setActiveLectureCourse] = useState<EnrolledCourse | null>(null);
  const [currentPlayingLesson, setCurrentPlayingLesson] = useState<{
    chapterIdx: number;
    lessonIdx: number;
    lesson: VideoLesson;
  } | null>(null);
  const [completedLessonKeys, setCompletedLessonKeys] = useState<Set<string>>(new Set());

  // Certificate Issuance States
  const [confirmingCourseForCert, setConfirmingCourseForCert] = useState<EnrolledCourse | null>(null);
  const [issuingCertLoading, setIssuingCertLoading] = useState(false);

  // Sync lesson progress to backend MongoDB
  const syncLessonProgress = async (courseId: string, lessonKey: string, completed: boolean) => {
    if (!user?.email) return;
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/enrollments/update-progress', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          courseId,
          lessonKey,
          completed,
          userEmail: user.email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  completedLessons: data.completedLessons,
                  completedLessonsCount: data.completedLessonsCount,
                  progressPercentage: data.progressPercentage,
                  certificateUnlocked: data.certificateUnlocked,
                }
              : c
          )
        );

        setActiveLectureCourse((prev) =>
          prev && prev.id === courseId
            ? {
                ...prev,
                completedLessons: data.completedLessons,
                completedLessonsCount: data.completedLessonsCount,
                progressPercentage: data.progressPercentage,
                certificateUnlocked: data.certificateUnlocked,
              }
            : prev
        );
      }
    } catch (e) {
      console.error('Failed to sync lesson progress:', e);
    }
  };

  // Claim or View Certificate
  const handleClaimOrDownloadCertificate = (course: EnrolledCourse) => {
    if (course.certificateId) {
      router.push(`/certificates/${course.certificateId}`);
    } else if (course.certificateUnlocked) {
      setConfirmingCourseForCert(course);
    } else {
      const remaining = Math.max(0, (course.totalLessons || 0) - (course.completedLessonsCount || 0));
      alert(
        `🔒 Certificate Locked\n\nYou have completed ${course.completedLessonsCount || 0} of ${
          course.totalLessons || 0
        } videos (${course.progressPercentage || 0}%).\n\nYou must watch and complete all ${
          remaining > 0 ? remaining : 'remaining'
        } video lectures to earn your verified certificate.`
      );
    }
  };

  // Confirm Name and Issue Certificate
  const handleConfirmCertificateName = async (confirmedName: string) => {
    if (!confirmingCourseForCert || !user?.email) return;
    try {
      setIssuingCertLoading(true);
      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: confirmingCourseForCert.id,
          studentName: confirmedName,
          userEmail: user.email,
        }),
      });
      const data = await res.json();
      if (data.success && data.certificateId) {
        setConfirmingCourseForCert(null);
        // Update local courses state
        setCourses((prev) =>
          prev.map((c) =>
            c.id === confirmingCourseForCert.id
              ? { ...c, certificateId: data.certificateId, certificateUnlocked: true, progressPercentage: 100 }
              : c
          )
        );
        router.push(`/certificates/${data.certificateId}`);
      } else {
        alert(data.message || 'Failed to issue certificate');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to issue certificate');
    } finally {
      setIssuingCertLoading(false);
    }
  };

  // Launch in-website video player with first available lesson
  const handleStartLearning = (course: EnrolledCourse) => {
    setActiveLectureCourse(course);
    setCompletedLessonKeys(new Set(course.completedLessons || []));
    if (course.chapters && course.chapters.length > 0) {
      for (let c = 0; c < course.chapters.length; c++) {
        if (course.chapters[c].lessons && course.chapters[c].lessons.length > 0) {
          setCurrentPlayingLesson({
            chapterIdx: c,
            lessonIdx: 0,
            lesson: course.chapters[c].lessons[0],
          });
          return;
        }
      }
    }
    setCurrentPlayingLesson(null);
  };

  // Next lesson in syllabus
  const handleNextLesson = () => {
    if (!activeLectureCourse || !currentPlayingLesson) return;
    const chapters = activeLectureCourse.chapters || [];
    const { chapterIdx, lessonIdx } = currentPlayingLesson;
    const currentChapter = chapters[chapterIdx];

    // Mark current as completed and sync to server
    const lessonKey = `${chapterIdx}-${lessonIdx}-${currentPlayingLesson.lesson.title}`;
    setCompletedLessonKeys((prev) => new Set(prev).add(lessonKey));
    syncLessonProgress(activeLectureCourse.id, lessonKey, true);

    if (currentChapter && lessonIdx + 1 < (currentChapter.lessons?.length || 0)) {
      setCurrentPlayingLesson({
        chapterIdx,
        lessonIdx: lessonIdx + 1,
        lesson: currentChapter.lessons[lessonIdx + 1],
      });
    } else if (chapterIdx + 1 < chapters.length && (chapters[chapterIdx + 1].lessons?.length || 0) > 0) {
      setCurrentPlayingLesson({
        chapterIdx: chapterIdx + 1,
        lessonIdx: 0,
        lesson: chapters[chapterIdx + 1].lessons[0],
      });
    }
  };

  // Previous lesson in syllabus
  const handlePrevLesson = () => {
    if (!activeLectureCourse || !currentPlayingLesson) return;
    const chapters = activeLectureCourse.chapters || [];
    const { chapterIdx, lessonIdx } = currentPlayingLesson;

    if (lessonIdx > 0) {
      setCurrentPlayingLesson({
        chapterIdx,
        lessonIdx: lessonIdx - 1,
        lesson: chapters[chapterIdx].lessons[lessonIdx - 1],
      });
    } else if (chapterIdx > 0) {
      const prevChapter = chapters[chapterIdx - 1];
      const prevLessons = prevChapter.lessons || [];
      if (prevLessons.length > 0) {
        setCurrentPlayingLesson({
          chapterIdx: chapterIdx - 1,
          lessonIdx: prevLessons.length - 1,
          lesson: prevLessons[prevLessons.length - 1],
        });
      }
    }
  };

  // Fetch enrolled courses for the logged-in user
  useEffect(() => {
    async function fetchEnrolledCourses() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/enrollments/my-learning?email=${encodeURIComponent(user.email)}`, {
          headers,
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          setCourses(data.courses);
        }
      } catch (err) {
        console.error('Failed to fetch enrolled learning courses:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchEnrolledCourses();
    }
  }, [user, token, authLoading]);

  // Filtered courses based on active tab
  const filteredCourses = courses.filter((c) => {
    if (filterType === 'all') return true;
    return c.type === filterType;
  });

  // Calculate high-level metrics
  const totalLessonsAvailable = courses.reduce((acc, c) => acc + (c.totalLessons || 0), 0);
  const certificatesEarned = courses.filter((c) => c.certificateUnlocked).length;

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navWrapper}>
          <Link href="/" className={styles.brandLink} title="Binary Vidya">
            <img
              src="/images/binary-vidya-icon.png"
              alt="Binary Vidya"
              className={styles.brandNavIcon}
            />
            <img
              src="/images/binary-vidya-wordmark.png"
              alt="Binary Vidya"
              className={styles.brandNavWordmark}
            />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/#courses" className={styles.navBtn}>
              Courses
            </Link>
            <Link href="/training-and-internship" className={styles.navBtn}>
              Training &amp; Internships
            </Link>
            <Link href="/my-learning" className={styles.navBtn}>
              My Learning
            </Link>
            {user && (
              <Link
                href="/profile"
                className={`${styles.navBtn} ${styles.profileNavBtn}`}
                title="Profile Settings"
              >
                <div className={styles.profileNavAvatar}>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className={styles.profileNavAvatarImg}
                    />
                  ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <span>{user.name || 'Profile'}</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {authLoading ? (
        <div style={{ padding: '80px 24px', textAlign: 'center', color: '#64748b' }}>
          Verifying student profile session...
        </div>
      ) : !user ? (
        /* Not Logged In State */
        <div className={styles.emptyState}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <img
              src="/images/binary-vidya-icon.png"
              alt="Binary Vidya"
              style={{ height: '60px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <h2 className={styles.emptyTitle}>Sign In to View Your Enrolled Courses</h2>
          <p className={styles.emptySubtitle}>
            Access your personalized learning portal, ongoing batches, hands-on code projects, and certificates.
          </p>
          <Link href="/login" className={styles.exploreBtn}>
            Sign In to Account <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          {/* Hero Welcome Header */}
          <header className={styles.heroHeader}>
            <div className={styles.heroContent}>
              <div className={styles.welcomeBadge}>
                <Sparkles size={14} /> Student Learning Workspace
              </div>
              <h1 className={styles.heroTitle}>Welcome back, {user.name || 'Engineer'}!</h1>
              <p className={styles.heroSubtitle}>
                Here are the active courses, specializations, and internship cohorts associated with your account ({user.email}).
              </p>

              {/* Metrics Row */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIconBox} style={{ background: '#eff6ff', color: '#2563eb' }}>
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <div className={styles.statValue}>{courses.length}</div>
                    <div className={styles.statLabel}>Enrolled Batches</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIconBox} style={{ background: '#faf5ff', color: '#7c3aed' }}>
                    <Video size={22} />
                  </div>
                  <div>
                    <div className={styles.statValue}>{totalLessonsAvailable}</div>
                    <div className={styles.statLabel}>Total Video Lectures</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIconBox} style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Award size={22} />
                  </div>
                  <div>
                    <div className={styles.statValue}>{certificatesEarned}</div>
                    <div className={styles.statLabel}>Certificates Unlocked</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Dashboard Body */}
          <main className={styles.mainLayout}>
            {/* Filter Tabs Bar */}
            <div className={styles.controlsBar}>
              <div className={styles.tabButtonsRow}>
                <button
                  onClick={() => setFilterType('all')}
                  className={`${styles.tabBtn} ${filterType === 'all' ? styles.tabBtnActive : ''}`}
                >
                  All Enrolled Programs ({courses.length})
                </button>
                <button
                  onClick={() => setFilterType('course')}
                  className={`${styles.tabBtn} ${filterType === 'course' ? styles.tabBtnActive : ''}`}
                >
                  Technical Courses ({courses.filter((c) => c.type === 'course').length})
                </button>
                <button
                  onClick={() => setFilterType('internship')}
                  className={`${styles.tabBtn} ${filterType === 'internship' ? styles.tabBtnActive : ''}`}
                >
                  Training &amp; Internships ({courses.filter((c) => c.type === 'internship').length})
                </button>
              </div>

              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                Lifetime Perpetual License • Active
              </span>
            </div>

            {/* Content Display */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                Fetching your enrolled programs and video records...
              </div>
            ) : filteredCourses.length === 0 ? (
              /* Empty State (User has 0 enrollments) */
              <div className={styles.emptyState}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <img
                    src="/images/binary-vidya-icon.png"
                    alt="Binary Vidya"
                    style={{ height: '54px', width: 'auto', objectFit: 'contain' }}
                  />
                </div>
                <h3 className={styles.emptyTitle}>No Enrolled Programs Found</h3>
                <p className={styles.emptySubtitle}>
                  You are not currently enrolled in any courses or batches under this category. Discover our flagship technical roadmaps to get started.
                </p>
                <Link href="/courses" className={styles.exploreBtn}>
                  Explore Available Masterclasses <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              /* Enrolled Courses Grid */
              <div className={styles.enrolledGrid}>
                {filteredCourses.map((enrolled) => (
                  <div key={enrolled.id} className={styles.courseCard}>
                    {/* Banner & Thumbnail */}
                    <div className={styles.cardBanner}>
                      {enrolled.thumbnail ? (
                        <img src={enrolled.thumbnail} alt={enrolled.title} className={styles.thumbnailImg} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          <PlayCircle size={48} opacity={0.8} />
                        </div>
                      )}

                      <div className={styles.bannerOverlay}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className={styles.batchBadge}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ffffff', display: 'inline-block' }} />
                            {enrolled.batchName}
                          </div>
                          <span className={styles.categoryBadge}>{enrolled.category}</span>
                        </div>

                        <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600 }}>
                          {enrolled.duration} • {enrolled.totalLessons} Lectures Available
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className={styles.cardBody}>
                      <h3 className={styles.courseTitle}>{enrolled.title}</h3>
                      <p className={styles.courseDesc}>{enrolled.description}</p>

                      {/* Progress Section */}
                      <div className={styles.progressContainer}>
                        <div className={styles.progressMeta}>
                          <span style={{ color: '#0f172a' }}>
                            {enrolled.progressPercentage}% Completed
                          </span>
                          <span style={{ color: '#64748b' }}>
                            {enrolled.completedLessonsCount} of {enrolled.totalLessons} lectures
                          </span>
                        </div>
                        <div className={styles.progressBarBg}>
                          <div
                            className={styles.progressBarFill}
                            style={{ width: `${Math.max(4, enrolled.progressPercentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Metadata Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                        <span>
                          Instructor: <strong>{enrolled.instructor}</strong>
                        </span>
                        <span style={{ color: enrolled.certificateUnlocked ? '#059669' : '#d97706', fontWeight: 700 }}>
                          {enrolled.certificateUnlocked ? '🏆 Certificate Unlocked' : '⏳ Certificate in Progress'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className={styles.cardFooter} style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleStartLearning(enrolled)}
                          className={styles.startLearningBtn}
                        >
                          <PlayCircle size={16} /> Start Learning
                        </button>

                        {enrolled.certificateId ? (
                          <button
                            type="button"
                            onClick={() => handleClaimOrDownloadCertificate(enrolled)}
                            style={{
                              padding: '12px 18px',
                              borderRadius: '10px',
                              background: '#ecfdf5',
                              border: '1.5px solid #6ee7b7',
                              color: '#065f46',
                              fontSize: '13px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                              transition: 'all 0.2s ease',
                            }}
                            title="View official verified certificate"
                          >
                            <Award size={16} color="#059669" />
                            View / Download Certificate
                          </button>
                        ) : enrolled.certificateUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleClaimOrDownloadCertificate(enrolled)}
                            style={{
                              padding: '12px 18px',
                              borderRadius: '10px',
                              background: '#fef3c7',
                              border: '1.5px solid #fcd34d',
                              color: '#92400e',
                              fontSize: '13px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)',
                              transition: 'all 0.2s ease',
                            }}
                            title="Claim your verified completion certificate"
                          >
                            <Award size={16} color="#d97706" />
                            Claim Certificate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleClaimOrDownloadCertificate(enrolled)}
                            style={{
                              padding: '12px 18px',
                              borderRadius: '10px',
                              background: '#f8fafc',
                              border: '1.5px solid #e2e8f0',
                              color: '#64748b',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s ease',
                            }}
                            title={`Complete all ${enrolled.totalLessons} videos to unlock certificate`}
                          >
                            <Lock size={15} color="#94a3b8" />
                            Locked ({enrolled.completedLessonsCount}/{enrolled.totalLessons} Videos)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* Interactive In-Website Video Player Theater Modal */}
      {activeLectureCourse && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setActiveLectureCourse(null);
            setCurrentPlayingLesson(null);
          }}
        >
          <div className={styles.theaterModalCard} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                    {activeLectureCourse.batchName}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>•</span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    {activeLectureCourse.chapters?.length || 0} Chapters ({activeLectureCourse.totalLessons || 0} Lectures)
                  </span>
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {activeLectureCourse.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveLectureCourse(null);
                  setCurrentPlayingLesson(null);
                }}
                className={styles.closeBtn}
                title="Close Player"
              >
                <X size={18} />
              </button>
            </div>

            {/* Split Screen Theater Layout */}
            <div className={styles.theaterLayout}>
              {/* Left Column: Custom In-Website Video Player */}
              <div className={styles.theaterVideoArea}>
                {currentPlayingLesson ? (
                  <>
                    <VideoPlayer
                      key={`${activeLectureCourse.id}-${currentPlayingLesson.chapterIdx}-${currentPlayingLesson.lessonIdx}-${currentPlayingLesson.lesson.title}`}
                      src={currentPlayingLesson.lesson.videoUrl}
                      title={currentPlayingLesson.lesson.title}
                      poster={currentPlayingLesson.lesson.thumbnail || activeLectureCourse.thumbnail}
                      autoPlay={true}
                      onEnded={handleNextLesson}
                    />

                    {/* Lesson Details & Navigation Controls */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                background: '#2563eb',
                                color: '#fff',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              CH {currentPlayingLesson.chapterIdx + 1} • LESSON {currentPlayingLesson.lessonIdx + 1}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} /> {currentPlayingLesson.lesson.duration || '15 Mins'}
                            </span>
                          </div>
                          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {currentPlayingLesson.lesson.title}
                          </h2>
                          {currentPlayingLesson.lesson.description && (
                            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                              {currentPlayingLesson.lesson.description}
                            </p>
                          )}
                        </div>

                        {/* Mark Completed Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            const lessonKey = `${currentPlayingLesson.chapterIdx}-${currentPlayingLesson.lessonIdx}-${currentPlayingLesson.lesson.title}`;
                            const isDone = completedLessonKeys.has(lessonKey);
                            const nextCompleted = !isDone;
                            setCompletedLessonKeys((prev) => {
                              const next = new Set(prev);
                              if (nextCompleted) next.add(lessonKey);
                              else next.delete(lessonKey);
                              return next;
                            });
                            syncLessonProgress(activeLectureCourse.id, lessonKey, nextCompleted);
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: completedLessonKeys.has(
                              `${currentPlayingLesson.chapterIdx}-${currentPlayingLesson.lessonIdx}-${currentPlayingLesson.lesson.title}`
                            )
                              ? '1px solid #10b981'
                              : '1px solid #cbd5e1',
                            background: completedLessonKeys.has(
                              `${currentPlayingLesson.chapterIdx}-${currentPlayingLesson.lessonIdx}-${currentPlayingLesson.lesson.title}`
                            )
                              ? '#ecfdf5'
                              : '#ffffff',
                            color: completedLessonKeys.has(
                              `${currentPlayingLesson.chapterIdx}-${currentPlayingLesson.lessonIdx}-${currentPlayingLesson.lesson.title}`
                            )
                              ? '#059669'
                              : '#475569',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <CheckCircle2 size={15} />
                          {completedLessonKeys.has(
                            `${currentPlayingLesson.chapterIdx}-${currentPlayingLesson.lessonIdx}-${currentPlayingLesson.lesson.title}`
                          )
                            ? 'Completed'
                            : 'Mark Complete'}
                        </button>
                      </div>

                      {/* Next / Previous Navigation */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '12px',
                          borderTop: '1px solid #f1f5f9',
                        }}
                      >
                        <button
                          type="button"
                          onClick={handlePrevLesson}
                          disabled={currentPlayingLesson.chapterIdx === 0 && currentPlayingLesson.lessonIdx === 0}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            color: '#475569',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor:
                              currentPlayingLesson.chapterIdx === 0 && currentPlayingLesson.lessonIdx === 0
                                ? 'not-allowed'
                                : 'pointer',
                            opacity: currentPlayingLesson.chapterIdx === 0 && currentPlayingLesson.lessonIdx === 0 ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <ChevronLeft size={15} /> Previous Lesson
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {activeLectureCourse.certificateId ? (
                            <button
                              type="button"
                              onClick={() => handleClaimOrDownloadCertificate(activeLectureCourse)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                border: '1px solid #6ee7b7',
                                background: '#ecfdf5',
                                color: '#065f46',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                              title="View official verified course certificate"
                            >
                              <Award size={15} color="#059669" />
                              View Certificate
                            </button>
                          ) : activeLectureCourse.certificateUnlocked ? (
                            <button
                              type="button"
                              onClick={() => handleClaimOrDownloadCertificate(activeLectureCourse)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                border: '1px solid #fcd34d',
                                background: '#fef3c7',
                                color: '#92400e',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                              title="Claim verified completion certificate"
                            >
                              <Award size={15} color="#d97706" />
                              Claim Certificate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleClaimOrDownloadCertificate(activeLectureCourse)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                color: '#64748b',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                              title={`Complete all ${activeLectureCourse.totalLessons} videos to unlock certificate`}
                            >
                              <Lock size={14} color="#94a3b8" />
                              Locked ({activeLectureCourse.completedLessonsCount || completedLessonKeys.size}/{activeLectureCourse.totalLessons})
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleNextLesson}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#2563eb',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                            }}
                          >
                            Next Lesson <ChevronRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    Select a lecture from the curriculum track on the right to start watching.
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Playlist Sidebar */}
              <div className={styles.theaterPlaylistArea}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Course Curriculum
                  </span>
                  <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700 }}>
                    {completedLessonKeys.size} Completed
                  </span>
                </div>

                {activeLectureCourse.chapters && activeLectureCourse.chapters.length > 0 ? (
                  activeLectureCourse.chapters.map((chapter, chIdx) => (
                    <div key={chapter.id || chIdx} className={styles.chapterBox}>
                      <div className={styles.chapterHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: '#2563eb',
                              color: '#ffffff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            CH {chIdx + 1}
                          </span>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{chapter.title}</strong>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                          {chapter.lessons?.length || 0} Lectures
                        </span>
                      </div>

                      <div>
                        {chapter.lessons &&
                          chapter.lessons.map((lesson, lIdx) => {
                            const isCurrent =
                              currentPlayingLesson?.chapterIdx === chIdx && currentPlayingLesson?.lessonIdx === lIdx;
                            const isDone = completedLessonKeys.has(`${chIdx}-${lIdx}-${lesson.title}`);

                            return (
                              <div
                                key={lesson.id || lIdx}
                                className={`${styles.lessonRow} ${isCurrent ? styles.lessonRowActive : ''}`}
                                onClick={() =>
                                  setCurrentPlayingLesson({
                                    chapterIdx: chIdx,
                                    lessonIdx: lIdx,
                                    lesson,
                                  })
                                }
                                style={{ cursor: 'pointer' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                  {lesson.thumbnail ? (
                                    <img src={lesson.thumbnail} alt={lesson.title} className={styles.lessonThumb} />
                                  ) : (
                                    <div
                                      className={styles.lessonThumb}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isCurrent ? '#2563eb' : '#94a3b8',
                                        background: isCurrent ? '#dbeafe' : '#0f172a',
                                      }}
                                    >
                                      {isCurrent ? <Play size={16} fill="#2563eb" /> : <Film size={16} />}
                                    </div>
                                  )}

                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: isCurrent ? '#2563eb' : '#1e293b',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {lesson.title}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                      <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Clock size={11} /> {lesson.duration || '15m'}
                                      </span>
                                      {isCurrent && <span className={styles.playingBadge}>Playing</span>}
                                      {isDone && (
                                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                          <CheckCircle2 size={11} /> Done
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  style={{
                                    border: 'none',
                                    background: isCurrent ? '#2563eb' : '#f1f5f9',
                                    color: isCurrent ? '#ffffff' : '#64748b',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                  }}
                                >
                                  {isCurrent ? <Play size={12} fill="#ffffff" /> : <Play size={12} />}
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '12px' }}>
                    No syllabus chapters uploaded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Name Confirmation Modal Before Certificate Issuance */}
      {confirmingCourseForCert && (
        <ConfirmNameModal
          isOpen={!!confirmingCourseForCert}
          onClose={() => setConfirmingCourseForCert(null)}
          defaultName={user?.name || ''}
          courseTitle={confirmingCourseForCert.title}
          onConfirm={handleConfirmCertificateName}
          loading={issuingCertLoading}
        />
      )}
    </div>
  );
}
