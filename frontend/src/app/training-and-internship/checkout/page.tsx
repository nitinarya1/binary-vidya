'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useAuth } from '../../../context/AuthContext';
import { AuthModal } from '../../../components/AuthModal';
import styles from './checkout.module.css';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
  Zap,
  ArrowRight,
  Printer,
  BookOpen,
  Award,
  Layers,
  Code,
  Sparkles,
  QrCode,
  CreditCard,
  Building2,
  Smartphone,
  AlertCircle,
  User as UserIcon,
  Tag,
  Gift,
  HelpCircle,
  FileCheck,
  Check,
} from 'lucide-react';

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

function TrainingCheckoutContent({ initialSlug }: { initialSlug?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { user } = useAuth();

  // Selected Program Slug resolution
  const resolvedSlug =
    initialSlug ||
    (params?.slug as string) ||
    searchParams?.get('program') ||
    searchParams?.get('slug') ||
    '';

  const [programData, setProgramData] = useState<any>(null);
  const [loadingProgram, setLoadingProgram] = useState(true);

  // Guest details state
  const [studentName, setStudentName] = useState(user?.name || '');
  const [studentEmail, setStudentEmail] = useState(user?.email || '');
  const [studentPhone, setStudentPhone] = useState(user?.phone || '');

  // Payment states
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'cards' | 'netbanking'>('upi');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'initiating' | 'verifying' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceiptData | null>(null);

  // Coupon state
  const initialCoupon = searchParams?.get('coupon') || '';
  const [couponInput, setCouponInput] = useState(initialCoupon);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
    description?: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Sync user state to inputs if available
  useEffect(() => {
    if (user) {
      if (!studentName && user.name) setStudentName(user.name);
      if (!studentEmail && user.email) setStudentEmail(user.email);
      if (!studentPhone && user.phone) setStudentPhone(user.phone);
    }
  }, [user]);

  // Load Program from database
  useEffect(() => {
    async function loadProgram() {
      try {
        setLoadingProgram(true);
        const queryUrl = resolvedSlug
          ? `/api/training-internship?slug=${encodeURIComponent(resolvedSlug)}`
          : `/api/training-internship`;

        const res = await fetch(queryUrl);
        const data = await res.json();

        if (data.success) {
          if (data.program) {
            setProgramData(data.program);
          } else if (Array.isArray(data.programs) && data.programs.length > 0) {
            // Find matched or default to first
            if (resolvedSlug) {
              const matched = data.programs.find(
                (p: any) =>
                  p.slug === resolvedSlug ||
                  p._id === resolvedSlug ||
                  p.id === resolvedSlug
              );
              setProgramData(matched || data.programs[0]);
            } else {
              setProgramData(data.programs[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load training program for checkout:', err);
      } finally {
        setLoadingProgram(false);
      }
    }
    loadProgram();
  }, [resolvedSlug]);

  useEffect(() => {
    ensureRazorpayLoaded();
  }, []);

  // Pricing calculations
  const basePrice =
    programData?.trainingPrice !== undefined
      ? Number(programData.trainingPrice)
      : programData?.pricing?.trainingPrice !== undefined
      ? Number(programData.pricing.trainingPrice)
      : programData?.price !== undefined
      ? Number(programData.price)
      : 2400;

  const originalPrice =
    programData?.originalPrice !== undefined
      ? Number(programData.originalPrice)
      : programData?.pricing?.originalPrice !== undefined
      ? Number(programData.pricing.originalPrice)
      : Math.round(basePrice * 2.5);

  const discountPercentage =
    originalPrice > basePrice
      ? Math.round(((originalPrice - basePrice) / originalPrice) * 100)
      : 70;

  const payableAmount = appliedCoupon ? appliedCoupon.finalAmount : basePrice;
  const programTitle = programData?.title || 'Training & Internship Program';

  // Apply Coupon
  const handleApplyCoupon = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;
    const cleanCode = codeToApply.trim().toUpperCase();

    try {
      setCouponLoading(true);
      setCouponError(null);
      setCouponSuccess(null);

      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          amount: basePrice,
          itemType: 'training',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid coupon code');
      }

      setAppliedCoupon({
        code: data.coupon.code,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
        description: data.coupon.description,
      });
      setCouponInput(data.coupon.code);
      setCouponSuccess(`Coupon "${data.coupon.code}" applied! You save ₹${data.discountAmount.toLocaleString('en-IN')}.`);
    } catch (err: any) {
      setCouponError(err.message || 'Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
    setCouponSuccess(null);
  };

  useEffect(() => {
    if (initialCoupon && !appliedCoupon) {
      handleApplyCoupon(initialCoupon);
    }
  }, [initialCoupon]);

  // Razorpay Payment Handler
  const triggerRazorpayPayment = useCallback(
    async (payerUser: any) => {
      try {
        setPaymentStep('initiating');
        setPaymentError(null);

        const loaded = await ensureRazorpayLoaded();
        if (!loaded || typeof (window as any).Razorpay === 'undefined') {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        const effectiveEmail = payerUser?.email || studentEmail;
        const effectiveName = payerUser?.name || studentName || 'Student';
        const effectivePhone = payerUser?.phone || studentPhone || '9999999999';

        if (!effectiveEmail || !effectiveEmail.includes('@')) {
          setPaymentStep('failed');
          setPaymentError('Please enter a valid email address before proceeding.');
          return;
        }

        const targetCourseId = programData?.slug || programData?._id || resolvedSlug || 'training-internship';

        const res = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: targetCourseId,
            userEmail: effectiveEmail,
            userName: effectiveName,
            userPhone: effectivePhone,
            userId: payerUser?.id || '',
            couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          }),
        });

        const orderData = await res.json();
        if (!orderData.success || (!orderData.orderId && !orderData.isFree)) {
          throw new Error(orderData.message || 'Failed to initialize payment order.');
        }

        // 100% free / instant completion
        if (orderData.isFree || orderData.finalAmount === 0 || orderData.amount === 0) {
          setPaymentReceipt({
            paymentId: orderData.paymentId || `free_${Date.now()}`,
            orderId: orderData.orderId,
            amount: 0,
            courseTitle: programTitle,
            userEmail: effectiveEmail,
            date: new Date().toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
          });
          setPaymentStep('success');

          try {
            confetti({
              particleCount: 140,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch (cErr) {}
          return;
        }

        const razorpayKey =
          orderData.keyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_live_Tfq3IKESmuLNdd';

        const options: any = {
          key: razorpayKey,
          amount: orderData.amount, // in paise
          currency: orderData.currency || 'INR',
          name: 'Binary Vidya',
          description: programTitle,
          image: '/images/binary-vidya-icon.png',
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
                  paymentMethod: selectedMethod,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setPaymentReceipt({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  amount: appliedCoupon ? appliedCoupon.finalAmount : basePrice,
                  courseTitle: programTitle,
                  userEmail: effectiveEmail,
                  date: new Date().toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }),
                });
                setPaymentStep('success');

                try {
                  confetti({
                    particleCount: 140,
                    spread: 80,
                    origin: { y: 0.6 },
                  });
                } catch (cErr) {}
              } else {
                setPaymentStep('failed');
                setPaymentError(verifyData.message || 'Signature verification failed.');
              }
            } catch (err: any) {
              setPaymentStep('failed');
              setPaymentError(err.message || 'Payment verification failed.');
            }
          },
          prefill: {
            name: effectiveName,
            email: effectiveEmail,
            contact: effectivePhone,
          },
          notes: {
            program: programTitle,
            track: programData?.domain || programData?.track || 'Software Engineering',
            price: String(basePrice),
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
        setPaymentError(err.message || 'Failed to initialize payment gateway.');
      }
    },
    [programData, resolvedSlug, studentEmail, studentName, studentPhone, appliedCoupon, basePrice, programTitle, selectedMethod]
  );

  const handleCheckoutClick = () => {
    if (!user) {
      if (!studentEmail || !studentEmail.includes('@')) {
        setShowAuthModal(true);
        return;
      }
    }
    triggerRazorpayPayment(user);
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setShowAuthModal(false);
    triggerRazorpayPayment(authenticatedUser);
  };

  if (loadingProgram) {
    return (
      <div className={styles.container}>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <div style={{ width: 44, height: 44, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontWeight: 700, fontSize: 16 }}>Loading Internship Program Details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header */}
      <nav className={styles.navbar}>
        <div className={styles.navWrapper}>
          <Link href="/training-and-internship" className={styles.brandLink}>
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
          <div className={styles.secureBadge}>
            <Lock size={14} />
            <span>256-Bit SSL Encrypted Razorpay Checkout</span>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <main className={styles.mainLayout}>
        {paymentStep === 'success' && paymentReceipt ? (
          /* ================= SUCCESS CONFIRMATION RECEIPT ================= */
          <div className={styles.receiptContainer}>
            <div className={styles.receiptIconWrap}>
              <CheckCircle2 size={36} />
            </div>

            <h1 className={styles.receiptTitle}>Enrollment Confirmed!</h1>
            <p className={styles.receiptSubtitle}>
              Congratulations! Your seat for <strong>{paymentReceipt.courseTitle}</strong> is secured.
            </p>

            <div className={styles.receiptTable}>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Student Email:</span>
                <span className={styles.receiptValue}>{paymentReceipt.userEmail}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Amount Paid:</span>
                <span className={styles.receiptValue} style={{ color: '#059669', fontSize: 16 }}>
                  ₹{paymentReceipt.amount.toLocaleString('en-IN')} (All Taxes Included)
                </span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>2-Month Industrial Internship:</span>
                <span className={styles.receiptValue} style={{ color: '#2563eb' }}>
                  100% Free Included
                </span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Razorpay Payment ID:</span>
                <span className={styles.receiptValue} style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {paymentReceipt.paymentId}
                </span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Order ID:</span>
                <span className={styles.receiptValue} style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {paymentReceipt.orderId}
                </span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Batch Schedule:</span>
                <span className={styles.receiptValue} style={{ color: '#0284c7' }}>
                  Live Weekend Masterclasses (Sat &amp; Sun)
                </span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Transaction Date:</span>
                <span className={styles.receiptValue}>{paymentReceipt.date}</span>
              </div>
            </div>

            <div className={styles.receiptActions}>
              <button
                type="button"
                onClick={() => router.push('/my-learning')}
                className={styles.startCourseBtn}
              >
                Go to My Learning Dashboard &rarr;
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className={styles.printReceiptBtn}
              >
                <Printer size={15} /> Print Official Receipt / Invoice
              </button>
            </div>
          </div>
        ) : (
          /* ================= MAIN CHECKOUT GRID ================= */
          <div className={styles.checkoutGrid}>
            {/* Left Column: Program Overview & Highlights */}
            <div>
              <section className={styles.cardSection}>
                <div className={styles.cardHeader}>
                  <BookOpen size={20} color="#2563eb" />
                  <h2 className={styles.cardTitle}>Enrolled Program Overview</h2>
                </div>

                {/* Live Thumbnail from Super Admin */}
                {programData?.thumbnail ? (
                  <div className={styles.thumbnailWrapper}>
                    <img
                      src={programData.thumbnail}
                      alt={programTitle}
                      className={styles.thumbnailImg}
                    />
                  </div>
                ) : (
                  <div className={styles.thumbnailWrapper}>
                    <div className={styles.placeholderThumb}>
                      <Sparkles size={36} style={{ marginBottom: 10, opacity: 0.9 }} />
                      <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{programTitle}</h3>
                      <span style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                        {programData?.domain || 'Industrial Training & Internship'}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                    Track: {programData?.domain || programData?.track || 'Engineering Track'} &bull; {programData?.rawDuration || '2-Month Cohort'}
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '6px 0 8px' }}>
                    {programTitle}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                    {programData?.subtitle ||
                      'Rigorous hands-on live weekend training with 2 production portfolio projects (Minor & Major) and 4 verified industry completion credentials.'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                    Live Weekend Batches (Sat &amp; Sun)
                  </span>
                  <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                    2-Month Industrial Internship (FREE)
                  </span>
                  <span style={{ background: '#faf5ff', color: '#7e22ce', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                    4 Verified Credentials + LOR
                  </span>
                </div>
              </section>

              {/* 3 Core Curriculum Inclusions */}
              <section className={styles.cardSection}>
                <div className={styles.cardHeader}>
                  <Layers size={20} color="#0284c7" />
                  <h2 className={styles.cardTitle}>3 Program Sections Included in your Fee</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Code size={15} color="#2563eb" />
                      1. Intensive {programData?.domain || 'Software'} Training Curriculum
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Live weekend lectures with senior architect mentors, live coding challenges, system design, and practical architecture.
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={15} color="#0284c7" />
                      2. Production Minor Project: {programData?.sections?.[1]?.projectTitle || 'Industry SaaS Dashboard'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Architect clean UI/UX components, theme switches, state synchronization, responsive views, and automated tests.
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={15} color="#d97706" />
                      3. Enterprise Major Project: {programData?.sections?.[2]?.projectTitle || 'Commercial Scalable Platform'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Full cloud deployment, payment gateway integrations, database modeling, and real production traffic readiness.
                    </div>
                  </div>
                </div>
              </section>

              {/* 4 Credentials Guarantee */}
              <section className={styles.cardSection}>
                <div className={styles.cardHeader}>
                  <Award size={20} color="#d97706" />
                  <h2 className={styles.cardTitle}>4 Verified Industry Credentials</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>1. Letter of Recommendation (LOR)</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                      Signed by Technical Architect &amp; BV Founders
                    </p>
                  </div>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>2. 2-Month Internship Certificate</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                      Industrial Experience with QR Verification
                    </p>
                  </div>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>3. Training Certification</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                      ISO 9001:2015 Accredited Course Credential
                    </p>
                  </div>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>4. Dual Production Project Badges</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                      Verified minor &amp; major GitHub project portfolio
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Order Summary & Checkout Card */}
            <div>
              <div className={styles.orderCard}>
                <h3 className={styles.orderTitle}>Order &amp; Enrollment Summary</h3>

                {/* User Status / Info */}
                {user ? (
                  <div className={styles.userStatusPill}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Enrolling as: <strong>{user.name || user.email}</strong></span>
                      <span style={{ color: '#059669', fontWeight: 800 }}>Signed In</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.studentFields}>
                    <div>
                      <label className={styles.fieldLabel}>Student Full Name *</label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className={styles.fieldInput}
                      />
                    </div>
                    <div>
                      <label className={styles.fieldLabel}>Student Email Address *</label>
                      <input
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="e.g. rahul@gmail.com"
                        className={styles.fieldInput}
                      />
                    </div>
                    <div>
                      <label className={styles.fieldLabel}>WhatsApp / Mobile Number</label>
                      <input
                        type="tel"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className={styles.fieldInput}
                      />
                    </div>
                  </div>
                )}

                {/* Itemized Pricing */}
                <div style={{ marginTop: '16px' }}>
                  <div className={styles.summaryRow}>
                    <span>{programTitle} Tuition:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      ₹{basePrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {originalPrice > basePrice && (
                    <div className={styles.summaryRow} style={{ color: '#059669' }}>
                      <span>Early Bird Scholarship ({discountPercentage}% OFF):</span>
                      <span style={{ fontWeight: 700 }}>
                        -₹{(originalPrice - basePrice).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className={styles.summaryRow}>
                    <span>2-Month Industrial Internship:</span>
                    <span style={{ fontWeight: 800, color: '#2563eb' }}>FREE (₹0)</span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span>4 Completion Certificates &amp; LOR:</span>
                    <span style={{ fontWeight: 800, color: '#059669' }}>FREE (₹0)</span>
                  </div>

                  {appliedCoupon && (
                    <div className={styles.summaryRow} style={{ color: '#059669', background: '#ecfdf5', padding: '6px 8px', borderRadius: '6px' }}>
                      <span>Coupon Discount ({appliedCoupon.code}):</span>
                      <span style={{ fontWeight: 800 }}>-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className={styles.totalRow}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Total Payable Amount</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Includes 18% GST &amp; Live Lab Access</div>
                    </div>
                    <div className={styles.totalAmount}>
                      ₹{payableAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Coupon Box */}
                <div style={{ marginTop: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <label className={styles.fieldLabel}>Have a Promo or Referral Coupon?</label>
                  {appliedCoupon ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 12px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={16} color="#059669" />
                        <span style={{ fontWeight: 800, color: '#065f46', fontSize: '13px' }}>{appliedCoupon.code} Applied</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className={styles.fieldInput}
                        style={{ textTransform: 'uppercase' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(couponInput)}
                        disabled={couponLoading || !couponInput.trim()}
                        style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0 16px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {couponLoading ? 'Checking...' : 'Apply'}
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={14} /> {couponError}
                    </p>
                  )}
                  {couponSuccess && (
                    <p style={{ color: '#059669', fontSize: '12px', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> {couponSuccess}
                    </p>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div style={{ marginTop: '18px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <label className={styles.fieldLabel}>Select Payment Method</label>
                  <div className={styles.methodGrid}>
                    <div
                      className={`${styles.methodCard} ${selectedMethod === 'upi' ? styles.methodCardActive : ''}`}
                      onClick={() => setSelectedMethod('upi')}
                    >
                      <Smartphone size={18} color={selectedMethod === 'upi' ? '#2563eb' : '#64748b'} />
                      <span>UPI / QR</span>
                    </div>

                    <div
                      className={`${styles.methodCard} ${selectedMethod === 'cards' ? styles.methodCardActive : ''}`}
                      onClick={() => setSelectedMethod('cards')}
                    >
                      <CreditCard size={18} color={selectedMethod === 'cards' ? '#2563eb' : '#64748b'} />
                      <span>Cards / EMI</span>
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {paymentError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', margin: '16px 0', color: '#b91c1c', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <AlertCircle size={16} />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Pay Button */}
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  disabled={paymentStep === 'initiating' || paymentStep === 'verifying'}
                  className={styles.buyNowBtn}
                  style={{
                    background:
                      paymentStep === 'initiating' || paymentStep === 'verifying'
                        ? '#94a3b8'
                        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  }}
                >
                  {paymentStep === 'initiating' ? (
                    <span>Opening Razorpay Secure Gateway...</span>
                  ) : paymentStep === 'verifying' ? (
                    <span>Verifying Payment...</span>
                  ) : (
                    <>
                      <Zap size={18} />
                      <span>
                        Pay ₹{payableAmount.toLocaleString('en-IN')} &bull; Instant Enrollment
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Security Guarantees */}
                <div className={styles.securityGuarantees}>
                  <div className={styles.guaranteeItem}>
                    <ShieldCheck size={16} color="#059669" />
                    <span>Instant access to LMS dashboard &amp; Slack workspace</span>
                  </div>
                  <div className={styles.guaranteeItem}>
                    <FileCheck size={16} color="#2563eb" />
                    <span>4 Accredited Certificates with unique verification IDs</span>
                  </div>
                  <div className={styles.guaranteeItem}>
                    <Calendar size={16} color="#0284c7" />
                    <span>Live weekend batches with lifetime recording access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Guest Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Sign In to Complete Enrollment"
        subtitle={`Please sign in or enter your details to enroll in ${programTitle}.`}
      />
    </div>
  );
}

export default function TrainingAndInternshipCheckoutPage() {
  return (
    <React.Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontWeight: 700, fontSize: '16px' }}>Loading Training Checkout...</p>
          </div>
        </div>
      }
    >
      <TrainingCheckoutContent />
    </React.Suspense>
  );
}
