'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from '../../app/home.module.css';
import { ALL_COMPANY_LOGOS } from '../common/CompanyLogos';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Code2,
  Users,
  Award,
  Star,
  CheckCircle2,
  LogOut,
  Cloud,
  Check,
  Film,
  Clock,
  Layers,
  X,
  Zap,
  Briefcase,
  Search,
  FileCheck2,
  Menu,
  ChevronDown,
  Building2,
  Lock,
  ArrowUp,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
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

const SAMPLE_CERT_IDS = [
  'BV-CERT-FRONTEND-2026',
  'BV-CERT-FULLSTACK-9842',
  'BV-CERT-DEVOPS-5120',
  'BV-CERT-AI-3301',
];

const FAQS = [
  {
    q: 'When are the live classes conducted for the Training & Internship program?',
    a: 'Classes are strictly held on Weekends (Every Saturday and Sunday) to ensure zero conflict with college exams, university schedules, or working hours. In addition, all live sessions are recorded in HD and available 24/7 in your dashboard.',
  },
  {
    q: 'Is the 2-Month Industrial Internship really 100% Free of Cost?',
    a: 'Yes! The 2-Month Industrial Internship is bundled completely free of charge (₹0 fee) along with the training tuition (₹2,400). You receive full industrial mentorship, code reviews, and live production experience at no additional charge.',
  },
  {
    q: 'What official credentials do I receive upon program completion?',
    a: 'Upon successful completion of the training and 2-month internship projects, you receive 4 verifiable credentials: (1) Training Completion Certificate, (2) 2-Month Industrial Internship Experience Letter, (3) Official Letter of Recommendation (LOR), and (4) Comprehensive Project & Course Transcript.',
  },
  {
    q: 'How does the Certificate Verification system work?',
    a: 'Every certificate and experience letter issued by Binary Vidya contains a unique tamper-proof ID (e.g., BV-CERT-FRONTEND-2026) and a dynamic QR code. Recruiters and employers can instantly verify credential authenticity by entering the ID into our central verification portal.',
  },
  {
    q: 'What payment modes are supported for course and training enrollments?',
    a: 'We use authentic Razorpay Checkout integration supporting all Indian payment methods including UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), NetBanking from 50+ banks, and Wallets.',
  },
  {
    q: 'Can I apply for career opportunities and instructor roles at Binary Vidya?',
    a: 'Absolutely! We are actively expanding our mentor network and engineering team. You can check our open roles on the Careers page and submit your profile directly.',
  },
];

