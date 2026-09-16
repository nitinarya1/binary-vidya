'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import styles from './checkout.module.css';
import { AuthModal } from '../../../../components/AuthModal';
import { PaymentModal } from '../../../../components/PaymentModal';
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

export default function CourseCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  // Handle Buy Now Click
  const handleBuyNow = () => {
    if (!user) {
      // User is not logged in: show in-page floating AuthModal (not full screen)
      setShowAuthModal(true);
    } else {
      // User is logged in: directly trigger Razorpay Payment Modal
      setShowPaymentModal(true);
    }
  };

  // Called when user completes login/register in AuthModal
  const handleAuthSuccess = (authenticatedUser: any) => {
    setShowAuthModal(false);
    // Directly launch payment step!
    setShowPaymentModal(true);
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
        <div style={{ maxWidth: '500px', margin: '80px auto', padding: '30px', background: '#fff', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
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
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 800 }}>
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

            {/* 2. EXPIRY DATE & ACCESS VALIDITY */}
            <section className={styles.cardSection}>
              <div className={styles.cardHeader}>
                <Calendar size={20} color="#059669" />
                <h2 className={styles.cardTitle}>Access Validity &amp; Expiry Date</h2>
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

                <div className={styles.validityBox}>
                  <div className={styles.validityLabel}>Syllabus Refreshes</div>
                  <div className={styles.validityValue}>Free Continuous Updates</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    All future video iterations included at ₹0
                  </span>
                </div>

                <div className={styles.validityBox}>
                  <div className={styles.validityLabel}>Project Repositories</div>
                  <div className={styles.validityValue}>Permanent GitHub Access</div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Clone and fork code for your portfolio
                  </span>
                </div>
              </div>
            </section>

            {/* 3. ABOUT US SECTION */}
            <section className={styles.cardSection}>
              <div className={styles.cardHeader}>
                <Building size={20} color="#2563eb" />
                <h2 className={styles.cardTitle}>About Binary Vidya</h2>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.6 }}>
                Binary Vidya is a premier technical academy founded by veteran software engineers to bridge the gap between academic theory and high-scale production systems.
              </p>

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
                      A thriving community of developers across top tier companies.
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

                <div className={styles.aboutUsBox}>
                  <div className={styles.aboutUsIcon}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                      7-Day Money-Back Guarantee
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      100% satisfaction promised. Zero-risk enrollment.
                    </span>
                  </div>
                </div>

                <div className={styles.aboutUsBox}>
                  <div className={styles.aboutUsIcon}>
                    <Lock size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                      PCI-DSS Compliant Payments
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Official Razorpay gateway with UPI, Cards, NetBanking, and EMI.
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Order Summary & Buy Now Button */}
          <div>
            <div className={styles.orderCard}>
              <h3 className={styles.orderTitle}>Order Summary</h3>

              {/* User login status indicator */}
              <div className={styles.userStatusPill}>
                {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>Logged in as <strong>{user.email}</strong></span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                    <UserIcon size={16} />
                    <span>Guest Checkout (Sign In on Buy Now)</span>
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
                <span style={{ color: '#059669', fontWeight: 600 }}>
                  Scholarship Tier Discount:
                </span>
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

              {/* BUY NOW BUTTON */}
              <button
                type="button"
                onClick={handleBuyNow}
                className={styles.buyNowBtn}
              >
                <Lock size={18} />
                Buy Now &amp; Proceed to Payment
              </button>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                🔒 Powered by Razorpay Payments. Supports UPI QR code, UPI apps, Credit/Debit Cards, EMI, NetBanking, and Wallets.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* IN-PAGE AUTH MODAL (NOT FULLSCREEN) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Sign In to Complete Enrollment"
        subtitle={`Please sign in or create an account to proceed with your enrollment for "${course.title}".`}
      />

      {/* RAZORPAY MULTI-METHOD PAYMENT MODAL */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          course={{
            id: course.id,
            slug: course.slug,
            title: course.title,
            price: course.price,
            thumbnail: course.thumbnail,
            category: course.category,
          }}
          user={{
            id: user?.id,
            email: user?.email || '',
            name: user?.name || 'Student',
            phone: user?.phone,
          }}
          onPaymentSuccess={() => {
            console.log('Payment complete!');
          }}
        />
      )}
    </div>
  );
}
