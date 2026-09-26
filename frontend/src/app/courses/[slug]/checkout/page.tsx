'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useAuth } from '../../../../context/AuthContext';
import styles from './checkout.module.css';
import { AuthModal } from '../../../../components/AuthModal';
import {
  ShieldCheck,
  Lock,
  BookOpen,
  Calendar,
  Award,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Video,
  ArrowRight,
  ChevronRight,
  User as UserIcon,
  HelpCircle,
  Building,
  AlertCircle,
  Printer,
  Smartphone,
  CreditCard,
  Building2,
  QrCode,
  Zap,
  Tag,
  Gift,
} from 'lucide-react';

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
  chapters?: any[];
  chaptersCount?: number;
  totalLessons?: number;
}

interface PaymentReceiptData {
  paymentId: string;
  orderId: string;
  amount: number;
  courseTitle: string;
  userEmail: string;
  date: string;
}

// Dynamically and safely loads official Razorpay Checkout SDK
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

function CourseCheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authentication Modal
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Authentic Razorpay Payment States
  const [paymentStep, setPaymentStep] = useState<'idle' | 'initiating' | 'verifying' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceiptData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'upi_qr' | 'cards_all'>('upi_qr');

  // Coupon States
  const searchParams = useSearchParams();
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

  // Validate and apply coupon
  const handleApplyCoupon = async (codeToApply: string) => {
    if (!course || !codeToApply.trim()) return;
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
          amount: course.price,
          itemType: 'course',
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
      return true;
    } catch (err: any) {
      setCouponError(err.message || 'Failed to apply coupon');
      throw err;
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

  // Auto-apply if ?coupon=... is present in URL
  useEffect(() => {
    if (initialCoupon && course && !appliedCoupon) {
      handleApplyCoupon(initialCoupon);
    }
  }, [initialCoupon, course]);

  // Preload Razorpay Checkout SDK in background
  useEffect(() => {
    ensureRazorpayLoaded();
  }, []);

  useEffect(() => {
    async function fetchCourse() {
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
        setErrorMsg('Failed to load course details');
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [slug]);

  // Execute the authentic Razorpay checkout flow
  const triggerRazorpayPayment = useCallback(
    async (currentUser: any) => {
      if (!course) return;

      try {
        setPaymentStep('initiating');
        setPaymentError(null);

        // 1. Ensure Razorpay SDK is available
        const loaded = await ensureRazorpayLoaded();
        if (!loaded || typeof (window as any).Razorpay === 'undefined') {
          throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
        }

        // 2. Call backend to create official Razorpay order with test keys and optional coupon
        const orderRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: course.slug || course.id,
            userEmail: currentUser.email,
            userName: currentUser.name || 'Student',
            userId: currentUser.id || '',
            couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          }),
        });

        const orderData = await orderRes.json();
        if (!orderData.success || (!orderData.orderId && !orderData.isFree)) {
          throw new Error(orderData.message || 'Unable to initialize secure payment order.');
        }

        // If coupon gave 100% discount (finalAmount === 0 or isFree), complete enrollment immediately without Razorpay
        if (orderData.isFree || orderData.finalAmount === 0) {
          setPaymentReceipt({
            paymentId: orderData.paymentId || `free_${Date.now()}`,
            orderId: orderData.orderId,
            amount: 0,
            courseTitle: course.title,
            userEmail: currentUser.email,
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

        // 3. Launch official Razorpay standard checkout modal
        const razorpayKey =
          orderData.keyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_test_Td7SsGbdScfViP';

        const options: any = {
          key: razorpayKey,
          amount: orderData.amount, // in paise
          currency: orderData.currency || 'INR',
          name: 'Binary Vidya',
          description: `Enrollment: ${course.title}`,
          image: 'https://binaryvidya.com/logo.png',
          order_id: orderData.orderId,
          config: {
            display: {
              blocks: {
                upi: {
                  name: 'UPI / QR Code (Instant Scan & Pay)',
                  instruments: [
                    {
                      method: 'upi',
                      flows: ['qr', 'intent'],
                      apps: ['google_pay', 'phonepe', 'paytm', 'bhim'],
                    },
                  ],
                },
                cards: {
                  name: 'Debit/Credit Cards & NetBanking',
                  instruments: [
                    { method: 'card' },
                    { method: 'netbanking' },
                    { method: 'wallet' },
                  ],
                },
              },
              sequence:
                selectedMethod === 'upi_qr'
                  ? ['block.upi', 'block.cards']
                  : ['block.cards', 'block.upi'],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
          handler: async function (response: any) {
            // Authentic Razorpay Signature verification
            setPaymentStep('verifying');
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  paymentMethod: selectedMethod === 'upi_qr' ? 'upi_qr' : 'cards',
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setPaymentReceipt({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  amount: appliedCoupon ? appliedCoupon.finalAmount : course.price,
                  courseTitle: course.title,
                  userEmail: currentUser.email,
                  date: new Date().toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }),
                });
                setPaymentStep('success');

                // Confetti celebration
                try {
                  confetti({
                    particleCount: 140,
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
              setPaymentError(err.message || 'Payment verification network error.');
            }
          },
          prefill: {
            name: currentUser.name || '',
            email: currentUser.email || '',
            contact: currentUser.phone || '9999999999',
            method: selectedMethod === 'upi_qr' ? 'upi' : 'card',
          },
          notes: {
            courseId: course.id,
            courseTitle: course.title,
            studentEmail: currentUser.email,
            selectedMethod: selectedMethod,
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
    [course, appliedCoupon, selectedMethod]
  );

  // Handle CTA Click
  const handleProceedToPayment = () => {
    if (!user) {
      // Prompt quick in-page sign-in / sign-up modal
      setShowAuthModal(true);
    } else {
      triggerRazorpayPayment(user);
    }
  };

  // Called when user completes login/register in AuthModal
  const handleAuthSuccess = (authenticatedUser: any) => {
    setShowAuthModal(false);
    triggerRazorpayPayment(authenticatedUser);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '80px 24px', textAlign: 'center', color: '#64748b' }}>
          Loading Checkout Summary...
        </div>
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className={styles.container}>
        <div
          style={{
            maxWidth: '500px',
            margin: '80px auto',
            padding: '30px',
            background: '#fff',
            borderRadius: '16px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
          }}
        >
          <h3>{errorMsg || 'Course Not Found'}</h3>
          <Link href="/courses" style={{ color: '#2563eb', fontWeight: 700 }}>
            &larr; Return to Courses
          </Link>
        </div>
      </div>
    );
  }

  const originalPrice = Math.round((course.price || 2999) * 2.2);
  const discountAmount = originalPrice - (course.price || 0);

  return (
    <div className={styles.container}>
      {/* Official Razorpay Standard Checkout SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Top Checkout Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navWrapper}>
          <Link href="/" className={styles.brandLink}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className={styles.secureBadge}>
              <ShieldCheck size={16} /> 256-Bit SSL Encrypted Checkout
            </div>
            <Link
              href={`/courses/${course.slug || course.id}`}
              style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', fontWeight: 600 }}
            >
              &larr; Back to Details
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className={styles.mainLayout}>
        <div className={styles.checkoutGrid}>
          {/* Left Column: Details, Expiry & About Us */}
          <div>
            {/* 1. ABOUT THIS COURSE */}
            <section className={styles.cardSection}>
              <div className={styles.cardHeader}>
                <BookOpen size={20} color="#2563eb" />
                <h2 className={styles.cardTitle}>About This Course</h2>
              </div>

              <div className={styles.courseSummaryRow}>
                <div className={styles.courseMiniThumb}>
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className={styles.miniThumbImg} />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                      }}
                    >
                      {course.category}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                    {course.category} • {course.level}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px 0' }}>
                    {course.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    {course.description}
                  </p>

                  <div className={styles.metaPillsRow}>
                    <span className={styles.metaPill}>
                      <Clock size={13} color="#2563eb" /> {course.duration}
                    </span>
                    <span>•</span>
                    <span className={styles.metaPill}>
                      <Layers size={13} color="#2563eb" /> {course.chaptersCount || course.chapters?.length || 1} Modules
                    </span>
                    <span>•</span>
                    <span className={styles.metaPill}>
                      <Award size={13} color="#059669" /> Certificate Included
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', fontSize: '12px', color: '#475569' }}>
                Lead Instructor: <strong>{course.instructor || 'Binary Vidya Faculty'}</strong>
              </div>
            </section>

            {/* 2. AUTHENTIC PAYMENT GUARANTEE & METHODS */}
            <section className={styles.cardSection}>
              <div className={styles.cardHeader}>
                <ShieldCheck size={20} color="#0284c7" />
                <h2 className={styles.cardTitle}>Official Razorpay Payment Gateway</h2>
              </div>

              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                Your payment is processed directly through the official Razorpay platform with bank-grade 256-bit encryption. Binary Vidya never stores your card, UPI PIN, or banking passwords.
              </p>

              <div className={styles.validityGrid}>
                <div className={styles.validityBox}>
                  <div className={styles.validityLabel}>UPI Instant Pay</div>
                  <div className={styles.validityValue} style={{ color: '#0284c7' }}>Zero Surcharges</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Google Pay, PhonePe, Paytm, BHIM, Dynamic QR
                  </span>
                </div>

                <div className={styles.validityBox}>
                  <div className={styles.validityLabel}>Credit &amp; Debit Cards</div>
                  <div className={styles.validityValue} style={{ color: '#0284c7' }}>3D Secure OTP</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Visa, MasterCard, RuPay, Maestro, Diners
                  </span>
                </div>

                <div className={styles.validityBox}>
                  <div className={styles.validityLabel}>Indian NetBanking</div>
                  <div className={styles.validityValue} style={{ color: '#0284c7' }}>50+ Banks</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    HDFC, SBI, ICICI, Axis, Kotak, PNB &amp; more
                  </span>
                </div>

                <div className={styles.validityBox}>
                  <div className={styles.validityLabel}>Buyer Protection</div>
                  <div className={styles.validityValue} style={{ color: '#059669' }}>100% Risk-Free</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    7-Day Money-Back Guarantee
                  </span>
                </div>
              </div>
            </section>

            {/* 3. EXPIRY DATE & ACCESS VALIDITY */}
            <section className={styles.cardSection}>
              <div className={styles.cardHeader}>
                <Calendar size={20} color="#059669" />
                <h2 className={styles.cardTitle}>Access Validity &amp; Perpetual License</h2>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
                Your enrollment is backed by our permanent perpetual license policy. Study on your own schedule without arbitrary expirations.
              </p>

              <div className={styles.validityGrid}>
                <div className={styles.validityBox}>
                  <div className={styles.validityLabel}>Curriculum Access</div>
                  <div className={styles.validityValue}>Lifetime Unlimited Access</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Never expires • Rewatch any lecture anytime
                  </span>
                </div>

                <div className={styles.validityBox}>
                  <div className={styles.validityLabel}>Certificate Validity</div>
                  <div className={styles.validityValue}>Perpetual Digital Credential</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Globally verifiable link for LinkedIn &amp; CVs
                  </span>
                </div>
              </div>
            </section>

            {/* 4. ABOUT US SECTION */}
            <section className={styles.cardSection}>
              <div className={styles.cardHeader}>
                <Building size={20} color="#2563eb" />
                <h2 className={styles.cardTitle}>About Binary Vidya</h2>
              </div>

              <div className={styles.aboutUsGrid}>
                <div className={styles.aboutUsBox}>
                  <div className={styles.aboutUsIcon}>
                    <Users size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                      15,000+ Active Engineers
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      A thriving community of developers across top tier tech companies.
                    </span>
                  </div>
                </div>

                <div className={styles.aboutUsBox}>
                  <div className={styles.aboutUsIcon}>
                    <Award size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                      Verified Industry Credentials
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Recognized technical assessments and verifiable badges.
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Order Summary OR Authentic Verified Receipt */}
          <div>
            {paymentStep === 'success' && paymentReceipt ? (
              /* AUTHENTIC PAYMENT RECEIPT CARD */
              <div className={styles.receiptContainer}>
                <div className={styles.receiptIconWrap}>
                  <CheckCircle2 size={40} />
                </div>
                <h2 className={styles.receiptTitle}>Payment Confirmed!</h2>
                <p className={styles.receiptSubtitle}>
                  Your course enrollment has been successfully activated via the official Razorpay Gateway.
                </p>

                <div className={styles.receiptTable}>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Course Enrolled</span>
                    <span className={styles.receiptValue}>{paymentReceipt.courseTitle}</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Amount Paid</span>
                    <span className={styles.receiptValue} style={{ color: '#059669', fontSize: '15px' }}>
                      ₹{paymentReceipt.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Razorpay Payment ID</span>
                    <span className={styles.receiptValue} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {paymentReceipt.paymentId}
                    </span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Razorpay Order ID</span>
                    <span className={styles.receiptValue} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {paymentReceipt.orderId}
                    </span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Student Account</span>
                    <span className={styles.receiptValue}>{paymentReceipt.userEmail}</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Date &amp; Time</span>
                    <span className={styles.receiptValue}>{paymentReceipt.date}</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Access Status</span>
                    <span className={styles.receiptValue} style={{ color: '#2563eb' }}>
                      Lifetime Perpetual Access Active
                    </span>
                  </div>
                </div>

                <div className={styles.receiptActions}>
                  <Link href="/lms" className={styles.startCourseBtn}>
                    Go to LMS &amp; Start Watching <ArrowRight size={18} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={styles.printReceiptBtn}
                  >
                    <Printer size={15} /> Print Official Receipt
                  </button>
                </div>
              </div>
            ) : (
              /* ORDER SUMMARY & AUTHENTIC RAZORPAY TRIGGER CARD */
              <div className={styles.orderCard}>
                <h3 className={styles.orderTitle}>Order Summary</h3>

                {/* Razorpay Trust Badge */}
                <div className={styles.razorpayTrustBadge}>
                  <div className={styles.razorpayLogoText}>
                    <Zap size={15} color="#0284c7" />
                    <span>Razorpay Secure</span>
                  </div>
                  <span>PCI-DSS Level 1</span>
                </div>

                {/* User login status indicator */}
                <div className={styles.userStatusPill}>
                  {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#059669" />
                      <span>
                        Logged in as <strong>{user.email}</strong>
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <UserIcon size={16} />
                      <span>Guest Checkout (Sign In on 1-Click Pay)</span>
                    </div>
                  )}
                </div>

                <div className={styles.summaryRow}>
                  <span>Tuition Base Price:</span>
                  <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className={styles.summaryRow}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Scholarship Tier Discount:</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>
                    -₹{discountAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className={styles.summaryRow}>
                  <span>Lifetime Cloud Lab &amp; Code Access:</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>FREE</span>
                </div>

                <div className={styles.summaryRow}>
                  <span>Certification Verification Fee:</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>FREE</span>
                </div>

                {/* Dynamic Coupon Discount Row */}
                {appliedCoupon && (
                  <div
                    className={styles.summaryRow}
                    style={{
                      backgroundColor: '#ecfdf5',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #a7f3d0',
                      margin: '10px 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} color="#059669" />
                      <span style={{ color: '#047857', fontWeight: 800 }}>
                        Coupon ({appliedCoupon.code}):
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#059669', fontWeight: 800, fontSize: '14px' }}>
                        -₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '2px 4px',
                          textDecoration: 'underline',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Apply Promo Code Box */}
                <div
                  style={{
                    margin: '14px 0',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '8px',
                    }}
                  >
                    <Tag size={14} color="#2563eb" />
                    <span>Have a Promo Coupon?</span>
                  </div>

                  {!appliedCoupon ? (
                    <div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Enter promo coupon code"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon(couponInput);
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: couponError ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            outline: 'none',
                            backgroundColor: '#ffffff',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon(couponInput)}
                          disabled={!couponInput.trim() || couponLoading}
                          style={{
                            padding: '0 16px',
                            borderRadius: '8px',
                            background: !couponInput.trim() || couponLoading ? '#cbd5e1' : '#2563eb',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: 'none',
                            cursor: !couponInput.trim() || couponLoading ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s ease',
                          }}
                        >
                          {couponLoading ? 'Checking...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, marginTop: '6px' }}>
                          &bull; {couponError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#059669',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle2 size={15} color="#059669" />
                      <span>
                        Coupon <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.description || 'Discount active'})
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.totalRow}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>
                      Total Payable Amount
                    </span>
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                      Inclusive of all taxes
                    </span>
                  </div>
                  <div className={styles.totalAmount}>
                    ₹{((appliedCoupon ? appliedCoupon.finalAmount : (course.price || 0))).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Error Banner */}
                {paymentError && (
                  <div className={styles.errorBanner}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>{paymentError}</div>
                  </div>
                )}

                {/* SELECT PAYMENT METHOD */}
                <div style={{ marginTop: '20px', marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#475569',
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Select Payment Option:
                  </div>

                  {/* 1. UPI & QR Code */}
                  <div
                    onClick={() => setSelectedMethod('upi_qr')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: selectedMethod === 'upi_qr' ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                      background: selectedMethod === 'upi_qr' ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      marginBottom: '10px',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: selectedMethod === 'upi_qr' ? '#0284c7' : '#f1f5f9',
                          color: selectedMethod === 'upi_qr' ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <QrCode size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                          UPI &amp; QR Code (Instant Scan &amp; Pay)
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Google Pay • PhonePe • Paytm • BHIM • Dynamic QR
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedMethod === 'upi_qr'}
                      onChange={() => setSelectedMethod('upi_qr')}
                      style={{ accentColor: '#0284c7', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </div>

                  {/* 2. Cards & NetBanking */}
                  <div
                    onClick={() => setSelectedMethod('cards_all')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: selectedMethod === 'cards_all' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                      background: selectedMethod === 'cards_all' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: selectedMethod === 'cards_all' ? '#2563eb' : '#f1f5f9',
                          color: selectedMethod === 'cards_all' ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                          Cards &amp; NetBanking
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Visa, MasterCard, RuPay, 50+ Banks &amp; EMI
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selectedMethod === 'cards_all'}
                      onChange={() => setSelectedMethod('cards_all')}
                      style={{ accentColor: '#2563eb', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* AUTHENTIC BUY NOW / PAY VIA RAZORPAY BUTTON */}
                {(() => {
                  const finalPayable = appliedCoupon ? appliedCoupon.finalAmount : (course?.price || 0);
                  const isFree = finalPayable === 0;

                  return (
                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={paymentStep === 'initiating' || paymentStep === 'verifying'}
                      className={styles.buyNowBtn}
                      style={{
                        opacity: paymentStep === 'initiating' || paymentStep === 'verifying' ? 0.85 : 1,
                        cursor: paymentStep === 'initiating' || paymentStep === 'verifying' ? 'not-allowed' : 'pointer',
                        background: isFree
                          ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                          : selectedMethod === 'upi_qr'
                          ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                          : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        boxShadow: isFree ? '0 10px 25px -5px rgba(16, 185, 129, 0.4)' : undefined,
                      }}
                    >
                      {paymentStep === 'initiating' ? (
                        <>
                          <div className={styles.spinner} />
                          <span>{isFree ? 'Activating Free Enrollment...' : 'Opening Razorpay Secure Gateway...'}</span>
                        </>
                      ) : paymentStep === 'verifying' ? (
                        <>
                          <div className={styles.spinner} />
                          <span>Verifying Official Enrollment...</span>
                        </>
                      ) : isFree ? (
                        <>
                          <Sparkles size={18} />
                          <span>Claim 100% Free Enrollment (₹0) &rarr;</span>
                        </>
                      ) : selectedMethod === 'upi_qr' ? (
                        <>
                          <QrCode size={18} />
                          <span>Pay ₹{finalPayable.toLocaleString('en-IN')} via UPI / QR</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={18} />
                          <span>Pay ₹{finalPayable.toLocaleString('en-IN')} via Cards / NetBanking</span>
                        </>
                      )}
                    </button>
                  );
                })()}

                {/* Supported Methods Badges */}
                <div className={styles.methodsGrid}>
                  <span className={styles.methodBadge}>
                    <Smartphone size={13} color="#0284c7" /> UPI Apps
                  </span>
                  <span className={styles.methodBadge}>
                    <QrCode size={13} color="#059669" /> UPI QR
                  </span>
                  <span className={styles.methodBadge}>
                    <CreditCard size={13} color="#2563eb" /> Cards
                  </span>
                  <span className={styles.methodBadge}>
                    <Building2 size={13} color="#7c3aed" /> NetBanking
                  </span>
                </div>

                <div
                  style={{
                    marginTop: '14px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#64748b',
                    lineHeight: 1.5,
                  }}
                >
                  🔒 Officially powered by Razorpay. 100% authentic gateway.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* IN-PAGE AUTH MODAL (FOR GUEST CHECKOUT) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Sign In to Complete Enrollment"
        subtitle={`Please sign in or create an account to proceed with your enrollment for "${course?.title || 'Course'}".`}
      />
    </div>
  );
}

export default function CourseCheckoutPage() {
  return (
    <React.Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Loading checkout...
        </div>
      }
    >
      <CourseCheckoutContent />
    </React.Suspense>
  );
}
