'use client';

import React from 'react';
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
} from 'lucide-react';

export default function HomePage() {
  const { user, logout, isLoading, isAdmin } = useAuth();

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
              <div className={styles.userPill}>
                <div className={styles.userAvatar}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className={styles.userName}>{user.name}</div>
                <button
                  onClick={logout}
                  className={styles.logoutBtn}
                  title="Sign out of your account"
                  id="nav-logout-btn"
                >
                  <LogOut size={16} />
                </button>
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
              Curated roadmaps designed to take you from foundational logic to full-stack mastery.
            </p>
          </div>

          <div className={styles.coursesGrid}>
            {/* Course 1 */}
            <div className={styles.courseCard}>
              <div className={styles.courseBanner}>
                <div className={styles.courseTrackBadge}>Full-Stack Web</div>
                <div className={styles.courseDuration}>12 Weeks • 48 Lessons</div>
              </div>
              <div className={styles.courseBody}>
                <div className={styles.courseRating}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" /> 4.9 (2,410 reviews)
                </div>
                <h3 className={styles.courseTitle}>Modern MERN & Next.js 14 Architecture</h3>
                <p className={styles.courseDesc}>
                  Master React Server Components, TypeScript, Node.js REST APIs, MongoDB Mongoose, and
                  production deployment on Vercel and AWS.
                </p>
                <div className={styles.courseFooter}>
                  <span className={styles.coursePrice}>Free Access</span>
                  <Link href="/login" className={styles.courseActionBtn}>
                    Enroll Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Course 2 */}
            <div className={styles.courseCard}>
              <div className={styles.courseBanner} style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)' }}>
                <div className={styles.courseTrackBadge}>Algorithms & DSA</div>
                <div className={styles.courseDuration}>10 Weeks • 40 Lessons</div>
              </div>
              <div className={styles.courseBody}>
                <div className={styles.courseRating}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" /> 4.9 (1,890 reviews)
                </div>
                <h3 className={styles.courseTitle}>Data Structures, Algorithms & System Design</h3>
                <p className={styles.courseDesc}>
                  Master high-frequency interview patterns: Dynamic Programming, Graph Traversals,
                  Trees, and distributed scalable system design.
                </p>
                <div className={styles.courseFooter}>
                  <span className={styles.coursePrice}>Free Access</span>
                  <Link href="/login" className={styles.courseActionBtn}>
                    Enroll Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Course 3 */}
            <div className={styles.courseCard}>
              <div className={styles.courseBanner} style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' }}>
                <div className={styles.courseTrackBadge}>Cloud & DevOps</div>
                <div className={styles.courseDuration}>8 Weeks • 32 Lessons</div>
              </div>
              <div className={styles.courseBody}>
                <div className={styles.courseRating}>
                  <Star size={16} fill="#f59e0b" color="#f59e0b" /> 4.8 (1,240 reviews)
                </div>
                <h3 className={styles.courseTitle}>Docker, Kubernetes & Production CI/CD</h3>
                <p className={styles.courseDesc}>
                  Containerize microservices, configure automated GitHub Actions pipelines, and manage
                  zero-downtime rolling deployments.
                </p>
                <div className={styles.courseFooter}>
                  <span className={styles.coursePrice}>Free Access</span>
                  <Link href="/login" className={styles.courseActionBtn}>
                    Enroll Now
                  </Link>
                </div>
              </div>
            </div>
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
              Fast 6-digit transactional email OTP password reset with anti-spam inbox optimization and
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
    </div>
  );
}
