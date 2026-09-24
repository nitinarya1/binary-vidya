'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../../components/AuthModal';
import styles from './training.module.css';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Award,
  FileText,
  Briefcase,
  Sparkles,
  Code,
  Layers,
  Zap,
  Laptop,
  ArrowRight,
  X,
  Printer,
  BookOpen,
  Search,
  Filter,
  Check,
  Boxes,
  GraduationCap,
  Clock,
  ChevronRight,
  Star,
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

function TrainingAndInternshipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSlug = searchParams?.get('program') || '';
  const { user } = useAuth();

  // Dynamic Programs from Database
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<'all' | 'internship' | 'training' | 'bootcamp'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Curriculum section tab
  const [activeSectionTab, setActiveSectionTab] = useState<'all' | '1' | '2' | '3'>('all');

  // Auth & Payment states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingProgramForEnroll, setPendingProgramForEnroll] = useState<any | null>(null);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'initiating' | 'verifying' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceiptData | null>(null);

  // Fetch all training & internship programs updated by Super Admin
  useEffect(() => {
    let isMounted = true;

    async function loadPrograms() {
      try {
        setLoading(true);
        const res = await fetch('/api/training-internship', { cache: 'no-store' });
        const data = await res.json();

        if (data.success && isMounted) {
          const list = data.programs || [];
          setPrograms(list);

          // Select matching slug if provided in URL or default to first program
          if (requestedSlug) {
            const found = list.find((p: any) => p.slug === requestedSlug || p.id === requestedSlug);
            setSelectedProgram(found || data.program || list[0] || null);
          } else {
            setSelectedProgram(data.program || list[0] || null);
          }
        }
      } catch (err) {
        console.error('Failed to load training programs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPrograms();
    ensureRazorpayLoaded();

    return () => {
      isMounted = false;
    };
  }, [requestedSlug]);

  // Filtered Programs list
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchType = activeFilter === 'all' || p.type === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.track?.toLowerCase().includes(q) ||
        p.domain?.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q);
      return matchType && matchQuery;
    });
  }, [programs, activeFilter, searchQuery]);

  // Trigger authentic Razorpay payment for a specific program
  const triggerRazorpayPayment = useCallback(
    async (currentUser: any, targetProgram: any) => {
      if (!targetProgram) return;

      try {
        setPaymentStep('initiating');
        setPaymentError(null);

        const loaded = await ensureRazorpayLoaded();
        if (!loaded || typeof (window as any).Razorpay === 'undefined') {
          throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
        }

        const priceToPay = targetProgram.pricing?.trainingPrice !== undefined ? targetProgram.pricing.trainingPrice : 2400;

        // Create official Razorpay Order
        const res = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: targetProgram.slug || targetProgram.id,
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
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Binary Vidya',
          description: targetProgram.title,
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
                  amount: priceToPay,
                  courseTitle: targetProgram.title,
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
            program: targetProgram.title,
            slug: targetProgram.slug,
            track: targetProgram.track,
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

  const handleEnrollClick = (progToEnroll?: any) => {
    const target = progToEnroll || selectedProgram;
    if (!target) return;

    if (!user) {
      setPendingProgramForEnroll(target);
      setShowAuthModal(true);
    } else {
      triggerRazorpayPayment(user, target);
    }
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setShowAuthModal(false);
    if (pendingProgramForEnroll) {
      triggerRazorpayPayment(authenticatedUser, pendingProgramForEnroll);
      setPendingProgramForEnroll(null);
    } else if (selectedProgram) {
      triggerRazorpayPayment(authenticatedUser, selectedProgram);
    }
  };

  const scrollToCurriculum = (prog: any) => {
    setSelectedProgram(prog);
    const element = document.getElementById('curriculum-deepdive');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentProg = selectedProgram || programs[0];

  return (
    <div className={styles.container}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* TOP NAVIGATION */}
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

          <div className={styles.navRight}>
            <Link href="/courses" className={styles.navBtn}>
              Courses
            </Link>
            <Link href="/training-and-internship" className={styles.navBadge}>
              Training &amp; Internships
            </Link>
            <Link href="/verify-certificate" className={styles.navBtn}>
              Verify Certificate
            </Link>
            <Link href="/careers" className={styles.navBtn}>
              Careers
            </Link>

            {currentProg && (
              <button
                onClick={() => handleEnrollClick(currentProg)}
                className={styles.navBtn}
                style={{ fontWeight: 700, color: '#000' }}
              >
                Enroll Now
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          {/* Pill Badges */}
          <div className={styles.pillGroup}>
            <span className={styles.badgeTrack}>
              <Code size={14} color="#38bdf8" /> Super Admin Verified Programs
            </span>
            <span className={styles.badgeWeekend}>
              <Calendar size={14} color="#059669" /> Weekend Live Classes (Sat &amp; Sun)
            </span>
            <span className={styles.badgeFreeInternship}>
              <Sparkles size={14} color="#2563eb" /> 2-Month Internship 100% Free of Cost
            </span>
          </div>

          <h1 className={styles.heroTitle}>
            Industrial Training &amp; <br />
            <span className={styles.heroGradientText}>2-Month Industrial Internship</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Accelerate your software engineering career with mentor-led weekend live sessions, build enterprise Minor and Major portfolio projects, and complete a 2-month verified industrial internship with 4 accredited credentials.
          </p>

          {/* Key Stats Row */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{programs.length || 3}+ Tracks</div>
              <div className={styles.statLabel}>Available Programs</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>Weekend</div>
              <div className={styles.statLabel}>Live Classes (Sat &amp; Sun)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>2 Months</div>
              <div className={styles.statLabel}>Hands-on Internship</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>4 Credentials</div>
              <div className={styles.statLabel}>LOR + Verification Badges</div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          CATALOG SECTION: ALL INTERNSHIPS & TRAININGS UPDATED BY SUPER ADMIN
          ========================================================================= */}
      <section className={styles.catalogSection}>
        <div className={styles.catalogHeader}>
          <span className={styles.catalogBadge}>
            <GraduationCap size={15} /> All Active Programs ({filteredPrograms.length})
          </span>
          <h2 className={styles.catalogTitle}>Explore Training &amp; Internship Tracks</h2>
          <p className={styles.catalogSubtitle}>
            Browse all internship cohorts and training tracks created and updated by our Super Admin. Each program includes live weekend classes, capstone projects, and an industrial certificate.
          </p>
        </div>

        {/* Filter Tabs & Real-Time Search */}
        <div className={styles.catalogControls}>
          <div className={styles.catalogTabs}>
            <button
              onClick={() => setActiveFilter('all')}
              className={`${styles.catalogTabBtn} ${activeFilter === 'all' ? styles.catalogTabBtnActive : ''}`}
            >
              All Programs ({programs.length})
            </button>
            <button
              onClick={() => setActiveFilter('internship')}
              className={`${styles.catalogTabBtn} ${activeFilter === 'internship' ? styles.catalogTabBtnActive : ''}`}
            >
              Internships
            </button>
            <button
              onClick={() => setActiveFilter('training')}
              className={`${styles.catalogTabBtn} ${activeFilter === 'training' ? styles.catalogTabBtnActive : ''}`}
            >
              Trainings
            </button>
            <button
              onClick={() => setActiveFilter('bootcamp')}
              className={`${styles.catalogTabBtn} ${activeFilter === 'bootcamp' ? styles.catalogTabBtnActive : ''}`}
            >
              Bootcamps
            </button>
          </div>

          <div className={styles.catalogSearchWrap}>
            <Search size={15} className={styles.catalogSearchIcon} />
            <input
              type="text"
              placeholder="Search by track, domain, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.catalogSearchInput}
            />
          </div>
        </div>

        {/* Program Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Zap size={32} color="#2563eb" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '12px' }} />
            <p style={{ fontWeight: 600 }}>Loading programs from database...</p>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <GraduationCap size={44} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>No programs found</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Try adjusting your search query or filter selection.
            </p>
          </div>
        ) : (
          <div className={styles.catalogGrid}>
            {filteredPrograms.map((prog) => {
              const isSelected = selectedProgram && (selectedProgram.id === prog.id || selectedProgram.slug === prog.slug);
              const trainingPrice = prog.pricing?.trainingPrice !== undefined ? prog.pricing.trainingPrice : 2400;
              const originalPrice = prog.pricing?.originalPrice !== undefined ? prog.pricing.originalPrice : 7999;
              const discountPct = prog.pricing?.discountPercentage || Math.round((1 - (trainingPrice / originalPrice)) * 100) || 70;

              return (
                <div
                  key={prog.id || prog.slug}
                  className={`${styles.progCard} ${isSelected ? styles.progCardSelected : ''}`}
                >
                  {isSelected && (
                    <div className={styles.progActiveIndicator}>
                      <Check size={11} /> Viewing Details
                    </div>
                  )}

                  {/* Program Thumbnail Image or Modern Tech Fallback */}
                  <div className={styles.progThumbBox}>
                    {prog.thumbnail ? (
                      <img
                        src={prog.thumbnail}
                        alt={prog.title}
                        className={styles.progThumbImg}
                      />
                    ) : (
                      <div className={styles.progThumbFallback}>
                        <div className={styles.progThumbFallbackIcon}>
                          <Code size={22} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                          {prog.track || prog.domain || 'Engineering Track'}
                        </span>
                      </div>
                    )}

                    <div className={styles.progThumbBadges}>
                      <span className={styles.progTrackBadge}>
                        {prog.track || prog.domain || 'Software Track'}
                      </span>
                      <span className={styles.progTypeBadge}>
                        {prog.type || 'Internship'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className={styles.progCardBody}>
                    <h3 className={styles.progCardTitle} title={prog.title}>
                      {prog.title}
                    </h3>
                    <p className={styles.progCardSubtitle} title={prog.subtitle || prog.title}>
                      {prog.subtitle || 'Complete hands-on training, industry minor & major projects, and verified credentials.'}
                    </p>

                    {/* Schedule & Duration Info */}
                    <div className={styles.progCardMetaRow}>
                      <div className={styles.progCardMetaItem}>
                        <Calendar size={14} color="#059669" />
                        <span>{prog.schedule?.badge || 'Weekend Live Batches'}</span>
                      </div>
                      <div className={styles.progCardMetaItem}>
                        <Clock size={14} color="#2563eb" />
                        <span>{prog.rawDuration || prog.duration?.total || '2 Months Internship + Training'}</span>
                      </div>
                    </div>

                    {/* Price Block */}
                    <div className={styles.progCardPriceBlock}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Tuition Bundle</div>
                        <span className={styles.progCardPriceVal}>₹{trainingPrice.toLocaleString('en-IN')}</span>
                        {originalPrice > trainingPrice && (
                          <span className={styles.progCardOrigPrice}>₹{originalPrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                      <span className={styles.progCardScholarship}>{discountPct}% Off</span>
                    </div>

                    {/* Actions */}
                    <div className={styles.progCardBtnGroup}>
                      <button
                        type="button"
                        onClick={() => scrollToCurriculum(prog)}
                        className={styles.progCardViewBtn}
                      >
                        <BookOpen size={13} />
                        <span>View Syllabus</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEnrollClick(prog)}
                        className={styles.progCardEnrollBtn}
                      >
                        <Zap size={13} />
                        <span>Enroll Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Error Banner */}
      {paymentError && (
        <div
          style={{
            maxWidth: '650px',
            margin: '20px auto',
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

      {/* =========================================================================
          CURRICULUM DEEP-DIVE FOR SELECTED PROGRAM
          ========================================================================= */}
      {currentProg && (
        <main id="curriculum-deepdive" className={styles.mainLayout}>
          {/* Selected Program Header */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Selected Curriculum</span>
            <h2 className={styles.sectionTitle}>{currentProg.title}</h2>
            <p className={styles.sectionSubtitle}>
              {currentProg.subtitle ||
                'Our structured curriculum bridges the gap between academic theory and real-world software engineering through rigorous live training and dual portfolio projects.'}
            </p>
          </div>

          {/* Pricing & CTA Card for Selected Program */}
          <div className={styles.pricingHeroCard} style={{ margin: '0 auto 48px' }}>
            <div className={styles.priceDisplay}>
              <div className={styles.priceLabel}>All-Inclusive Tuition Bundle</div>
              <div className={styles.priceValueWrap}>
                <span className={styles.priceCurrent}>
                  ₹{(currentProg.pricing?.trainingPrice !== undefined ? currentProg.pricing.trainingPrice : 2400).toLocaleString('en-IN')}
                </span>
                {currentProg.pricing?.originalPrice && (
                  <span className={styles.priceOriginal}>
                    ₹{currentProg.pricing.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span className={styles.priceDiscountBadge}>
                  {currentProg.pricing?.discountPercentage || 70}% Scholarship Applied
                </span>
              </div>
              <div className={styles.priceInternshipTag}>
                <CheckCircle2 size={16} color="#0284c7" />
                <span>2-Month Industrial Internship is <strong>100% Free of Cost</strong></span>
              </div>
            </div>

            <div className={styles.ctaActionWrap}>
              <button
                type="button"
                onClick={() => handleEnrollClick(currentProg)}
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
                    <span>
                      Enroll Now &bull; Pay ₹{(currentProg.pricing?.trainingPrice !== undefined ? currentProg.pricing.trainingPrice : 2400).toLocaleString('en-IN')} via Razorpay
                    </span>
                  </>
                )}
              </button>

              <Link
                href={`/training-and-internship/checkout?program=${currentProg.slug || currentProg.id}`}
                className={styles.viewInvoiceLink}
              >
                Or view detailed invoice &amp; payment options &rarr;
              </Link>
            </div>
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
                  {currentProg.sections?.[0]?.title || 'Intensive Engineering Training'}
                </span>
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
                {currentProg.domain || 'Software Engineering Architecture'}
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.6 }}>
                {currentProg.sections?.[0]?.tagline ||
                  'Deep dive into modern standards, component lifecycles, functional reactivity, state machines, strict typing, and production deployment best practices during weekend live classes.'}
              </p>

              {/* Modules Grid */}
              <div className={styles.modulesGrid}>
                {currentProg.sections?.[0]?.modules && currentProg.sections[0].modules.length > 0 ? (
                  currentProg.sections[0].modules.map((mod: any, idx: number) => (
                    <div key={idx} className={styles.moduleBox}>
                      <div className={styles.moduleHeader}>
                        <div className={styles.moduleNumber}>Mod {mod.moduleNumber || idx + 1}</div>
                        <h4 className={styles.moduleTitle}>{mod.title}</h4>
                      </div>
                      {mod.topics && Array.isArray(mod.topics) && (
                        <ul className={styles.moduleTopicsList}>
                          {mod.topics.map((t: string, i: number) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    <div className={styles.moduleBox}>
                      <div className={styles.moduleHeader}>
                        <div className={styles.moduleNumber}>Mod 1.1</div>
                        <h4 className={styles.moduleTitle}>Foundational Standards &amp; Architecture</h4>
                      </div>
                      <ul className={styles.moduleTopicsList}>
                        <li>Modern semantic design, box model mastery, and fluid layout paradigms</li>
                        <li>Responsive layouts, modern CSS variables, and layout engines</li>
                        <li>Accessibility standards (a11y), clean DOM structure, and Core Web Vitals</li>
                      </ul>
                    </div>

                    <div className={styles.moduleBox}>
                      <div className={styles.moduleHeader}>
                        <div className={styles.moduleNumber}>Mod 1.2</div>
                        <h4 className={styles.moduleTitle}>Modern JavaScript (ES6+) &amp; Asynchronous Mastery</h4>
                      </div>
                      <ul className={styles.moduleTopicsList}>
                        <li>Event loop mechanics, call stack, microtask queue, and Promise lifecycle</li>
                        <li>Async/Await error handling, closures, lexical scoping, and functional patterns</li>
                        <li>Modular JS architecture, ES modules, npm ecosystems, and bundling</li>
                      </ul>
                    </div>

                    <div className={styles.moduleBox}>
                      <div className={styles.moduleHeader}>
                        <div className={styles.moduleNumber}>Mod 1.3</div>
                        <h4 className={styles.moduleTitle}>TypeScript for Scalable Production Systems</h4>
                      </div>
                      <ul className={styles.moduleTopicsList}>
                        <li>Static typing vs Dynamic typing: strict compilation, type guards &amp; narrowing</li>
                        <li>Interfaces, type aliases, generics, union types, and utility types</li>
                        <li>Typing asynchronous API responses, events, and modern component props</li>
                      </ul>
                    </div>

                    <div className={styles.moduleBox}>
                      <div className={styles.moduleHeader}>
                        <div className={styles.moduleNumber}>Mod 1.4</div>
                        <h4 className={styles.moduleTitle}>Modern Frameworks Deep Dive &amp; State Architecture</h4>
                      </div>
                      <ul className={styles.moduleTopicsList}>
                        <li>Component lifecycles, reactive state trees, and hook dependencies</li>
                        <li>Custom hooks for reusable business logic and UI reactivity</li>
                        <li>Global state management, context dispatchers, and memoization</li>
                      </ul>
                    </div>

                    <div className={styles.moduleBox}>
                      <div className={styles.moduleHeader}>
                        <div className={styles.moduleNumber}>Mod 1.5</div>
                        <h4 className={styles.moduleTitle}>Full-Stack Capabilities &amp; API Integration</h4>
                      </div>
                      <ul className={styles.moduleTopicsList}>
                        <li>Server Components vs Client Components, streaming, and SSR</li>
                        <li>API route handling, secure authentication, and database connectivity</li>
                        <li>Data fetching caching, incremental regeneration, and SEO</li>
                      </ul>
                    </div>

                    <div className={styles.moduleBox}>
                      <div className={styles.moduleHeader}>
                        <div className={styles.moduleNumber}>Mod 1.6</div>
                        <h4 className={styles.moduleTitle}>Developer Tooling, Git &amp; Cloud Deployment</h4>
                      </div>
                      <ul className={styles.moduleTopicsList}>
                        <li>Professional Git workflows: branches, pull requests, and CI/CD pipelines</li>
                        <li>Code quality automation with ESLint, Prettier, and TypeScript compiler</li>
                        <li>Live cloud deployments, custom domain routing, and telemetry</li>
                      </ul>
                    </div>
                  </>
                )}
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
                {currentProg.sections?.[1]?.title || 'SaaS Pulse • Modern Analytics & Productivity Dashboard'}
              </h3>
              <div className={styles.projectTagline}>
                Modular Architecture with Real-Time Data Visualization &amp; Theme Switcher
              </div>
              <p className={styles.projectDescription}>
                {currentProg.sections?.[1]?.description ||
                  'In this hands-on minor project, students build a responsive, production-ready SaaS administration dashboard from scratch. The project focuses on clean component modularity, fluid responsive layouts, customizable dark/light modes, and interactive data visualization charts.'}
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
                {currentProg.sections?.[2]?.title || 'Binary Studio • Enterprise E-Learning & Collaborative Platform'}
              </h3>
              <div className={styles.projectTagline}>
                Full-Scale Commercial Application with Streaming, Auth &amp; Razorpay Gateway
              </div>
              <p className={styles.projectDescription}>
                {currentProg.sections?.[2]?.description ||
                  'The capstone major project simulates building an actual commercial tech platform like Udemy or Coursera from the ground up. You will integrate secure user authentication, catalog search and dynamic routing, responsive custom video lecture players with playback persistence, official Razorpay payment integration, and verifiable digital certificate issuance.'}
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
                    Personalized, verifiable Letter of Recommendation detailing your project contributions, technical skills, and problem-solving abilities.
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
                    Official corporate credential recognizing 2 months of hands-on industrial internship experience working on production web systems.
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
                    Certifies complete mastery of software engineering, modern frameworks, and architectures, verified through code assignments.
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
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                <Calendar size={13} /> {currentProg.schedule?.badge || 'Flexible Weekend Schedule'}
              </div>
              <h3 className={styles.scheduleHeading}>Classes Strictly on Weekends</h3>
              <p className={styles.scheduleSub}>
                Never worry about missing classes because of college lectures, exams, or weekday office hours. All live interactive classes, coding labs, and mentor doubt-clearing sessions happen on Saturdays and Sundays.
              </p>

              <div className={styles.schedulePoints}>
                <div className={styles.scheduleItem}>
                  <Check size={18} color="#38bdf8" />
                  <span>{currentProg.schedule?.days || 'Live Interactive Saturday & Sunday Masterclasses'}</span>
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
                {currentProg.schedule?.timings || 'Live Interactive Sessions + 24/7 Session Recordings'}
              </div>

              <button
                onClick={() => handleEnrollClick(currentProg)}
                className={styles.enrollBtn}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Enroll for Weekend Batch • ₹{(currentProg.pricing?.trainingPrice !== undefined ? currentProg.pricing.trainingPrice : 2400).toLocaleString('en-IN')}
              </button>
            </div>
          </div>

          {/* ================= BOTTOM PRICING SUMMARY ================= */}
          <div style={{ marginTop: '64px', textAlign: 'center' }}>
            <div className={styles.pricingHeroCard} style={{ margin: '0 auto' }}>
              <div className={styles.priceDisplay}>
                <div className={styles.priceLabel}>Limited Seats Available for 2026 Weekend Cohort</div>
                <div className={styles.priceValueWrap}>
                  <span className={styles.priceCurrent}>
                    ₹{(currentProg.pricing?.trainingPrice !== undefined ? currentProg.pricing.trainingPrice : 2400).toLocaleString('en-IN')}
                  </span>
                  {currentProg.pricing?.originalPrice && (
                    <span className={styles.priceOriginal}>
                      ₹{currentProg.pricing.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className={styles.priceDiscountBadge}>
                    Save ₹{((currentProg.pricing?.originalPrice || 7999) - (currentProg.pricing?.trainingPrice || 2400)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.priceInternshipTag}>
                  <CheckCircle2 size={16} color="#0284c7" />
                  <span>
                    Training: ₹{(currentProg.pricing?.trainingPrice || 2400).toLocaleString('en-IN')} | 2-Month Internship: <strong>₹0 (FREE)</strong> | 4 Certificates Included
                  </span>
                </div>
              </div>

              <div className={styles.ctaActionWrap}>
                <button
                  type="button"
                  onClick={() => handleEnrollClick(currentProg)}
                  disabled={paymentStep === 'initiating' || paymentStep === 'verifying'}
                  className={styles.enrollBtn}
                >
                  <Zap size={18} />
                  <span>
                    Pay ₹{(currentProg.pricing?.trainingPrice !== undefined ? currentProg.pricing.trainingPrice : 2400).toLocaleString('en-IN')} via Razorpay
                  </span>
                </button>
                <Link
                  href={`/training-and-internship/checkout?program=${currentProg.slug || currentProg.id}`}
                  className={styles.viewInvoiceLink}
                >
                  View Checkout Invoice &rarr;
                </Link>
              </div>
            </div>
          </div>
        </main>
      )}

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
              You are officially enrolled in the <strong>{paymentReceipt.courseTitle}</strong> (Weekend Cohort 2026).
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
                <span style={{ color: '#059669', fontWeight: 800 }}>₹{paymentReceipt.amount.toLocaleString('en-IN')}</span>
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
        subtitle={`Please sign in or create an account to activate your ${pendingProgramForEnroll?.title || currentProg?.title || 'Training & Internship'} enrollment.`}
      />
    </div>
  );
}

export default function TrainingAndInternshipPage() {
  return (
    <React.Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontWeight: 700, fontSize: '16px' }}>Loading Training &amp; Internship Programs...</p>
          </div>
        </div>
      }
    >
      <TrainingAndInternshipContent />
    </React.Suspense>
  );
}
