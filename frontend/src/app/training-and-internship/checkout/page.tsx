'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
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

function TrainingCheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi_qr' | 'cards_all'>('upi_qr');
  const [paymentStep, setPaymentStep] = useState<'idle' | 'initiating' | 'verifying' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceiptData | null>(null);

  // Program & Coupon States
  const searchParams = useSearchParams();
  const programSlug = searchParams?.get('program') || 'frontend-developer-training-internship';
  const initialCoupon = searchParams?.get('coupon') || '';
  const [programData, setProgramData] = useState<any>(null);

  useEffect(() => {
    async function loadProg() {
      try {
        const res = await fetch(`/api/training-internship?slug=${encodeURIComponent(programSlug)}`);
        const data = await res.json();
        if (data.success && data.program) {
          setProgramData(data.program);
        }
      } catch (e) {
        // fallback
      }
    }
    loadProg();
  }, [programSlug]);

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

  const basePrice = programData?.pricing?.trainingPrice !== undefined ? Number(programData.pricing.trainingPrice) : 2400;
  const programTitle = programData?.title || 'Frontend Developer Training & 2-Month Internship';

  // Validate and apply coupon
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

  useEffect(() => {
    if (initialCoupon && !appliedCoupon) {
      handleApplyCoupon(initialCoupon);
    }
  }, [initialCoupon]);

  useEffect(() => {
    ensureRazorpayLoaded();
  }, []);

  const triggerRazorpayPayment = useCallback(
    async (currentUser: any) => {
      try {
        setPaymentStep('initiating');
        setPaymentError(null);

        const loaded = await ensureRazorpayLoaded();
        if (!loaded || typeof (window as any).Razorpay === 'undefined') {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        const res = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: programData?.slug || programSlug,
            userEmail: currentUser.email,
            userName: currentUser.name || 'Student',
            userId: currentUser.id || '',
            couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          }),
        });

        const orderData = await res.json();
        if (!orderData.success || (!orderData.orderId && !orderData.isFree)) {
          throw new Error(orderData.message || 'Failed to initialize payment order.');
        }

        // If coupon gave 100% discount (finalAmount === 0 or isFree), complete enrollment immediately without Razorpay
        if (orderData.isFree || orderData.finalAmount === 0 || orderData.amount === 0) {
          setPaymentReceipt({
            paymentId: orderData.paymentId || `free_${Date.now()}`,
            orderId: orderData.orderId,
            amount: 0,
            courseTitle: programTitle,
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

        const razorpayKey =
          orderData.keyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_test_Td7SsGbdScfViP';

        const options: any = {
          key: razorpayKey,
          amount: orderData.amount, // in paise
          currency: orderData.currency || 'INR',
          name: 'Binary Vidya',
          description: programTitle,
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
            name: currentUser.name || '',
            email: currentUser.email || '',
            contact: currentUser.phone || '9999999999',
          },
          notes: {
            program: programTitle,
            track: programData?.track || 'Software Engineering',
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
          setPaymentError(resp.error?.description || 'Payment was declined or cancelled.');
        });
        rzp.open();
      } catch (err: any) {
        setPaymentStep('failed');
        setPaymentError(err.message || 'Failed to open Razorpay gateway.');
      }
    },
    [appliedCoupon, selectedMethod, basePrice]
  );

  const handleProceedPayment = () => {
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

      {/* Navbar */}
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
              <ShieldCheck size={16} /> 256-Bit SSL Encrypted Razorpay Checkout
            </div>
            <Link
              href="/training-and-internship"
              style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', fontWeight: 600 }}
            >
              &larr; Back to Program Details
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <main className={styles.mainLayout}>
        <div className={styles.checkoutGrid}>
          {/* Left Column: Program Breakdown & Inclusions */}
          <div>
            <section className={styles.cardSection}>
              <div className={styles.cardHeader}>
                <BookOpen size={20} color="#2563eb" />
                <h2 className={styles.cardTitle}>Enrolled Program Overview</h2>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                  Track: {programData?.track || programData?.domain || 'Software Track'} &bull; 2-Month Cohort
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '4px 0 8px' }}>
                  {programTitle}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                  {programData?.subtitle ||
                    'Intensive live weekend training accompanied by 2 production portfolio projects (Minor & Major) and 4 verified completion credentials.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                  Live Weekend Batches (Sat &amp; Sun)
                </span>
                <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                  2-Month Internship Included FREE
                </span>
                <span style={{ background: '#faf5ff', color: '#7e22ce', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                  4 Verified Credentials
                </span>
              </div>
            </section>

            {/* 3 Core Sections Summary */}
            <section className={styles.cardSection}>
              <div className={styles.cardHeader}>
                <Layers size={20} color="#0284c7" />
                <h2 className={styles.cardTitle}>3 Program Sections Included in your Fee</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                    1. Intensive Frontend Training Curriculum
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    HTML5, CSS3, ES6+, TypeScript, React 18+, Next.js 14 App Router, Git &amp; Vercel deployment.
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                    2. Production Minor Project (SaaS Pulse Dashboard)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Reusable design system with theme toggles, interactive analytics widgets, and mobile navigation.
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                    3. Enterprise Major Project (Binary Studio Platform)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Commercial-grade e-learning &amp; collaborative platform with video player, Razorpay, and auth.
                  </div>
                </div>
              </div>
            </section>

            {/* 4 Credentials Guarantee */}
            <section className={styles.cardSection}>
              <div className={styles.cardHeader}>
                <Award size={20} color="#d97706" />
                <h2 className={styles.cardTitle}>4 Credentials Awarded Upon 2-Month Completion</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong>1. Letter of Recommendation (LOR)</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Signed by Lead Technical Architect
                  </p>
                </div>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong>2. Internship Completion Certificate</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                    2-Month Industrial Experience Credential
                  </p>
                </div>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong>3. Training Certificate</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Frontend Engineering Mastery
                  </p>
                </div>
                <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong>4. Outstanding &amp; Excellence Certificate</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Honors Recognition for Quality Projects
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary OR Verified Receipt */}
          <div>
            {paymentStep === 'success' && paymentReceipt ? (
              <div className={styles.receiptContainer}>
                <div className={styles.receiptIconWrap}>
                  <CheckCircle2 size={40} />
                </div>
                <h2 className={styles.receiptTitle}>Enrollment Activated!</h2>
                <p className={styles.receiptSubtitle}>
                  Your tuition payment has been officially processed via Razorpay.
                </p>

                <div className={styles.receiptTable}>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Track Enrolled:</span>
                    <span className={styles.receiptValue}>{paymentReceipt.courseTitle}</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Tuition Fee:</span>
                    <span className={styles.receiptValue} style={{ color: '#059669', fontSize: '15px' }}>
                      ₹{paymentReceipt.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>2-Month Internship:</span>
                    <span className={styles.receiptValue} style={{ color: '#2563eb' }}>
                      ₹0 (FREE)
                    </span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Payment ID:</span>
                    <span className={styles.receiptValue} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {paymentReceipt.paymentId}
                    </span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Order ID:</span>
                    <span className={styles.receiptValue} style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {paymentReceipt.orderId}
                    </span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Student Account:</span>
                    <span className={styles.receiptValue}>{paymentReceipt.userEmail}</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Batch Schedule:</span>
                    <span className={styles.receiptValue} style={{ color: '#0284c7' }}>
                      Weekend Live Batches (Sat &amp; Sun)
                    </span>
                  </div>
                </div>

                <div className={styles.receiptActions}>
                  <Link href="/my-learning" className={styles.startCourseBtn}>
                    Go to My Learning Dashboard <ArrowRight size={18} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={styles.printReceiptBtn}
                  >
                    <Printer size={15} /> Print Official Invoice
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.orderCard}>
                <h3 className={styles.orderTitle}>Tuition &amp; Fee Invoice</h3>

                {/* User indicator */}
                <div className={styles.userStatusPill}>
                  {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#059669" />
                      <span>
                        Enrolling as <strong>{user.email}</strong>
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <UserIcon size={16} />
                      <span>Guest Checkout (Account created upon pay)</span>
                    </div>
                  )}
                </div>

                <div className={styles.summaryRow}>
                  <span>Frontend Engineering Training Tuition:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>₹2,400</span>
                </div>

                <div className={styles.summaryRow}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>2-Month Industrial Internship:</span>
                  <span style={{ color: '#059669', fontWeight: 800 }}>100% FREE (₹0)</span>
                </div>

                <div className={styles.summaryRow}>
                  <span>Minor &amp; Major Project Code Reviews:</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>FREE</span>
                </div>

                <div className={styles.summaryRow}>
                  <span>4 Official Credentials &amp; LOR Issuance:</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>FREE</span>
                </div>

                <div className={styles.summaryRow}>
                  <span>Weekend Live Masterclass Lab Access:</span>
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
                    <Tag size={14} color="#0284c7" />
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
                            background: !couponInput.trim() || couponLoading ? '#cbd5e1' : '#0284c7',
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
                    ₹{(appliedCoupon ? appliedCoupon.finalAmount : basePrice).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Error Banner */}
                {paymentError && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      margin: '14px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Method selector */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Select Payment Gateway Method:
                  </div>

                  <div
                    onClick={() => setSelectedMethod('upi_qr')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: selectedMethod === 'upi_qr' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: selectedMethod === 'upi_qr' ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <QrCode size={18} color="#0284c7" />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px' }}>UPI &amp; QR Code (Instant Scan)</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Google Pay, PhonePe, Paytm, BHIM</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={selectedMethod === 'upi_qr'}
                      onChange={() => setSelectedMethod('upi_qr')}
                      style={{ accentColor: '#0284c7' }}
                    />
                  </div>

                  <div
                    onClick={() => setSelectedMethod('cards_all')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: selectedMethod === 'cards_all' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: selectedMethod === 'cards_all' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CreditCard size={18} color="#2563eb" />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px' }}>Debit / Credit Cards &amp; NetBanking</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Visa, MasterCard, RuPay, 50+ Banks</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={selectedMethod === 'cards_all'}
                      onChange={() => setSelectedMethod('cards_all')}
                      style={{ accentColor: '#2563eb' }}
                    />
                  </div>
                </div>

                {/* Submit button */}
                {(() => {
                  const finalPayable = appliedCoupon ? appliedCoupon.finalAmount : basePrice;
                  const isFree = finalPayable === 0;

                  return (
                    <button
                      type="button"
                      onClick={handleProceedPayment}
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
                        <span>{isFree ? 'Activating Free Enrollment...' : 'Opening Razorpay Secure Window...'}</span>
                      ) : paymentStep === 'verifying' ? (
                        <span>Verifying Payment...</span>
                      ) : isFree ? (
                        <>
                          <Sparkles size={18} />
                          <span>Claim 100% Free Enrollment (₹0) &rarr;</span>
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          <span>
                            Pay ₹{finalPayable.toLocaleString('en-IN')} via {selectedMethod === 'upi_qr' ? 'UPI / QR' : 'Cards & NetBanking'}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })()}

                <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
                  🔒 Official Razorpay 256-Bit SSL Encrypted Payment Gateway
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

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

export default function TrainingCheckoutPage() {
  return (
    <React.Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Loading checkout...
        </div>
      }
    >
      <TrainingCheckoutContent />
    </React.Suspense>
  );
}
