'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../components/AuthModal';
import styles from './training.module.css';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Award,
  FileText,
  Briefcase,
  Sparkles,
  Code,
  Layers,
  Zap,
  Laptop,
  ChevronRight,
  ArrowRight,
  Lock,
  X,
  Printer,
  BookOpen,
  Users,
  Star,
  Terminal,
  Check,
  Cpu,
  Boxes,
  Compass,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';

// Safely loads official Razorpay Checkout SDK
const ensureRazorpayLoaded = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.getElementById('razorpay-checkout-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface PaymentReceiptData {
  paymentId: string;
  orderId: string;
  amount: number;
  courseTitle: string;
  userEmail: string;
  date: string;
}

export default function TrainingAndInternshipPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeSectionTab, setActiveSectionTab] = useState<'all' | '1' | '2' | '3'>('all');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Payment states
  const [paymentStep, setPaymentStep] = useState<'idle' | 'initiating' | 'verifying' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceiptData | null>(null);

  useEffect(() => {
    ensureRazorpayLoaded();
  }, []);

  // Trigger authentic Razorpay payment
  const triggerRazorpayPayment = useCallback(
    async (currentUser: any) => {
      try {
        setPaymentStep('initiating');
        setPaymentError(null);

        const loaded = await ensureRazorpayLoaded();
        if (!loaded || typeof (window as any).Razorpay === 'undefined') {
          throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
        }

        // Create official Razorpay Order
        const res = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: 'frontend-developer-training-internship',
            userEmail: currentUser.email,
            userName: currentUser.name || 'Student',
            userId: currentUser.id || '',
          }),
        });

        const orderData = await res.json();
        if (!orderData.success || !orderData.orderId) {
          throw new Error(orderData.message || 'Failed to initialize Razorpay payment order.');
        }

        const razorpayKey =
          orderData.keyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_test_Td7SsGbdScfViP';

        const options: any = {
          key: razorpayKey,
          amount: orderData.amount, // 240000 paise = ₹2,400
          currency: orderData.currency || 'INR',
          name: 'Binary Vidya',
          description: 'Frontend Developer Training & 2-Month Internship',
          image: 'https://binaryvidya.com/logo.png',
          order_id: orderData.orderId,
          handler: async function (response: any) {
            setPaymentStep('verifying');
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  paymentMethod: 'razorpay_gateway',
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setPaymentReceipt({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  amount: 2400,
                  courseTitle: 'Frontend Developer Training & 2-Month Internship',
                  userEmail: currentUser.email,
                  date: new Date().toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }),
                });
                setPaymentStep('success');

                try {
                  confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                  });
                } catch (cErr) {}
              } else {
                setPaymentStep('failed');
                setPaymentError(verifyData.message || 'Payment signature verification failed.');
              }
            } catch (err: any) {
              setPaymentStep('failed');
              setPaymentError(err.message || 'Payment verification error.');
            }
          },
          prefill: {
            name: currentUser.name || '',
            email: currentUser.email || '',
            contact: currentUser.phone || '9999999999',
          },
          notes: {
            program: 'Frontend Developer Training & Internship',
            track: 'Frontend Development',
            weekendBatch: 'Cohort 2026',
            internshipIncluded: 'Free 2-Month Industrial Internship',
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: function () {
              setPaymentStep('idle');
            },
            confirm_close: true,
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setPaymentStep('failed');
          setPaymentError(resp.error?.description || 'Payment was declined or cancelled in Razorpay.');
        });
        rzp.open();
      } catch (err: any) {
        setPaymentStep('failed');
        setPaymentError(err.message || 'Failed to open Razorpay gateway.');
      }
    },
    []
  );

  const handleEnrollClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      triggerRazorpayPayment(user);
    }
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setShowAuthModal(false);
    triggerRazorpayPayment(authenticatedUser);
  };

  return (
    <div className={styles.container}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* TOP NAVIGATION */}
      <nav className={styles.navbar}>
        <div className={styles.navWrapper}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.brandLogo}>BV</div>
            <div>
              <div className={styles.brandName}>Binary Vidya</div>
              <div className={styles.brandTagline}>Technical Academy</div>
            </div>
          </Link>

          <div className={styles.navRight}>
            <span className={styles.navBadge}>
              <Calendar size={14} color="#2563eb" /> Weekend Live Batches
            </span>

            <button
              onClick={handleEnrollClick}
              className={styles.enrollBtn}
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              Enroll Now • ₹2,400
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          {/* Pill Badges */}
          <div className={styles.pillGroup}>
            <span className={styles.badgeTrack}>
              <Code size={14} color="#38bdf8" /> Track: Frontend Developer
            </span>
            <span className={styles.badgeWeekend}>
              <Calendar size={14} color="#059669" /> Weekend Classes (Saturday &amp; Sunday)
            </span>
            <span className={styles.badgeFreeInternship}>
              <Sparkles size={14} color="#2563eb" /> 2-Month Internship 100% Free of Cost
            </span>
          </div>

          <h1 className={styles.heroTitle}>
            Frontend Developer <br />
            <span className={styles.heroGradientText}>Training &amp; 2-Month Industrial Internship</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Accelerate your software engineering career with mentor-led weekend live sessions, build an enterprise Minor and Major project for your portfolio, and complete a 2-month industrial internship with 4 verified credentials.
          </p>

          {/* Pricing & CTA Card */}
          <div className={styles.pricingHeroCard}>
            <div className={styles.priceDisplay}>
              <div className={styles.priceLabel}>All-Inclusive Tuition Bundle</div>
              <div className={styles.priceValueWrap}>
                <span className={styles.priceCurrent}>₹2,400</span>
                <span className={styles.priceOriginal}>₹7,999</span>
                <span className={styles.priceDiscountBadge}>70% Scholarship Applied</span>
              </div>
              <div className={styles.priceInternshipTag}>
                <CheckCircle2 size={16} color="#0284c7" />
                <span>2-Month Industrial Internship is <strong>100% Free of Cost</strong></span>
              </div>
            </div>

            <div className={styles.ctaActionWrap}>
              <button
                type="button"
                onClick={handleEnrollClick}
                disabled={paymentStep === 'initiating' || paymentStep === 'verifying'}
                className={styles.enrollBtn}
              >
                {paymentStep === 'initiating' ? (
                  <span>Opening Razorpay Secure Gateway...</span>
                ) : paymentStep === 'verifying' ? (
                  <span>Verifying Payment...</span>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>Enroll Now &bull; Pay ₹2,400 via Razorpay</span>
                  </>
                )}
              </button>

              <Link href="/training-and-internship/checkout" className={styles.viewInvoiceLink}>
                Or view detailed invoice &amp; payment options &rarr;
              </Link>
            </div>
          </div>

          {/* Error Banner */}
          {paymentError && (
            <div
              style={{
                maxWidth: '650px',
                margin: '20px auto 0',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '12px 18px',
                color: '#991b1b',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
              }}
            >
              <X size={18} color="#dc2626" style={{ flexShrink: 0 }} />
              <div>{paymentError}</div>
            </div>
          )}

          {/* Key Stats Row */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>Weekend</div>
              <div className={styles.statLabel}>Live Classes (Sat &amp; Sun)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>2 Months</div>
              <div className={styles.statLabel}>Hands-on Internship</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>2 Live Projects</div>
              <div className={styles.statLabel}>Minor + Major Capstone</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>4 Certificates</div>
              <div className={styles.statLabel}>LOR + Verification Badges</div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT LAYOUT */}
      <main className={styles.mainLayout}>
        {/* CURRICULUM OVERVIEW & 3 CORE SECTIONS */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Curriculum Structure</span>
          <h2 className={styles.sectionTitle}>3 Distinct Sections of the Program</h2>
          <p className={styles.sectionSubtitle}>
            Our structured curriculum bridges the gap between college theory and real-world frontend engineering through rigorous training and dual portfolio projects.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className={styles.navTabsWrapper}>
          <button
            onClick={() => setActiveSectionTab('all')}
            className={`${styles.navTabBtn} ${activeSectionTab === 'all' ? styles.navTabBtnActive : ''}`}
          >
            All 3 Sections
          </button>
          <button
            onClick={() => setActiveSectionTab('1')}
            className={`${styles.navTabBtn} ${activeSectionTab === '1' ? styles.navTabBtnActive : ''}`}
          >
            <span className={styles.tabNumberBadge}>1</span>
            Section 1: Training Curriculum
          </button>
          <button
            onClick={() => setActiveSectionTab('2')}
            className={`${styles.navTabBtn} ${activeSectionTab === '2' ? styles.navTabBtnActive : ''}`}
          >
            <span className={styles.tabNumberBadge}>2</span>
            Section 2: Minor Project
          </button>
          <button
            onClick={() => setActiveSectionTab('3')}
            className={`${styles.navTabBtn} ${activeSectionTab === '3' ? styles.navTabBtnActive : ''}`}
          >
            <span className={styles.tabNumberBadge}>3</span>
            Section 3: Major Project
          </button>
        </div>

        {/* ================= SECTION 1: TRAINING ================= */}
        {(activeSectionTab === 'all' || activeSectionTab === '1') && (
          <section id="training" className={styles.trainingCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Section 1
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb' }}>
                Intensive Frontend Engineering Training
              </span>
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
              Production Frontend Architecture &amp; Next.js 14
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
              Deep dive into modern web standards, component lifecycles, functional reactivity, state machines, strict TypeScript typing, and production deployment best practices during weekend live classes.
            </p>

            <div className={styles.modulesGrid}>
              {/* Module 1.1 */}
              <div className={styles.moduleBox}>
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleNumber}>Mod 1.1</div>
                  <h4 className={styles.moduleTitle}>Semantic HTML5, CSS3 &amp; Modern Layouts</h4>
                </div>
                <ul className={styles.moduleTopicsList}>
                  <li>Semantic HTML5 structure, ARIA accessibility, SEO metadata &amp; OpenGraph tags</li>
                  <li>Advanced Flexbox and CSS Grid layout algorithms with responsive auto-fit/fill</li>
                  <li>CSS Variables, Glassmorphism, smooth gradients, and cubic-bezier micro-animations</li>
                  <li>CSS Modules, utility conventions, and responsive mobile-first viewports</li>
                </ul>
              </div>

              {/* Module 1.2 */}
              <div className={styles.moduleBox}>
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleNumber}>Mod 1.2</div>
                  <h4 className={styles.moduleTitle}>Modern JavaScript (ES6+) &amp; Asynchronous Paradigms</h4>
                </div>
                <ul className={styles.moduleTopicsList}>
                  <li>Lexical scoping, closures, arrow functions, destructuring, and spread operators</li>
                  <li>Asynchronous execution: Event Loop, Microtasks, Promises, and Async/Await</li>
                  <li>Working with REST APIs, Fetch API, error interception, and JSON parsing</li>
                  <li>DOM manipulation, event delegation, debounce/throttle techniques for high FPS</li>
                </ul>
              </div>

              {/* Module 1.3 */}
              <div className={styles.moduleBox}>
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleNumber}>Mod 1.3</div>
                  <h4 className={styles.moduleTitle}>TypeScript for Scalable Frontend Systems</h4>
                </div>
                <ul className={styles.moduleTopicsList}>
                  <li>Strict typing, primitive types, unions, intersections, and custom types</li>
                  <li>Interfaces, type aliases, generic functions, and type-narrowing guards</li>
                  <li>Typing React components, event handlers, context providers, and API schemas</li>
                  <li>Detecting runtime edge cases at compile-time for zero production regressions</li>
                </ul>
              </div>

              {/* Module 1.4 */}
              <div className={styles.moduleBox}>
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleNumber}>Mod 1.4</div>
                  <h4 className={styles.moduleTitle}>React 18+ Mastery &amp; State Architecture</h4>
                </div>
                <ul className={styles.moduleTopicsList}>
                  <li>Virtual DOM mechanics, reconciliation, and functional component lifecycle</li>
                  <li>Core Hooks: useState, useEffect, useRef, useMemo, and useCallback</li>
                  <li>Building robust custom React Hooks for reusable data &amp; UI logic</li>
                  <li>Global state management using Context API, Reducer pattern, and compound components</li>
                </ul>
              </div>

              {/* Module 1.5 */}
              <div className={styles.moduleBox}>
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleNumber}>Mod 1.5</div>
                  <h4 className={styles.moduleTitle}>Next.js 14 App Router &amp; Full-Stack Capabilities</h4>
                </div>
                <ul className={styles.moduleTopicsList}>
                  <li>App Router architecture: nested layouts, page routes, loading skeletons, and errors</li>
                  <li>React Server Components (RSC) vs Client Components: tradeoffs and hybrid rendering</li>
                  <li>Data fetching paradigms: Server-Side Rendering (SSR), Static Generation (SSG)</li>
                  <li>API route handlers, route handlers caching, and Core Web Vitals optimization</li>
                </ul>
              </div>

              {/* Module 1.6 */}
              <div className={styles.moduleBox}>
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleNumber}>Mod 1.6</div>
                  <h4 className={styles.moduleTitle}>Developer Tooling, Git &amp; Cloud Deployment</h4>
                </div>
                <ul className={styles.moduleTopicsList}>
                  <li>Professional Git workflows: branch conventions, pull requests, and merge strategies</li>
                  <li>Code quality automation with ESLint, Prettier, and TypeScript compiler CLI</li>
                  <li>Continuous deployment to Vercel, custom domain linking, and environment variables</li>
                  <li>Production performance audits using Chrome DevTools &amp; Lighthouse</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ================= SECTION 2: MINOR PROJECT ================= */}
        {(activeSectionTab === 'all' || activeSectionTab === '2') && (
          <section id="minor-project" className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Section 2
                </span>
                <span className={`${styles.projectBadge} ${styles.minorBadge}`}>
                  Production Minor Project
                </span>
              </div>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                Estimated Effort: 3 Weeks &bull; Code Reviewed by Mentors
              </span>
            </div>

            <h3 className={styles.projectTitle}>
              SaaS Pulse &bull; Modern Analytics &amp; Productivity Dashboard
            </h3>
            <div className={styles.projectTagline}>
              Modular Design System Kit with Real-Time Data Visualization &amp; Theme Switcher
            </div>
            <p className={styles.projectDescription}>
              In this hands-on minor project, students build a responsive, production-ready SaaS administration dashboard from scratch. The project focuses on clean component modularity, fluid responsive layouts, customizable dark/light modes, and interactive data visualization charts.
            </p>

            <div className={styles.projectSpecsGrid}>
              <div className={styles.specsBox}>
                <div className={styles.specsHeading}>
                  <Laptop size={16} color="#059669" /> Technical Architecture
                </div>
                <div className={styles.techPillsGroup}>
                  <span className={styles.techPill}>React 18</span>
                  <span className={styles.techPill}>Next.js 14</span>
                  <span className={styles.techPill}>TypeScript</span>
                  <span className={styles.techPill}>CSS Modules</span>
                  <span className={styles.techPill}>Recharts</span>
                  <span className={styles.techPill}>Lucide Icons</span>
                </div>
              </div>

              <div className={styles.specsBox}>
                <div className={styles.specsHeading}>
                  <CheckCircle2 size={16} color="#059669" /> Key Project Deliverables
                </div>
                <ul className={styles.deliverablesList}>
                  <li>Dynamic analytics charts showing revenue, user activity, and conversion funnels</li>
                  <li>Dark &amp; Light theme toggle with state stored persistently in local storage</li>
                  <li>Searchable and filterable data tables with client-side sorting and pagination</li>
                  <li>Collapsible sidebar navigation with active route detection and mobile drawer</li>
                  <li>Live deployment to Vercel with structured GitHub README &amp; component documentation</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ================= SECTION 3: MAJOR PROJECT ================= */}
        {(activeSectionTab === 'all' || activeSectionTab === '3') && (
          <section id="major-project" className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: '#1d4ed8',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  Section 3
                </span>
                <span className={`${styles.projectBadge} ${styles.majorBadge}`}>
                  Enterprise Major Project
                </span>
              </div>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                Estimated Effort: 5 Weeks &bull; Capstone Industrial Portfolio
              </span>
            </div>

            <h3 className={styles.projectTitle}>
              Binary Studio &bull; Enterprise E-Learning &amp; Collaborative Platform
            </h3>
            <div className={styles.projectTagline}>
              Full-Scale Commercial Web Application with Video Streaming, Auth &amp; Razorpay Gateway
            </div>
            <p className={styles.projectDescription}>
              The capstone major project simulates building an actual commercial tech platform like Udemy or Coursera from the ground up. You will integrate secure user authentication, catalog search and dynamic routing, responsive custom video lecture players with playback persistence, official Razorpay payment integration, and verifiable digital certificate issuance.
            </p>

            <div className={styles.projectSpecsGrid}>
              <div className={styles.specsBox}>
                <div className={styles.specsHeading}>
                  <Boxes size={16} color="#2563eb" /> Full Stack Tech Integration
                </div>
                <div className={styles.techPillsGroup}>
                  <span className={styles.techPill}>Next.js 14 App Router</span>
                  <span className={styles.techPill}>TypeScript</span>
                  <span className={styles.techPill}>Tailored Design System</span>
                  <span className={styles.techPill}>REST API Integration</span>
                  <span className={styles.techPill}>Official Razorpay SDK</span>
                  <span className={styles.techPill}>Canvas Confetti</span>
                  <span className={styles.techPill}>Vercel CI/CD</span>
                </div>
              </div>

              <div className={styles.specsBox}>
                <div className={styles.specsHeading}>
                  <CheckCircle2 size={16} color="#2563eb" /> Key Project Deliverables
                </div>
                <ul className={styles.deliverablesList}>
                  <li>Complete user authentication flow with JWT tokens, OTP recovery &amp; guest checkout</li>
                  <li>Course and internship exploration with real-time category filtering and search</li>
                  <li>Custom responsive video player with chapter navigation and progress synchronization</li>
                  <li>Official Razorpay payment gateway integration supporting UPI QR, Cards &amp; NetBanking</li>
                  <li>Digital certificate issuance engine generating verifiable credential IDs &amp; printable receipts</li>
                  <li>Personalized "My Learning" dashboard showing progress percentages and course playback</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ================= 4 CREDENTIALS SHOWCASE ================= */}
        <div style={{ marginTop: '64px' }}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Verified Credentials</span>
            <h2 className={styles.sectionTitle}>4 Official Certifications Upon 2-Month Completion</h2>
            <p className={styles.sectionSubtitle}>
              After completing the 2-month internship and submitting your Minor and Major project code, you receive 4 distinct corporate and academic credentials to power your resume, LinkedIn, and job applications.
            </p>
          </div>

          <div className={styles.credentialsGrid}>
            {/* 1. LOR */}
            <div className={styles.certCard}>
              <div className={styles.certTop}>
                <div className={styles.certIconWrap} style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <FileText size={26} />
                </div>
                <span className={styles.certBadge} style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                  Recommendation
                </span>
                <h3 className={styles.certTitle}>Letter of Recommendation (LOR)</h3>
                <p className={styles.certDescription}>
                  Personalized, verifiable Letter of Recommendation detailing your project contributions, technical frontend skills, and problem-solving abilities.
                </p>
              </div>
              <div className={styles.certFooter}>
                <ShieldCheck size={14} /> Signed by Lead Architect &amp; Mentor
              </div>
            </div>

            {/* 2. Internship Completion Certificate */}
            <div className={styles.certCard}>
              <div className={styles.certTop}>
                <div className={styles.certIconWrap} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <Briefcase size={26} />
                </div>
                <span className={styles.certBadge} style={{ background: '#f0fdf4', color: '#15803d' }}>
                  2-Month Industrial
                </span>
                <h3 className={styles.certTitle}>Internship Completion Certificate</h3>
                <p className={styles.certDescription}>
                  Official corporate credential recognizing 2 months of hands-on industrial internship experience working on production frontend web systems.
                </p>
              </div>
              <div className={styles.certFooter}>
                <CheckCircle2 size={14} /> Verifiable Credential ID &amp; QR Code
              </div>
            </div>

            {/* 3. Training Certificate */}
            <div className={styles.certCard}>
              <div className={styles.certTop}>
                <div className={styles.certIconWrap} style={{ background: '#faf5ff', color: '#9333ea' }}>
                  <Award size={26} />
                </div>
                <span className={styles.certBadge} style={{ background: '#faf5ff', color: '#7e22ce' }}>
                  Curriculum Mastery
                </span>
                <h3 className={styles.certTitle}>Training Certificate</h3>
                <p className={styles.certDescription}>
                  Certifies complete mastery of modern frontend engineering, React 18, Next.js 14 App Router, and TypeScript, verified through assignments.
                </p>
              </div>
              <div className={styles.certFooter}>
                <ShieldCheck size={14} /> Academic Council Accredited
              </div>
            </div>

            {/* 4. Outstanding & Excellence Certificate */}
            <div className={styles.certCard}>
              <div className={styles.certTop}>
                <div className={styles.certIconWrap} style={{ background: '#fffbeb', color: '#d97706' }}>
                  <Sparkles size={26} />
                </div>
                <span className={styles.certBadge} style={{ background: '#fffbeb', color: '#b45309' }}>
                  Honors Merit
                </span>
                <h3 className={styles.certTitle}>Outstanding &amp; Excellence Certificate</h3>
                <p className={styles.certDescription}>
                  Prestigious merit honor awarded to standout students who demonstrate exemplary code quality, design fidelity, and active community mentorship.
                </p>
              </div>
              <div className={styles.certFooter}>
                <Star size={14} /> Honors Tier Portfolio Recognition
              </div>
            </div>
          </div>
        </div>

        {/* ================= WEEKEND CLASS SCHEDULE DETAILS ================= */}
        <div className={styles.scheduleCard}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
              <Calendar size={13} /> Flexible Schedule
            </div>
            <h3 className={styles.scheduleHeading}>Classes Strictly on Weekends</h3>
            <p className={styles.scheduleSub}>
              Never worry about missing classes because of college lectures, exams, or weekday office hours. All live interactive classes, coding labs, and mentor doubt-clearing sessions happen on Saturdays and Sundays.
            </p>

            <div className={styles.schedulePoints}>
              <div className={styles.scheduleItem}>
                <Check size={18} color="#38bdf8" />
                <span>Live Interactive Saturday &amp; Sunday Masterclasses</span>
              </div>
              <div className={styles.scheduleItem}>
                <Check size={18} color="#38bdf8" />
                <span>24/7 Full High-Definition Session Recordings available forever</span>
              </div>
              <div className={styles.scheduleItem}>
                <Check size={18} color="#38bdf8" />
                <span>Direct weekend 1-on-1 mentor code reviews &amp; debugging help</span>
              </div>
              <div className={styles.scheduleItem}>
                <Check size={18} color="#38bdf8" />
                <span>Dedicated Discord/WhatsApp developer community for 24/7 queries</span>
              </div>
            </div>
          </div>

          <div className={styles.scheduleBoxRight}>
            <div className={styles.scheduleBoxDays}>Saturday &amp; Sunday</div>
            <div className={styles.scheduleBoxTimings}>
              Live Cohort Sessions &bull; 2 Hours Each Day + 1 Hour Open Doubt Jam
            </div>

            <button
              onClick={handleEnrollClick}
              className={styles.enrollBtn}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Enroll for Weekend Batch • ₹2,400
            </button>
          </div>
        </div>

        {/* ================= BOTTOM PRICING SUMMARY ================= */}
        <div style={{ marginTop: '64px', textAlign: 'center' }}>
          <div className={styles.pricingHeroCard} style={{ margin: '0 auto' }}>
            <div className={styles.priceDisplay}>
              <div className={styles.priceLabel}>Limited Seats Available for 2026 Weekend Cohort</div>
              <div className={styles.priceValueWrap}>
                <span className={styles.priceCurrent}>₹2,400</span>
                <span className={styles.priceOriginal}>₹7,999</span>
                <span className={styles.priceDiscountBadge}>Save ₹5,599</span>
              </div>
              <div className={styles.priceInternshipTag}>
                <CheckCircle2 size={16} color="#0284c7" />
                <span>Training: ₹2,400 | 2-Month Internship: <strong>₹0 (FREE)</strong> | 4 Certificates Included</span>
              </div>
            </div>

            <div className={styles.ctaActionWrap}>
              <button
                type="button"
                onClick={handleEnrollClick}
                disabled={paymentStep === 'initiating' || paymentStep === 'verifying'}
                className={styles.enrollBtn}
              >
                <Zap size={18} />
                <span>Pay ₹2,400 via Razorpay</span>
              </button>
              <Link href="/training-and-internship/checkout" className={styles.viewInvoiceLink}>
                View Checkout Invoice &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ================= PAYMENT RECEIPT MODAL ON SUCCESS ================= */}
      {paymentStep === 'success' && paymentReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              textAlign: 'center',
              padding: '32px 28px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={38} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
              Enrollment Confirmed!
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              You are officially enrolled in the <strong>Frontend Developer Training &amp; 2-Month Internship</strong> (Weekend Cohort 2026).
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px 20px',
                textAlign: 'left',
                fontSize: '13px',
                marginBottom: '22px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Student:</span>
                <strong>{paymentReceipt.userEmail}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Amount Paid:</span>
                <span style={{ color: '#059669', fontWeight: 800 }}>₹2,400</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Internship Fee:</span>
                <span style={{ color: '#2563eb', fontWeight: 800 }}>₹0 (100% Free)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Razorpay Payment ID:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{paymentReceipt.paymentId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Batch Schedule:</span>
                <strong style={{ color: '#0284c7' }}>Weekend Live Classes (Sat &amp; Sun)</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => router.push('/my-learning')}
                className={styles.enrollBtn}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Go to My Learning Dashboard &rarr;
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '10px',
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={15} /> Print Official Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Sign In to Complete Enrollment"
        subtitle="Please sign in or create an account to activate your Frontend Developer Training & Internship enrollment."
      />
    </div>
  );
}
