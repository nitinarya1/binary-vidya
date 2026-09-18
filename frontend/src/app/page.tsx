'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import styles from './home.module.css';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Code2,
  Users,
  Award,
  Star,
  CheckCircle,
  LogOut,
  User as UserIcon,
  Terminal,
  Cpu,
  Cloud,
  ChevronRight,
  ExternalLink,
  Laptop,
  Check,
  Film,
  Clock,
  Layers,
  Video,
  X,
  PlayCircle,
  Zap,
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

interface CourseItem {
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

export default function HomePage() {
  const { user, logout, isLoading, isAdmin } = useAuth();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [previewCourse, setPreviewCourse] = useState<CourseItem | null>(null);

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoadingCourses(true);
        const url =
          selectedCategory === 'all'
            ? '/api/courses'
            : `/api/courses?category=${encodeURIComponent(selectedCategory)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          setCourses(data.courses);
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
        }
      } catch (err) {
        console.error('Failed to load courses from backend:', err);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadCourses();
  }, [selectedCategory]);

  return (
    <div className={styles.container}>
      {/* Sticky Navigation Bar */}
      <nav className={styles.navbar}>
        <div className={styles.navWrapper}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.brandLogo}>BV</div>
            <div>
              <div className={styles.brandName}>Binary Vidya</div>
              <div className={styles.brandTagline}>Technical Academy</div>
            </div>
          </Link>

          <div className={styles.navLinks}>
            <Link
              href="/training-and-internship"
              className={styles.navLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#2563eb',
                fontWeight: 800,
                background: '#eff6ff',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
              }}
            >
              <Sparkles size={14} color="#2563eb" />
              <span>Training &amp; Internship</span>
              <span
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '100px',
                  textTransform: 'uppercase',
                }}
              >
                Weekend Batch
              </span>
            </Link>
            <a href="#about" className={styles.navLink}>
              About Us
            </a>
            <a href="#courses" className={styles.navLink}>
              Courses
            </a>
            <a href="#features" className={styles.navLink}>
              Features
            </a>
            <a href="#curriculum" className={styles.navLink}>
              Curriculum
            </a>
          </div>

          <div className={styles.navActions}>
            {isLoading ? (
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Loading...</div>
            ) : user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link
                  href="/my-learning"
                  id="nav-my-learning-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb',
                    border: '1px solid rgba(147, 197, 253, 0.5)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <BookOpen size={15} /> My Learning
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    id="nav-admin-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: 'rgba(15, 23, 42, 0.06)',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      textDecoration: 'none',
                    }}
                  >
                    Admin
                  </Link>
                )}
                <div className={styles.userPill}>
                  <Link
                    href="/profile"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}
                    title="View & Edit Profile"
                  >
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
              </div>
            ) : (
              <>
                <Link href="/login" id="nav-login-link" className={styles.signInBtn}>
                  Sign In
                </Link>
                <Link href="/login" id="nav-register-link" className={styles.signUpBtn}>
                  Get Started <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTag}>
            <Sparkles size={15} /> Next-Gen Technical Academy & Masterclasses
          </div>
          <h1 className={styles.heroTitle}>
            Master Computer Science with{' '}
            <span className={styles.heroGradientText}>Binary Vidya</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Accelerate your engineering career with hands-on roadmaps, interactive code assessments,
            and industry-verified certifications in Full-Stack, DSA, Cloud, and AI.
          </p>

          <div className={styles.heroCtaRow}>
            <Link href="/login" id="hero-cta-start" className={styles.heroPrimaryBtn}>
              Start Learning Today <ArrowRight size={18} />
            </Link>
            <a href="#courses" className={styles.heroSecondaryBtn}>
              Explore Courses <ChevronRight size={18} />
            </a>
          </div>

          {/* Key Metrics Counter */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>15,000+</div>
              <div className={styles.metricLabel}>Active Learners</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>120+</div>
              <div className={styles.metricLabel}>Technical Masterclasses</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>96%</div>
              <div className={styles.metricLabel}>Career Success Rate</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>4.9/5</div>
              <div className={styles.metricLabel}>Student Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <BookOpen size={14} /> Who We Are
          </div>
          <h2 className={styles.sectionTitle}>Built for Engineers by Engineers</h2>
          <p className={styles.sectionSubtitle}>
            Binary Vidya was founded to bridge the gap between academic theory and high-impact
            production software engineering.
          </p>
        </div>

        <div className={styles.aboutGrid}>
          <div className={styles.aboutTextCard}>
            <div className={styles.aboutLead}>
              We transform ambitious learners into world-class software developers through rigorous,
              project-driven education.
            </div>
            <p className={styles.aboutBody}>
              Traditional education moves too slow for modern tech. At Binary Vidya, every syllabus
              is continuously updated to match modern industry demands. Whether you are mastering
              MERN architecture, optimizing algorithms, or orchestrating cloud containers, you write
              production-grade code from day one.
            </p>

            <div className={styles.aboutPillars}>
              <div className={styles.pillarCard}>
                <div className={styles.pillarIcon}>
                  <Terminal size={20} />
                </div>
                <div className={styles.pillarTitle}>Project-Driven Code</div>
                <div className={styles.pillarDesc}>
                  Real-world architecture, API design, unit tests, and CI/CD pipelines.
                </div>
              </div>

              <div className={styles.pillarCard}>
                <div className={styles.pillarIcon}>
                  <ShieldCheck size={20} />
                </div>
                <div className={styles.pillarTitle}>Enterprise Security</div>
                <div className={styles.pillarDesc}>
                  End-to-end OAuth, JWT sessions, encrypted storage, and data protection.
                </div>
              </div>

              <div className={styles.pillarCard}>
                <div className={styles.pillarIcon}>
                  <Award size={20} />
                </div>
                <div className={styles.pillarTitle}>Verified Credentials</div>
                <div className={styles.pillarDesc}>
                  Shareable, cryptographic digital certifications for LinkedIn and resumes.
                </div>
              </div>

              <div className={styles.pillarCard}>
                <div className={styles.pillarIcon}>
                  <Users size={20} />
                </div>
                <div className={styles.pillarTitle}>Peer Mentorship</div>
                <div className={styles.pillarDesc}>
                  Live code review sessions, active community Discord, and mentor guidance.
                </div>
              </div>
            </div>
          </div>

          <div className={styles.aboutVisualCard}>
            <div className={styles.visualHeader}>
              <div className={styles.visualAvatar}>BV</div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>The Binary Vidya Standard</div>
                <div style={{ fontSize: '13px', color: '#93c5fd' }}>Empowering 15,000+ developers</div>
              </div>
            </div>

            <div className={styles.visualQuote}>
              &ldquo;The only way to master modern development is by shipping real systems. We don&apos;t just
              teach syntax; we build technical instincts, clean architecture, and problem-solving resilience.&rdquo;
            </div>

            <div className={styles.visualHighlights}>
              <div className={styles.visualItem}>
                <Check size={18} color="#60a5fa" />
                <span>Zero fluff. 100% practical, hands-on masterclasses</span>
              </div>
              <div className={styles.visualItem}>
                <Check size={18} color="#60a5fa" />
                <span>Dual verification: Email & phone based multi-factor security</span>
              </div>
              <div className={styles.visualItem}>
                <Check size={18} color="#60a5fa" />
                <span>One-click Google authentication with Chrome profile discovery</span>
              </div>
              <div className={styles.visualItem}>
                <Check size={18} color="#60a5fa" />
                <span>Instant interactive assessments & live course dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section id="courses" className={styles.section} style={{ background: '#ffffff', maxWidth: '100%', padding: '90px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Code2 size={14} /> Comprehensive Tracks
            </div>
            <h2 className={styles.sectionTitle}>Flagship Engineering Masterclasses</h2>
            <p className={styles.sectionSubtitle}>
              Curated roadmaps designed to take you from foundational logic to production-grade engineering mastery.
            </p>
          </div>

          {/* Category Filter Bar */}
          <div className={styles.filterBarContainer}>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`${styles.filterPill} ${selectedCategory === 'all' ? styles.filterPillActive : ''}`}
            >
              All Tracks ({courses.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.filterPill} ${selectedCategory === cat ? styles.filterPillActive : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Dynamic Courses Grid */}
          {loadingCourses ? (
            <div className={styles.coursesGrid}>
              {[1, 2, 3].map((n) => (
                <div key={n} className={styles.courseCard} style={{ minHeight: '380px', opacity: 0.6 }}>
                  <div style={{ height: '180px', background: '#f1f5f9' }} />
                  <div style={{ padding: '24px' }}>
                    <div style={{ height: '14px', width: '40%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }} />
                    <div style={{ height: '22px', width: '80%', background: '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }} />
                    <div style={{ height: '50px', width: '100%', background: '#f1f5f9', borderRadius: '4px', marginBottom: '16px' }} />
                    <div style={{ height: '20px', width: '50%', background: '#e2e8f0', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <BookOpen size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                No courses found in this category
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '18px' }}>
                Try selecting &ldquo;All Tracks&rdquo; or check back shortly as new curricula are published.
              </p>
              <button
                onClick={() => setSelectedCategory('all')}
                className={styles.filterPill}
                style={{ background: '#2563eb', color: '#fff', borderColor: '#2563eb' }}
              >
                Show All Courses
              </button>
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {courses.map((course) => (
                <div key={course.id} className={styles.courseCard}>
                  {/* Thumbnail / Header Banner */}
                  {course.thumbnail ? (
                    <div className={styles.thumbnailWrapper}>
                      <img src={course.thumbnail} alt={course.title} className={styles.thumbnailImg} />
                      <div className={styles.thumbnailOverlay}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={styles.levelPill}>{course.level || 'All Levels'}</span>
                          <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 700, background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px' }}>
                            {course.duration}
                          </span>
                        </div>
                        <div className={styles.courseTrackBadge} style={{ alignSelf: 'flex-start' }}>
                          {course.category}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.courseBanner}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className={styles.courseTrackBadge}>{course.category}</div>
                        <span className={styles.levelPill}>{course.level || 'All Levels'}</span>
                      </div>
                      <div className={styles.courseDuration}>
                        {course.duration} • {course.totalLessons || 15} Lessons
                      </div>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className={styles.courseBody}>
                    <div className={styles.courseRating}>
                      <Star size={15} fill="#f59e0b" color="#f59e0b" />
                      <span>{course.rating || 4.9}</span>
                      <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>
                        ({(course.enrolledCount || 120).toLocaleString()} enrolled)
                      </span>
                    </div>

                    <h3 className={styles.courseTitle}>{course.title}</h3>
                    <p className={styles.courseDesc}>{course.description}</p>

                    {/* Metadata Pill Row */}
                    <div className={styles.metaRow}>
                      <span className={styles.metaItem}>
                        <Layers size={14} color="#2563eb" />
                        <strong>{course.chaptersCount || course.chapters?.length || 1}</strong> Chapters
                      </span>
                      <span>•</span>
                      <span className={styles.metaItem}>
                        <Video size={14} color="#2563eb" />
                        <strong>{course.totalLessons || 12}</strong> Video Lectures
                      </span>
                    </div>

                    {/* Curriculum Preview Modal Trigger */}
                    {course.chapters && course.chapters.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPreviewCourse(course)}
                        className={styles.curriculumLinkBtn}
                      >
                        <PlayCircle size={14} /> View Syllabus &amp; Lectures
                      </button>
                    )}

                    <div className={styles.courseFooter}>
                      <span className={styles.coursePrice}>
                        {course.price && course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'Free Access'}
                      </span>
                      <Link href={`/courses/${course.slug || course.id}`} className={styles.courseActionBtn}>
                        Enroll Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom All Courses Link */}
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link
              href="/courses"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                color: '#1e293b',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Explore All Courses &amp; Specializations <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>
            <Sparkles size={14} /> Interactive Platform
          </div>
          <h2 className={styles.sectionTitle}>The Binary Vidya Learning Experience</h2>
          <p className={styles.sectionSubtitle}>
            Modern web technology meets pedagogy for maximum knowledge retention.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureBox}>
            <div className={styles.featureIconWrapper}>
              <ShieldCheck size={24} />
            </div>
            <h3 className={styles.featureTitle}>Dual Email / Mobile Auth</h3>
            <p className={styles.featureDesc}>
              Log in seamlessly via your email address or mobile number with Bcrypt encryption and 7-day
              signed JWT tokens.
            </p>
          </div>

          <div className={styles.featureBox}>
            <div className={styles.featureIconWrapper}>
              <Cpu size={24} />
            </div>
            <h3 className={styles.featureTitle}>Google Instant OAuth</h3>
            <p className={styles.featureDesc}>
              One-click Google authentication with active Chrome profile discovery and verified account
              synchronization.
            </p>
          </div>

          <div className={styles.featureBox}>
            <div className={styles.featureIconWrapper}>
              <Cloud size={24} />
            </div>
            <h3 className={styles.featureTitle}>Secure Nodemailer Recovery</h3>
            <p className={styles.featureDesc}>
              Fast 4-digit transactional email OTP password reset with anti-spam inbox optimization and
              plain-text fallbacks.
            </p>
          </div>

          <div className={styles.featureBox}>
            <div className={styles.featureIconWrapper}>
              <Laptop size={24} />
            </div>
            <h3 className={styles.featureTitle}>Interactive Video Assessments</h3>
            <p className={styles.featureDesc}>
              Watch high-definition lectures with embedded coding quizzes and instant feedback checkpoints.
            </p>
          </div>

          <div className={styles.featureBox}>
            <div className={styles.featureIconWrapper}>
              <Code2 size={24} />
            </div>
            <h3 className={styles.featureTitle}>Live In-Browser Code Labs</h3>
            <p className={styles.featureDesc}>
              Practice programming challenges directly in your browser without installing local compilers
              or complex configurations.
            </p>
          </div>

          <div className={styles.featureBox}>
            <div className={styles.featureIconWrapper}>
              <Award size={24} />
            </div>
            <h3 className={styles.featureTitle}>Digital Certificates</h3>
            <p className={styles.featureDesc}>
              Earn shareable, tamper-proof credentials to showcase your projects on LinkedIn and to
              prospective recruiters.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className={styles.ctaWrapper}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Ready to Master the Future of Code?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of developers mastering computer science with Binary Vidya. Create your free
            account and start learning today.
          </p>
          <Link href="/login" id="cta-bottom-register-btn" className={styles.ctaBtn}>
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerWrapper}>
          <div>
            <div className={styles.brandLink}>
              <div className={styles.brandLogo}>BV</div>
              <span className={styles.brandName}>Binary Vidya</span>
            </div>
            <p className={styles.footerBrandDesc}>
              Binary Vidya is an engineering-first technical academy providing premier masterclasses,
              interactive assessments, and verified software engineering credentials.
            </p>
          </div>

          <div>
            <div className={styles.footerColTitle}>Navigation</div>
            <ul className={styles.footerColLinks}>
              <li>
                <Link href="/" className={styles.footerLink}>
                  Home
                </Link>
              </li>
              <li>
                <a href="#about" className={styles.footerLink}>
                  About Us
                </a>
              </li>
              <li>
                <a href="#courses" className={styles.footerLink}>
                  Courses
                </a>
              </li>
              <li>
                <a href="#features" className={styles.footerLink}>
                  Platform
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className={styles.footerColTitle}>Tracks</div>
            <ul className={styles.footerColLinks}>
              <li>
                <a href="#courses" className={styles.footerLink}>
                  Full-Stack MERN
                </a>
              </li>
              <li>
                <a href="#courses" className={styles.footerLink}>
                  Data Structures & Algorithms
                </a>
              </li>
              <li>
                <a href="#courses" className={styles.footerLink}>
                  Cloud & DevOps
                </a>
              </li>
              <li>
                <a href="#courses" className={styles.footerLink}>
                  Machine Learning
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className={styles.footerColTitle}>Account & Access</div>
            <ul className={styles.footerColLinks}>
              <li>
                <Link href="/login" className={styles.footerLink}>
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/login" className={styles.footerLink}>
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/login" className={styles.footerLink}>
                  Forgot Password
                </Link>
              </li>
              <li>
                <a href="#about" className={styles.footerLink}>
                  Community Guidelines
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div>&copy; {new Date().getFullYear()} Binary Vidya Inc. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </footer>

      {/* Syllabus Preview Modal */}
      {previewCourse && (
        <div className={styles.syllabusModalOverlay} onClick={() => setPreviewCourse(null)}>
          <div className={styles.syllabusModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.syllabusModalHeader}>
              <div>
                <span className={styles.levelPill} style={{ marginBottom: '6px' }}>
                  {previewCourse.category}
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {previewCourse.title}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Complete Course Curriculum • {previewCourse.chapters?.length || 0} Chapters • {previewCourse.totalLessons || 0} Lectures
                </p>
              </div>
              <button onClick={() => setPreviewCourse(null)} className={styles.syllabusCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {previewCourse.chapters && previewCourse.chapters.length > 0 ? (
                previewCourse.chapters.map((ch, chIdx) => (
                  <div key={ch.id || chIdx} className={styles.syllabusChapterBox}>
                    <div className={styles.syllabusChapterHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                          CH {chIdx + 1}
                        </span>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{ch.title}</strong>
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                        {ch.lessons?.length || 0} Lectures
                      </span>
                    </div>

                    {ch.description && (
                      <p style={{ margin: '8px 16px', fontSize: '12px', color: '#64748b' }}>
                        {ch.description}
                      </p>
                    )}

                    <div>
                      {ch.lessons && ch.lessons.map((les, lIdx) => (
                        <div key={les.id || lIdx} className={styles.syllabusLessonRow}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            {les.thumbnail ? (
                              <img src={les.thumbnail} alt={les.title} className={styles.syllabusLessonThumb} />
                            ) : (
                              <div className={styles.syllabusLessonThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                <Film size={16} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                {les.title}
                              </div>
                              {les.description && (
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{les.description}</div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                            <Clock size={12} /> {les.duration || '15 Mins'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No syllabus uploaded yet for this course.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
                <button
                  onClick={() => setPreviewCourse(null)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: '#f1f5f9',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <Link
                  href={`/courses/${previewCourse.slug || previewCourse.id}`}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    background: '#2563eb',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Enroll in this Course <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
