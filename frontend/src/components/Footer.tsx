'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';
import {
  Sparkles,
  ShieldCheck,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Lock,
  ArrowUp,
} from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
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
              Binary Vidya is India&apos;s premier modern technical academy providing industry-grade software engineering training, 2-month verified industrial internships, production project mentorship, and verifiable ISO-compliant credentials.
            </p>
            <div className={styles.footerContactList}>
              <div className={styles.footerContactItem}>
                <Mail size={14} color="#2563eb" />
                <span>support@binaryvidya.com</span>
              </div>
              <div className={styles.footerContactItem}>
                <Phone size={14} color="#2563eb" />
                <span>+91 98765 43210 / +91 80 4567 8900</span>
              </div>
              <div className={styles.footerContactItem}>
                <MapPin size={14} color="#2563eb" />
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
                  <Sparkles size={12} color="#2563eb" /> Frontend Dev (Weekend)
                </Link>
              </li>
              <li>
                <Link href="/courses">Full Stack Web Engineering</Link>
              </li>
              <li>
                <Link href="/courses">Data Structures &amp; Algorithms</Link>
              </li>
              <li>
                <Link href="/courses">Cloud &amp; DevOps Engineering</Link>
              </li>
              <li>
                <Link href="/courses">Applied AI &amp; Deep Learning</Link>
              </li>
              <li>
                <Link href="/courses">System Design Masterclass</Link>
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
                <Link href="/training-and-internship">Minor Production SaaS Project</Link>
              </li>
              <li>
                <Link href="/training-and-internship">Major Enterprise Cloud LMS</Link>
              </li>
              <li>
                <Link href="/training-and-internship">Live Code Review Audits</Link>
              </li>
              <li>
                <Link href="/training-and-internship">GitHub Portfolio Building</Link>
              </li>
              <li>
                <Link href="/training-and-internship">Weekend Live Cohorts</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Credentials & Verification */}
          <div>
            <div className={styles.footerColTitle}>Credentials &amp; Trust</div>
            <ul className={styles.footerLinksList}>
              <li>
                <Link href="/verify-certificate">
                  <ShieldCheck size={12} color="#2563eb" /> Verify Certificate Portal
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
                <Link href="/verify-certificate">Outstanding Excellence Award</Link>
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
                <Link href="/careers">Hiring Partner Network</Link>
              </li>
              <li>
                <Link href="/careers">Student Success Stories</Link>
              </li>
              <li>
                <a href="mailto:careers@binaryvidya.com">Contact Recruitment</a>
              </li>
            </ul>
          </div>

          {/* Column 5: Student Hub & Legal */}
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
                <Link href="/terms">Terms &amp; Conditions</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/refund">Refund Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges Strip */}
        <div className={styles.footerTrustStrip}>
          <div className={styles.trustBadgeItem}>
            <ShieldCheck size={18} color="#2563eb" />
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
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/security">Security Compliance</Link>
            <button onClick={scrollToTop} className={styles.backToTopBtn} type="button">
              <ArrowUp size={14} /> Back to Top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
