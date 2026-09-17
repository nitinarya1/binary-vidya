'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useParams, useRouter } from 'next/navigation';
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

export default function CourseCheckoutPage() {
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

        // 2. Call backend to create official Razorpay order with test keys
        const orderRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: course.slug || course.id,
            userEmail: currentUser.email,
            userName: currentUser.name || 'Student',
            userId: currentUser.id || '',
          }),
        });

        const orderData = await orderRes.json();
        if (!orderData.success || !orderData.orderId) {
          throw new Error(orderData.message || 'Unable to initialize secure payment order.');
        }

        // 3. Launch official Razorpay standard checkout modal
        const razorpayKey =
          orderData.keyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_test_Td7SsGbdScfViP';

        const options = {
          key: razorpayKey,
          amount: orderData.amount, // in paise
          currency: orderData.currency || 'INR',
          name: 'Binary Vidya',
          description: `Enrollment: ${course.title}`,
          image: 'https://binaryvidya.com/logo.png',
          order_id: orderData.orderId,
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
                  paymentMethod: 'razorpay_authentic',
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setPaymentReceipt({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  amount: course.price,
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
          },
          notes: {
            courseId: course.id,
            courseTitle: course.title,
            studentEmail: currentUser.email,
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
    [course]
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
            <div className={styles.brandLogo}>BV</div>
            <div>
              <div className={styles.brandName}>Binary Vidya</div>
            </div>
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
                      <Layers size={13} color="#2563eb" /> {course.chaptersCount || course.chapters?.length || 1} Chapters
                    </span>
                    <span>•</span>
                    <span className={styles.metaPill}>
                      <Video size={13} color="#2563eb" /> {course.totalLessons || 12} Lectures
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
                  <Link href="/my-learning" className={styles.startCourseBtn}>
                    Go to My Learning &amp; Start Watching <ArrowRight size={18} />
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
                    ₹{course.price ? course.price.toLocaleString('en-IN') : '0'}
                  </div>
                </div>

                {/* Error Banner */}
                {paymentError && (
                  <div className={styles.errorBanner}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>{paymentError}</div>
                  </div>
                )}

                {/* AUTHENTIC BUY NOW / PAY VIA RAZORPAY BUTTON */}
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={paymentStep === 'initiating' || paymentStep === 'verifying'}
                  className={styles.buyNowBtn}
                  style={{
                    opacity: paymentStep === 'initiating' || paymentStep === 'verifying' ? 0.85 : 1,
                    cursor: paymentStep === 'initiating' || paymentStep === 'verifying' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {paymentStep === 'initiating' ? (
                    <>
                      <div className={styles.spinner} />
                      <span>Opening Razorpay Secure Gateway...</span>
                    </>
                  ) : paymentStep === 'verifying' ? (
                    <>
                      <div className={styles.spinner} />
                      <span>Verifying Official Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>Pay ₹{course.price ? course.price.toLocaleString('en-IN') : '0'} via Razorpay</span>
                    </>
                  )}
                </button>

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
        subtitle={`Please sign in or create an account to proceed with your enrollment for "${course.title}".`}
      />
    </div>
  );
}