export default function HomePageClient({
  initialPrograms = [],
  initialCourses = [],
}: {
  initialPrograms?: any[];
  initialCourses?: CourseItem[];
}) {
  const router = useRouter();
  const { user, logout, isLoading, isAdmin } = useAuth();

  // Training & Internship programs initialized from Server Data (eliminates flash of old data)
  const [trainingPrograms, setTrainingPrograms] = useState<any[]>(initialPrograms);
  const [activeSpotlightIdx, setActiveSpotlightIdx] = useState<number>(0);

  // Courses state initialized from Server Data
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(initialCourses.length === 0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [previewCourse, setPreviewCourse] = useState<CourseItem | null>(null);

  // Verification Search State
  const [verifyInput, setVerifyInput] = useState<string>('');
  const [verifyError, setVerifyError] = useState<string>('');

  // Mobile Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Background refresh to guarantee fresh client updates
  useEffect(() => {
    async function loadClientData() {
      // 1. Fetch live training programs if not preloaded or to revalidate
      try {
        const res = await fetch('/api/training-internship', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.programs) && data.programs.length > 0) {
          setTrainingPrograms(data.programs);
        }
      } catch (err) {
        console.warn('Background check for training programs:', err);
      }

      // 2. Fetch Courses
      try {
        if (selectedCategory !== 'all' || courses.length === 0) {
          setLoadingCourses(true);
        }
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

    loadClientData();
  }, [selectedCategory]);

  const handleInstantVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = verifyInput.trim();
    if (!cleanId) {
      setVerifyError('Please enter a valid Certificate ID');
      return;
    }
    setVerifyError('');
    router.push(`/certificates/${encodeURIComponent(cleanId)}`);
  };

  const handleSampleVerify = (id: string) => {
    setVerifyInput(id);
    setVerifyError('');
    router.push(`/certificates/${encodeURIComponent(id)}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Active spotlight program for hero card (strictly uses live DB program)
  const activeSpotlight =
    trainingPrograms[activeSpotlightIdx] ||
    trainingPrograms[0] ||
    null;

  return (
    <div className={styles.container}>
      {/* =====================================================================
          STICKY NAVBAR (Light Mode, Blue Shades UI, Action Buttons)
          ===================================================================== */}
      <nav className={styles.navbar}>
        <div className={styles.navWrapper}>
          {/* Brand Logo Lockup */}
          <Link href="/" className={styles.brandLink} title="Binary Vidya Academy">
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

          {/* Desktop Navigation Links */}
          <div className={styles.navLinks}>
            <a href="#programs" className={styles.navBtn}>
              Training &amp; Internships
            </a>
            <a href="#courses" className={styles.navBtn}>
              Courses
            </a>
            <Link href="/verify-certificate" className={styles.navBtn}>
              Verify Certificate
            </Link>
            <Link href="/careers" className={styles.navBtn}>
              Careers
            </Link>
          </div>

          {/* User Actions / Auth Controls */}
          <div className={styles.navActions}>
            {isLoading ? (
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Loading...</div>
            ) : user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link href="/my-learning" className={`${styles.navBtn} ${styles.desktopOnly}`}>
                  My Learning
                </Link>

                {isAdmin && (
                  <Link href="/super-admin" className={`${styles.navBtn} ${styles.desktopOnly}`}>
                    Admin
                  </Link>
                )}

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
                    ) : user.name ? (
                      user.name.charAt(0).toUpperCase()
                    ) : (
                      'U'
                    )}
                  </div>
                  <span className={styles.desktopOnly}>{user.name || 'Profile'}</span>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className={`${styles.navBtn} ${styles.desktopOnly}`}>
                  Sign In
                </Link>
                <Link href="/login" className={`${styles.navBtn} ${styles.desktopOnly}`} style={{ fontWeight: 700, color: '#2563eb' }}>
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={styles.mobileMenuToggle}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={styles.mobileDrawerOverlay} onClick={() => setMobileMenuOpen(false)}>
          <div className={styles.mobileDrawerCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileDrawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src="/images/binary-vidya-icon.png"
                  alt="Binary Vidya"
                  style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                />
                <img
                  src="/images/binary-vidya-wordmark.png"
                  alt="Binary Vidya"
                  style={{ height: '20px', width: 'auto', objectFit: 'contain' }}
                />
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={22} />
              </button>
            </div>

            <div className={styles.mobileDrawerLinks}>
              <Link
                href="/training-and-internship"
                className={styles.navBtn}
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Training &amp; Internships
              </Link>

              <a
                href="#courses"
                className={styles.navBtn}
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Courses
              </a>

              <Link
                href="/verify-certificate"
                className={styles.navBtn}
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Verify Certificate
              </Link>

              <Link
                href="/careers"
                className={styles.navBtn}
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Careers
              </Link>

              {user && (
                <>
                  <Link
                    href="/my-learning"
                    className={styles.navBtn}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Learning
                  </Link>
                  <Link
                    href="/profile"
                    className={`${styles.navBtn} ${styles.profileNavBtn}`}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className={styles.profileNavAvatar}>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'User'}
                          className={styles.profileNavAvatarImg}
                        />
                      ) : user.name ? (
                        user.name.charAt(0).toUpperCase()
                      ) : (
                        'U'
                      )}
                    </div>
                    <span>{user.name || 'Profile'}</span>
                  </Link>
                </>
              )}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link
                    href="/login"
                    className={styles.signInBtn}
                    style={{ textAlign: 'center' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    className={styles.signUpBtn}
                    style={{ justifyContent: 'center' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          HERO SECTION (Live DB Data Pre-rendered: Zero Flash)
          ===================================================================== */}
      <section className={styles.hero}>
        <div className={styles.heroGlowOrb} />
        <div className={styles.heroContainer}>
          {/* Left Column: Authoritative Messaging & CTAs */}
          <div className={styles.heroLeft}>
            <div className={styles.heroTag}>
              <span className={styles.heroPulseDot} />
              <Sparkles size={13} color="#2563eb" style={{ flexShrink: 0 }} />
              <span>Admissions Open • Weekend Batches 2026</span>
            </div>

            <h1 className={styles.heroTitle}>
              Accelerate Your Software Career with{' '}
              <span className={styles.heroGradientText}>Binary Vidya</span>
            </h1>

            <p className={styles.heroSubtitle}>
              India&apos;s premier modern technical academy. Master modern full-stack web engineering, cloud architectures, and applied AI with live weekend masterclasses, 2-month industrial internships, and 4 verified credentials.
            </p>

            <div className={styles.heroCtaGroup}>
              <Link href="/training-and-internship" className={styles.heroPrimaryBtn}>
                <Sparkles size={16} /> Explore Flagship Programs
              </Link>
              <a href="#courses" className={styles.heroSecondaryBtn}>
                <BookOpen size={16} /> Browse All Courses
              </a>
              <Link href="/verify-certificate" className={styles.heroVerifyLink}>
                <ShieldCheck size={16} /> Verify Credentials &rarr;
              </Link>
            </div>

            {/* Metrics Bar as 4 Clean Micro Cards */}
            <div className={styles.heroMetricsBar}>
              <div className={styles.heroMetricCard}>
                <span className={styles.heroMetricValue}>15,000+</span>
                <span className={styles.heroMetricLabel}>Enrolled Engineers</span>
              </div>
              <div className={styles.heroMetricCard}>
                <span className={styles.heroMetricValue} style={{ color: '#059669' }}>100% Free</span>
                <span className={styles.heroMetricLabel}>2-Month Internship</span>
              </div>
              <div className={styles.heroMetricCard}>
                <span className={styles.heroMetricValue} style={{ color: '#2563eb' }}>4 Verified</span>
                <span className={styles.heroMetricLabel}>Career Credentials</span>
              </div>
              <div className={styles.heroMetricCard}>
                <span className={styles.heroMetricValue} style={{ color: '#d97706' }}>₹12.5 LPA</span>
                <span className={styles.heroMetricLabel}>Avg Package Placed</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Flagship Hero Spotlight Card */}
          <div className={styles.heroRight}>
            {activeSpotlight && (
              <div className={styles.spotlightCard}>
                {/* Program Selector Tabs without ugly scrollbars */}
                {trainingPrograms.length > 1 && (
                  <div className={styles.spotlightTabs}>
                    {trainingPrograms.slice(0, 4).map((p, idx) => (
                      <button
                        key={p.id || idx}
                        type="button"
                        onClick={() => setActiveSpotlightIdx(idx)}
                        className={`${styles.spotlightTabBtn} ${activeSpotlightIdx === idx ? styles.spotlightTabBtnActive : ''}`}
                      >
                        {p.track || p.title.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Spotlight Thumbnail Image (Only when an actual image URL is provided) */}
                {activeSpotlight.thumbnail && activeSpotlight.thumbnail.trim() ? (
                  <div className={styles.spotlightThumbWrap}>
                    <img
                      src={activeSpotlight.thumbnail}
                      alt={activeSpotlight.title}
                      className={styles.spotlightThumbImg}
                      onError={(e) => {
                        const parent = (e.currentTarget as HTMLElement).parentElement;
                        if (parent) parent.style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}

                <div className={styles.spotlightHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src="/images/binary-vidya-icon.png"
                      alt="Binary Vidya"
                      style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
                    />
                    <span className={styles.spotlightBadge}>
                      {activeSpotlight.track || 'Flagship Cohort'}
                    </span>
                  </div>
                  <span className={styles.spotlightWeekendBadge}>
                    <Calendar size={12} />
                    {activeSpotlight.schedule?.badge || 'Weekend Live'}
                  </span>
                </div>

                <h2 className={styles.spotlightTitle}>{activeSpotlight.title}</h2>
                <p className={styles.spotlightSubtitle}>
                  {activeSpotlight.subtitle ||
                    'Master modern architectures, build production cloud projects, and complete a 2-month industrial internship with 4 verified credentials.'}
                </p>

                <div className={styles.spotlightPriceBox}>
                  <div className={styles.spotlightPriceRow}>
                    <span className={styles.spotlightPriceMain}>
                      ₹{(activeSpotlight.pricing?.trainingPrice || 2400).toLocaleString('en-IN')}
                    </span>
                    {activeSpotlight.pricing?.originalPrice && (
                      <span className={styles.spotlightPriceOld}>
                        ₹{activeSpotlight.pricing.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className={styles.spotlightDiscountPill}>
                      {activeSpotlight.pricing?.discountPercentage || 70}% OFF
                    </span>
                  </div>
                  <div className={styles.spotlightFreeInternshipTag}>
                    <CheckCircle2 size={15} color="#059669" />
                    <span>2-Month Industrial Internship Included (₹0 Fee)</span>
                  </div>
                </div>

                <div className={styles.spotlightFeatures}>
                  <div className={styles.spotlightFeatureItem}>
                    <Clock size={15} color="#2563eb" />
                    <span>Weekend Live Sessions + 24/7 HD Recordings</span>
                  </div>
                  <div className={styles.spotlightFeatureItem}>
                    <Code2 size={15} color="#2563eb" />
                    <span>Minor &amp; Major Production Cloud Projects</span>
                  </div>
                  <div className={styles.spotlightFeatureItem}>
                    <Award size={15} color="#2563eb" />
                    <span>4 Credentials: Certificate, Experience Letter, LOR &amp; Transcript</span>
                  </div>
                </div>

                <div className={styles.spotlightActions}>
                  <Link
                    href={`/training-and-internship?program=${activeSpotlight.slug || activeSpotlight.id}`}
                    className={styles.spotlightEnrollBtn}
                  >
                    <Zap size={14} /> Enroll Now
                  </Link>
                  <Link
                    href={`/training-and-internship?program=${activeSpotlight.slug || activeSpotlight.id}`}
                    className={styles.spotlightViewBtn}
                  >
                    View Syllabus &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          HIRING PARTNERS MARQUEE: VECTOR COMPANY LOGOS (NO TEXT NAMES)
          ===================================================================== */}
      <section className={styles.partnersSection}>
        <div className={styles.partnersHeading}>
          Our Learners &amp; Interns Are Hired By Top Global Tech Companies
        </div>
        <div className={styles.marqueeOuter}>
          <div className={styles.marqueeTrack}>
            {[...ALL_COMPANY_LOGOS, ...ALL_COMPANY_LOGOS, ...ALL_COMPANY_LOGOS].map((item, i) => (
              <div key={i} className={styles.partnerBadge} title={item.name}>
                <item.Component height={26} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          PROGRAMS CATALOG SHOWCASE (ALL PROGRAMS UPDATED BY SUPER ADMIN)
          ===================================================================== */}
      {trainingPrograms.length > 0 && (
        <section id="programs" className={styles.homeProgramsSection}>
          <div className={styles.sectionHeaderCenter}>
            <div className={styles.sectionBadge}>
              <GraduationCap size={14} /> Live Cohorts ({trainingPrograms.length})
            </div>
            <h2 className={styles.sectionMainTitle}>Super Admin Verified Programs</h2>
            <p className={styles.sectionDescription}>
              Accelerate your engineering journey with live weekend sessions, industry projects, and verified internship credentials.
            </p>
          </div>

          <div className={styles.homeProgramsGrid}>
            {trainingPrograms.map((prog) => {
              const trainingPrice =
                prog.pricing?.trainingPrice !== undefined ? prog.pricing.trainingPrice : 2400;
              const originalPrice =
                prog.pricing?.originalPrice !== undefined ? prog.pricing.originalPrice : 7999;
              const discountPct =
                prog.pricing?.discountPercentage ||
                Math.round((1 - trainingPrice / originalPrice) * 100) ||
                70;

              return (
                <div key={prog.id || prog.slug} className={styles.homeProgCard}>
                  {/* Thumbnail Image or Gradient Cover */}
                  {prog.thumbnail && prog.thumbnail.trim() ? (
                    <div className={styles.homeProgThumbBox}>
                      <img
                        src={prog.thumbnail}
                        alt={prog.title}
                        className={styles.homeProgThumbImg}
                        onError={(e) => {
                          const parent = (e.currentTarget as HTMLElement).parentElement;
                          if (parent) parent.style.display = 'none';
                        }}
                      />
                      <div className={styles.homeProgThumbBadges}>
                        <span className={styles.homeProgTrackBadge}>
                          {prog.track || prog.domain || 'Engineering'}
                        </span>
                        <span className={styles.homeProgTypeBadge}>
                          {prog.type || 'Internship'}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Body */}
                  <div className={styles.homeProgBody}>
                    <h3 className={styles.homeProgTitle} title={prog.title}>
                      {prog.title}
                    </h3>
                    <p className={styles.homeProgSubtitle}>
                      {prog.subtitle ||
                        'Comprehensive mentor-led weekend live sessions, capstone projects, and verified credentials.'}
                    </p>

                    <div className={styles.homeProgMetaRow}>
                      <div className={styles.homeProgMetaItem}>
                        <Calendar size={14} color="#059669" />
                        <span>{prog.schedule?.badge || 'Weekend Live Classes'}</span>
                      </div>
                      <div className={styles.homeProgMetaItem}>
                        <Clock size={14} color="#2563eb" />
                        <span>{prog.rawDuration || prog.duration?.total || '2 Months Internship + Training'}</span>
                      </div>
                    </div>

                    <div className={styles.homeProgPriceBlock}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                          Tuition Bundle
                        </div>
                        <span className={styles.homeProgPriceVal}>
                          ₹{trainingPrice.toLocaleString('en-IN')}
                        </span>
                        {originalPrice > trainingPrice && (
                          <span className={styles.homeProgOrigPrice}>
                            ₹{originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <span className={styles.homeProgDiscountPill}>{discountPct}% Off</span>
                    </div>

                    <div className={styles.homeProgBtnGroup}>
                      <Link
                        href={`/training-and-internship?program=${prog.slug || prog.id}`}
                        className={styles.homeProgViewBtn}
                      >
                        <BookOpen size={13} /> Syllabus
                      </Link>
                      <Link
                        href={`/training-and-internship?program=${prog.slug || prog.id}`}
                        className={styles.homeProgEnrollBtn}
                      >
                        <Zap size={13} /> Enroll Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link href="/training-and-internship" className={styles.heroPrimaryBtn}>
              <span>View All Training &amp; Internship Programs</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* =====================================================================
          FLAGSHIP SPOTLIGHT: 3 DEDICATED CURRICULUM SECTIONS
          ===================================================================== */}
      <section className={styles.curriculumSpotlightSection}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionBadge}>
            <Layers size={14} /> Comprehensive 3-Tier Architecture
          </div>
          <h2 className={styles.sectionMainTitle}>
            Industrial Engineering Curriculum &amp; Projects
          </h2>
          <p className={styles.sectionDescription}>
            Designed by senior tech architects from top product firms. From foundational HTML5/CSS3 to enterprise React 18, Next.js 14, and real-world microservices.
          </p>
        </div>

        <div className={styles.curriculum3Cards}>
          {/* Section 1 */}
          <div className={styles.currSectionCard}>
            <div className={styles.currCardHeader}>
              <div className={styles.currNumberBox}>1</div>
              <div>
                <span className={styles.currSectionTag}>Intensive Live Training</span>
                <h3 className={styles.currCardTitle}>Frontend Engineering Mastery</h3>
              </div>
            </div>
            <p className={styles.currCardDesc}>
              Weekend live cohorts covering Semantic HTML5, CSS Grid/Flexbox, ES6+ Javascript event loop, TypeScript scalability, and Next.js 14 App Router architectures.
            </p>
            <ul className={styles.currModulesList}>
              <li className={styles.currModuleItem}>
                <Check size={16} color="#2563eb" />
                <span>Responsive Glassmorphism &amp; CSS Variables</span>
              </li>
              <li className={styles.currModuleItem}>
                <Check size={16} color="#2563eb" />
                <span>Promises, Async/Await &amp; REST API Integration</span>
              </li>
              <li className={styles.currModuleItem}>
                <Check size={16} color="#2563eb" />
                <span>Next.js 14 Server Components &amp; SSR Optimizations</span>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className={styles.currSectionCard}>
            <div className={styles.currCardHeader}>
              <div className={styles.currNumberBox}>2</div>
              <div>
                <span className={styles.currSectionTag}>Minor Project Architecture</span>
                <h3 className={styles.currCardTitle}>Dynamic SaaS Dashboard</h3>
              </div>
            </div>
            <p className={styles.currCardDesc}>
              Construct an end-to-end analytics and management dashboard with role-based auth, client-side caching, dark/light modes, and real-time state management.
            </p>
            <ul className={styles.currModulesList}>
              <li className={styles.currModuleItem}>
                <Check size={16} color="#2563eb" />
                <span>Modular React Components with TypeScript</span>
              </li>
              <li className={styles.currModuleItem}>
                <Check size={16} color="#2563eb" />
                <span>Real-time Filtering, Pagination &amp; Search</span>
              </li>
              <li className={styles.currModuleItem}>
                <Check size={16} color="#2563eb" />
                <span>Clean Git branching &amp; pull request reviews</span>
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className={styles.currSectionCard}>
            <div className={styles.currCardHeader}>
              <div className={styles.currNumberBox}>3</div>
              <div>
                <span className={styles.currSectionTag}>Major Capstone Project</span>
                <h3 className={styles.currCardTitle}>Cloud LMS &amp; AI Platform</h3>
              </div>
            </div>
            <p className={styles.currCardDesc}>
              A production-ready, full-scale learning management and streaming platform featuring Razorpay payments, video pipelines, and cloud database indexing.
            </p>
            <ul className={styles.currModulesList}>
              <li className={styles.currModuleItem}>
                <Check size={16} color="#2563eb" />
                <span>Authentic Razorpay Payment Gateway Integration</span>
              </li>
              <li className={styles.currModuleItem}>
                <Check size={16} color="#2563eb" />
                <span>Streaming Video Player with progress tracking</span>
              </li>
              <li className={styles.currModuleItem}>
                <Check size={16} color="#2563eb" />
                <span>Vercel / AWS Cloud Production Deployment</span>
              </li>
            </ul>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link href="/training-and-internship" className={styles.heroPrimaryBtn}>
            <span>View Complete Training &amp; Internship Syllabus</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* =====================================================================
          COURSES SECTION (#courses)
          ===================================================================== */}
      <section id="courses" className={styles.coursesSection}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionBadge}>
            <BookOpen size={14} /> Comprehensive Catalog
          </div>
          <h2 className={styles.sectionMainTitle}>Explore Masterclasses &amp; Video Courses</h2>
          <p className={styles.sectionDescription}>
            Self-paced, high-definition courses with interactive chapters, downloadable code repositories, and verifiable certificates.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className={styles.categoryFilterBar}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`${styles.catBtn} ${selectedCategory === 'all' ? styles.catBtnActive : ''}`}
          >
            All Courses
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`${styles.catBtn} ${selectedCategory === cat ? styles.catBtnActive : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Courses Cards Grid */}
        {loadingCourses ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            Loading courses catalog...
          </div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            No courses found in this category.
          </div>
        ) : (
          <div className={styles.coursesGrid}>
            {courses.map((course) => (
              <div key={course.id} className={styles.courseCard}>
                <div className={styles.courseThumbWrap}>
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className={styles.courseThumbImg}
                    />
                  ) : (
                    <div className={styles.courseThumbPlaceholder}>
                      <img
                        src="/images/binary-vidya-icon.png"
                        alt="Binary Vidya"
                        style={{ height: '44px', width: 'auto', objectFit: 'contain', marginBottom: '4px' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>Binary Vidya Academy</span>
                    </div>
                  )}
                  <span className={styles.courseCategoryPill}>{course.category}</span>
                  <span className={styles.courseLevelPill}>{course.level}</span>
                </div>

                <div className={styles.courseBody}>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseDesc}>{course.description}</p>

                  <div className={styles.courseMetaRow}>
                    <div className={styles.courseMetaItem}>
                      <Clock size={13} color="#2563eb" />
                      <span>{course.duration || '12+ Hours'}</span>
                    </div>
                    <div className={styles.courseMetaItem}>
                      <Film size={13} color="#0284c7" />
                      <span>{course.totalLessons || 24} Lessons</span>
                    </div>
                    <div className={styles.courseMetaItem}>
                      <Star size={13} color="#f59e0b" fill="#f59e0b" />
                      <span>{course.rating || 4.9}</span>
                    </div>
                  </div>

                  <div className={styles.courseFooter}>
                    <div className={styles.coursePrice}>₹{course.price}</div>
                    <div className={styles.courseActions}>
                      <button
                        onClick={() => setPreviewCourse(course)}
                        className={styles.syllabusBtn}
                      >
                        Syllabus
                      </button>
                      <Link
                        href={`/courses/${course.slug || course.id}`}
                        className={styles.enrollBtn}
                      >
                        Enroll <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================================
          4 VERIFIED CREDENTIALS WITH INTERACTIVE LIVE VERIFICATION
          ===================================================================== */}
      <section className={styles.credentialsSection}>
        <div className={styles.credentialsContainer}>
          <div className={styles.sectionHeaderCenter}>
            <div className={styles.sectionBadge}>
              <Award size={14} /> Career Security
            </div>
            <h2 className={styles.sectionMainTitle}>
              4 Official Credentials with Instant Verification
            </h2>
            <p className={styles.sectionDescription}>
              Stand out to recruiters with verifiable, tamper-proof credentials issued by Binary Vidya.
            </p>
          </div>

          {/* Interactive Live Certificate Verification Box */}
          <div className={styles.instantVerifyCard}>
            <div className={styles.instantVerifyHeader}>
              <div className={styles.instantVerifyTitleWrap}>
                <div className={styles.instantVerifyIconWrap}>
                  <ShieldCheck size={28} color="#2563eb" />
                </div>
                <div>
                  <h3 className={styles.instantVerifyTitle}>Instant Credential Verification</h3>
                  <p className={styles.instantVerifySubtitle}>
                    Enter any Certificate or Internship ID to authenticate student credentials directly from our central registry.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                <CheckCircle2 size={16} /> Live Verified Registry
              </div>
            </div>

            <form onSubmit={handleInstantVerify} className={styles.instantVerifyForm}>
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => {
                  setVerifyInput(e.target.value);
                  if (verifyError) setVerifyError('');
                }}
                placeholder="Enter Certificate ID (e.g. BV-CERT-FRONTEND-2026)"
                className={styles.instantVerifyInput}
              />
              <button type="submit" className={styles.instantVerifySubmitBtn}>
                <Search size={16} /> Verify Credential
              </button>
            </form>

            {verifyError && (
              <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
                {verifyError}
              </div>
            )}

            <div className={styles.sampleBadgesRow}>
              <span className={styles.sampleBadgeLabel}>Try Sample Verifiable IDs:</span>
              {SAMPLE_CERT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSampleVerify(id)}
                  className={styles.sampleBtn}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Credentials Grid */}
          <div className={styles.credentials4Grid}>
            <div className={styles.credCardItem}>
              <div className={styles.credCardIcon}>
                <Award size={24} color="#2563eb" />
              </div>
              <div className={styles.credCardNumber}>Credential 1</div>
              <h3>Training Completion Certificate</h3>
              <p>
                Validates in-depth mastery of the full curriculum, hands-on lab assignments, and weekend workshop participation.
              </p>
            </div>

            <div className={styles.credCardItem}>
              <div className={styles.credCardIcon}>
                <Briefcase size={24} color="#0284c7" />
              </div>
              <div className={styles.credCardNumber}>Credential 2</div>
              <h3>2-Month Internship Experience Letter</h3>
              <p>
                Official proof of 2-month industrial internship completion, real-world agile workflow contributions, and team code reviews.
              </p>
            </div>

            <div className={styles.credCardItem}>
              <div className={styles.credCardIcon}>
                <FileCheck2 size={24} color="#059669" />
              </div>
              <div className={styles.credCardNumber}>Credential 3</div>
              <h3>Letter of Recommendation (LOR)</h3>
              <p>
                Personalized letter signed by lead engineering mentors highlighting code architecture quality and algorithmic mastery.
              </p>
            </div>

            <div className={styles.credCardItem}>
              <div className={styles.credCardIcon}>
                <ShieldCheck size={24} color="#7c3aed" />
              </div>
              <div className={styles.credCardNumber}>Credential 4</div>
              <h3>Official Course &amp; Project Transcript</h3>
              <p>
                Detailed transcript outlining the minor and major production capstone projects, Git metrics, and module evaluations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          WHY CHOOSE BINARY VIDYA (6 Core Pillars)
          ===================================================================== */}
      <section className={styles.whySection}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionBadge}>
            <Zap size={14} /> The Binary Vidya Advantage
          </div>
          <h2 className={styles.sectionMainTitle}>Why Thousands of Engineers Choose Us</h2>
          <p className={styles.sectionDescription}>
            We combine rigorous academic foundations with industrial engineering standards.
          </p>
        </div>

        <div className={styles.whyGrid}>
          <div className={styles.whyCard}>
            <div className={styles.whyIconWrap}>
              <Clock size={26} color="#2563eb" />
            </div>
            <h3>Strictly Weekend Live Batches</h3>
            <p>
              Designed for college students and working professionals. Zero conflict with semester exams or weekday jobs, backed by 24/7 session recordings.
            </p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIconWrap}>
              <Briefcase size={26} color="#059669" />
            </div>
            <h3>100% Free 2-Month Internship</h3>
            <p>
              Every student gets bundled access to our 2-month industrial internship at ₹0 additional cost, gaining real corporate project experience.
            </p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIconWrap}>
              <ShieldCheck size={26} color="#0284c7" />
            </div>
            <h3>QR-Verifiable Credentials</h3>
            <p>
              Tamper-proof digital certificates and experience letters easily shareable on LinkedIn and instantly verifiable by hiring recruiters.
            </p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIconWrap}>
              <CreditCard size={26} color="#7c3aed" />
            </div>
            <h3>Authentic Razorpay Integration</h3>
            <p>
              Seamless, secure checkout supporting UPI (GPay, PhonePe, Paytm), Credit/Debit cards, NetBanking, and digital wallets.
            </p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIconWrap}>
              <Users size={26} color="#e11d48" />
            </div>
            <h3>1-on-1 Mentor Guidance</h3>
            <p>
              Live doubt clearance sessions, personalized code audits, and resume/LinkedIn optimization workshops with experienced SDEs.
            </p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIconWrap}>
              <Cloud size={26} color="#0891b2" />
            </div>
            <h3>Production Cloud Deployments</h3>
            <p>
              Deploy full-stack applications to AWS and Vercel with CI/CD automation, custom domain routing, and cloud database indexing.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          CAREERS / WE'RE HIRING BANNER
          ===================================================================== */}
      <section className={styles.careersBannerSection}>
        <div className={styles.careersBannerWrapper}>
          <div className={styles.careersBannerContent}>
            <h2>Join the Binary Vidya Team • We Are Hiring!</h2>
            <p>
              Are you passionate about developer education, mentoring aspiring engineers, or building scalable learning platforms? Explore open full-time, part-time, and mentor roles.
            </p>
          </div>
          <Link href="/careers" className={styles.careersBannerBtn}>
            <Briefcase size={16} /> Explore Open Positions <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* =====================================================================
          STUDENT TESTIMONIALS
          ===================================================================== */}
      <section className={styles.testimonialsSection}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionBadge}>
            <Star size={14} /> Student Reviews
          </div>
          <h2 className={styles.sectionMainTitle}>Loved by Ambitious Coders Across India</h2>
          <p className={styles.sectionDescription}>
            Hear how Binary Vidya&apos;s weekend cohorts and industrial internship launched high-growth careers.
          </p>
        </div>

        <div className={styles.testimonialsGrid}>
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialRating}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>
            <p className={styles.testimonialText}>
              &ldquo;The weekend classes fit perfectly into my final-year engineering schedule. The 2-month internship gave me real production Git workflow experience that impressed my interviewers at Flipkart!&rdquo;
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar}>A</div>
              <div>
                <div className={styles.testimonialName}>Ananya Sharma</div>
                <div className={styles.testimonialRole}>Frontend Engineer • Flipkart</div>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.testimonialRating}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>
            <p className={styles.testimonialText}>
              &ldquo;The 4 credentials with the instant QR code verification made my resume stand out. The mentor-led capstone project helped me land a 12 LPA SDE offer before graduation.&rdquo;
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar}>R</div>
              <div>
                <div className={styles.testimonialName}>Rohan Verma</div>
                <div className={styles.testimonialRole}>Software Engineer • Razorpay</div>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.testimonialRating}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>
            <p className={styles.testimonialText}>
              &ldquo;Getting the 2-month industrial internship completely free with the ₹2,400 training fee was unbeatable. You build actual production code, not just basic todo apps.&rdquo;
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar}>P</div>
              <div>
                <div className={styles.testimonialName}>Priya Nair</div>
                <div className={styles.testimonialRole}>Full-Stack Developer • Swiggy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FAQ SECTION
          ===================================================================== */}
      <section className={styles.faqSection}>
        <div className={styles.sectionHeaderCenter}>
          <div className={styles.sectionBadge}>
            <CheckCircle2 size={14} /> Got Questions?
          </div>
          <h2 className={styles.sectionMainTitle}>Frequently Asked Questions</h2>
          <p className={styles.sectionDescription}>
            Everything you need to know about our training programs, internship, certificates, and payment process.
          </p>
        </div>

        <div className={styles.faqContainer}>
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className={`${styles.faqItem} ${openFaqIndex === idx ? styles.faqItemOpen : ''}`}
            >
              <button
                className={styles.faqQuestion}
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  style={{
                    transform: openFaqIndex === idx ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
              {openFaqIndex === idx && <div className={styles.faqAnswer}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          BOTTOM CTA SECTION
          ===================================================================== */}
      <section className={styles.bottomCtaSection}>
        <div className={styles.bottomCtaContainer}>
          <h2>Ready to Launch Your Software Engineering Career?</h2>
          <p>
            Join thousands of ambitious learners who have accelerated their skills with Binary Vidya. Limited seats available for the upcoming weekend batch!
          </p>
          <div className={styles.bottomCtaActions}>
            <Link href="/training-and-internship" className={styles.bottomCtaPrimary}>
              <Sparkles size={16} /> Enroll in Training &amp; Internship
            </Link>
            <Link href="/verify-certificate" className={styles.bottomCtaSecondary}>
              <ShieldCheck size={16} /> Verify Credentials
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================================
          COMPREHENSIVE RICH FOOTER
          ===================================================================== */}
      <footer className={styles.footer}>
        <div className={styles.footerWrapper}>
          <div className={styles.footerTopGrid}>
            {/* Brand Column */}
            <div className={styles.footerBrandCol}>
              <img
                src="/images/binary-vidya-logo.png"
                alt="Binary Vidya Academy"
                className={styles.footerLogoImg}
              />
              <p className={styles.footerBrandDesc}>
                Binary Vidya is India&apos;s leading modern technical academy providing industry-grade software engineering training, 2-month verified industrial internships, production project mentorship, and verifiable ISO-compliant credentials.
              </p>
              <div className={styles.footerContactList}>
                <div className={styles.footerContactItem}>
                  <Mail size={14} color="#3b82f6" />
                  <span>support@binaryvidya.com</span>
                </div>
                <div className={styles.footerContactItem}>
                  <Phone size={14} color="#3b82f6" />
                  <span>+91 98765 43210 / +91 80 4567 8900</span>
                </div>
                <div className={styles.footerContactItem}>
                  <MapPin size={14} color="#3b82f6" />
                  <span>Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103</span>
                </div>
              </div>
            </div>

            {/* Column 1: Programs & Tracks */}
            <div>
              <div className={styles.footerColTitle}>Programs &amp; Tracks</div>
              <ul className={styles.footerLinksList}>
                <li>
                  <Link href="/training-and-internship">
                    <Sparkles size={12} color="#3b82f6" /> Frontend Dev (Weekend)
                  </Link>
                </li>
                <li>
                  <a href="#courses">Full Stack Web Engineering</a>
                </li>
                <li>
                  <a href="#courses">Data Structures &amp; Algorithms</a>
                </li>
                <li>
                  <a href="#courses">Cloud &amp; DevOps Engineering</a>
                </li>
                <li>
                  <a href="#courses">Applied AI &amp; Deep Learning</a>
                </li>
                <li>
                  <a href="#courses">System Design Masterclass</a>
                </li>
              </ul>
            </div>

            {/* Column 2: Internships & Projects */}
            <div>
              <div className={styles.footerColTitle}>Internships &amp; Labs</div>
              <ul className={styles.footerLinksList}>
                <li>
                  <Link href="/training-and-internship">2-Month Free Internship</Link>
                </li>
                <li>
                  <a href="#curriculum">Minor Production SaaS Project</a>
                </li>
                <li>
                  <a href="#curriculum">Major Enterprise Cloud LMS</a>
                </li>
                <li>
                  <a href="#curriculum">Live Code Review Audits</a>
                </li>
                <li>
                  <a href="#curriculum">GitHub Portfolio Building</a>
                </li>
                <li>
                  <a href="#curriculum">Pre-Placement Offer (PPO) Prep</a>
                </li>
              </ul>
            </div>

            {/* Column 3: Credentials & Verification */}
            <div>
              <div className={styles.footerColTitle}>Credentials &amp; Trust</div>
              <ul className={styles.footerLinksList}>
                <li>
                  <Link href="/verify-certificate">
                    <ShieldCheck size={12} color="#3b82f6" /> Verify Certificate Portal
                  </Link>
                </li>
                <li>
                  <Link href="/verify-certificate">Training Completion Certificate</Link>
                </li>
                <li>
                  <Link href="/verify-certificate">2-Month Internship Letter</Link>
                </li>
                <li>
                  <Link href="/verify-certificate">Official Recommendation (LOR)</Link>
                </li>
                <li>
                  <Link href="/verify-certificate">Course &amp; Project Transcript</Link>
                </li>
                <li>
                  <Link href="/verify-certificate">LinkedIn 1-Click Integration</Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Careers & Mentorship */}
            <div>
              <div className={styles.footerColTitle}>Careers &amp; Network</div>
              <ul className={styles.footerLinksList}>
                <li>
                  <Link href="/careers">
                    <Briefcase size={12} color="#059669" /> We&apos;re Hiring (All Roles)
                  </Link>
                </li>
                <li>
                  <Link href="/careers">Become a Technical Mentor</Link>
                </li>
                <li>
                  <Link href="/careers">Campus Ambassador Program</Link>
                </li>
                <li>
                  <a href="#partners">Hiring Partner Companies</a>
                </li>
                <li>
                  <a href="#testimonials">Student Success Stories</a>
                </li>
                <li>
                  <a href="mailto:careers@binaryvidya.com">Contact Recruitment</a>
                </li>
              </ul>
            </div>

            {/* Column 5: Student Hub & Policies */}
            <div>
              <div className={styles.footerColTitle}>Student Hub &amp; Legal</div>
              <ul className={styles.footerLinksList}>
                <li>
                  <Link href="/login">Student Sign In</Link>
                </li>
                <li>
                  <Link href="/my-learning">My Learning Dashboard</Link>
                </li>
                <li>
                  <Link href="/profile">Profile &amp; Account Settings</Link>
                </li>
                <li>
                  <a href="#terms">Terms &amp; Conditions</a>
                </li>
                <li>
                  <a href="#privacy">Privacy Policy</a>
                </li>
                <li>
                  <a href="#refund">Refund &amp; Cancellation Policy</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Trust Badges Strip */}
          <div className={styles.footerTrustStrip}>
            <div className={styles.trustBadgeItem}>
              <ShieldCheck size={18} color="#3b82f6" />
              <span>ISO 9001:2015 Educational Standard Certified</span>
            </div>
            <div className={styles.trustBadgeItem}>
              <CreditCard size={18} color="#059669" />
              <span>100% Authentic Razorpay 256-Bit Encrypted Payments</span>
            </div>
            <div className={styles.trustBadgeItem}>
              <Lock size={18} color="#0284c7" />
              <span>Tamper-Proof QR Credential Registry</span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className={styles.footerBottomBar}>
            <div>
              &copy; {new Date().getFullYear()} Binary Vidya Technologies Pvt. Ltd. All rights reserved.
            </div>
            <div className={styles.footerBottomLinks}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security Compliance</span>
              <button onClick={scrollToTop} className={styles.backToTopBtn}>
                <ArrowUp size={14} /> Back to Top
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          SYLLABUS PREVIEW MODAL
          ===================================================================== */}
      {previewCourse && (
        <div className={styles.syllabusModalOverlay} onClick={() => setPreviewCourse(null)}>
          <div className={styles.syllabusModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.syllabusModalHeader}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#2563eb',
                    background: '#eff6ff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {previewCourse.category}
                </span>
                <h3 style={{ margin: '8px 0 4px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {previewCourse.title}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
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
                      {ch.lessons &&
                        ch.lessons.map((les, lIdx) => (
                          <div key={les.id || lIdx} className={styles.syllabusLessonRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <div className={styles.syllabusLessonThumb}>
                                <Film size={16} color="#2563eb" />
                              </div>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                  {les.title}
                                </div>
                                {les.description && (
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                                    {les.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                color: '#64748b',
                                fontWeight: 600,
                              }}
                            >
                              <Clock size={12} /> {les.duration || '15 Mins'}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Comprehensive syllabus being finalized. Check back soon!
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
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
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
