'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  Award,
  FileCheck2,
  Briefcase,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import styles from './verify.module.css';

const SAMPLE_CERT_IDS = [
  'BV-CERT-FRONTEND-2026',
  'BV-CERT-FULLSTACK-9842',
  'BV-CERT-DEVOPS-5120',
  'BV-CERT-AI-3301',
];

export default function VerifyCertificatePage() {
  const router = useRouter();
  const [certId, setCertId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = certId.trim();
    if (!cleanId) {
      setErrorMsg('Please enter a valid Certificate ID');
      return;
    }
    setErrorMsg('');
    setIsVerifying(true);
    router.push(`/certificates/${encodeURIComponent(cleanId)}`);
  };

  const handleQuickSample = (id: string) => {
    setCertId(id);
    setErrorMsg('');
    setIsVerifying(true);
    router.push(`/certificates/${encodeURIComponent(id)}`);
  };

  return (
    <div className={styles.container}>
      {/* Top Navigation */}
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

          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            <Link href="/#courses" className={styles.navLink}>
              Courses
            </Link>
            <Link href="/training-and-internship" className={styles.navLinkHighlight}>
              Training &amp; Internships
            </Link>
            <Link href="/careers" className={styles.navLink}>
              Careers
            </Link>
          </div>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.loginBtn}>
              Sign In
            </Link>
            <Link href="/training-and-internship" className={styles.primaryBtn}>
              Enroll Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Verification Card */}
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <img
              src="/images/binary-vidya-icon.png"
              alt="Binary Vidya Official Seal"
              style={{ height: '64px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(37, 99, 235, 0.2))' }}
            />
          </div>
          <div className={styles.badge}>
            <ShieldCheck size={16} /> Official Credential Verification System
          </div>
          <h1 className={styles.title}>
            Verify Binary Vidya <span className={styles.titleGradient}>Official Credentials</span>
          </h1>
          <p className={styles.subtitle}>
            Authenticate tamper-proof certificates, 2-month industrial internship experience letters, and letters of recommendation issued by Binary Vidya.
          </p>

          <div className={styles.searchCard}>
            <form onSubmit={handleVerify} className={styles.searchForm}>
              <div className={styles.inputWrapper}>
                <Search size={20} className={styles.searchIcon} />
                <input
                  type="text"
                  value={certId}
                  onChange={(e) => {
                    setCertId(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Enter Certificate ID (e.g. BV-CERT-FRONTEND-2026)"
                  className={styles.searchInput}
                  autoFocus
                />
              </div>
              <button type="submit" disabled={isVerifying} className={styles.verifyBtn}>
                {isVerifying ? 'Verifying...' : 'Verify Now'} <ArrowRight size={16} />
              </button>
            </form>

            {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

            <div className={styles.samplesWrapper}>
              <span className={styles.sampleLabel}>Try sample IDs:</span>
              <div className={styles.sampleBadges}>
                {SAMPLE_CERT_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleQuickSample(id)}
                    className={styles.sampleBadgeBtn}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Official Credentials Explanation */}
        <section className={styles.credentialsGridSection}>
          <h2 className={styles.sectionHeading}>4 Verified Credentials Issued by Binary Vidya</h2>
          <p className={styles.sectionSubheading}>
            Every student completing our training and industrial internship earns 4 verifiable credentials backed by our central registry.
          </p>

          <div className={styles.credentialsGrid}>
            <div className={styles.credentialCard}>
              <div className={styles.credIconWrap}>
                <Award size={26} color="#2563eb" />
              </div>
              <div className={styles.credBadge}>Credential 1</div>
              <h3>Training Completion Certificate</h3>
              <p>
                Validates mastery of full curriculum, assignments, algorithmic problem-solving, and weekend live workshop participation.
              </p>
            </div>

            <div className={styles.credentialCard}>
              <div className={styles.credIconWrap}>
                <Briefcase size={26} color="#0284c7" />
              </div>
              <div className={styles.credBadge}>Credential 2</div>
              <h3>2-Month Internship Experience Letter</h3>
              <p>
                Official corporate proof of 2 months hands-on software development, agile workflows, production git contributions, and team code reviews.
              </p>
            </div>

            <div className={styles.credentialCard}>
              <div className={styles.credIconWrap}>
                <FileCheck2 size={26} color="#059669" />
              </div>
              <div className={styles.credBadge}>Credential 3</div>
              <h3>Letter of Recommendation (LOR)</h3>
              <p>
                Personalized letter signed by senior industry mentors highlighting code architecture quality, teamwork, and technical problem-solving ability.
              </p>
            </div>

            <div className={styles.credentialCard}>
              <div className={styles.credIconWrap}>
                <ShieldCheck size={26} color="#7c3aed" />
              </div>
              <div className={styles.credBadge}>Credential 4</div>
              <h3>Official Course & Project Transcript</h3>
              <p>
                Comprehensive transcript detailing minor and major production projects, Git repo metrics, tech stack breakdown, and mentor evaluations.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Authenticity Guarantee */}
        <section className={styles.securityBox}>
          <div className={styles.securityHeader}>
            <Lock size={22} color="#2563eb" />
            <div>
              <h4>Cryptographically Verified & QR-Code Enabled</h4>
              <p>
                Each certificate issued by Binary Vidya features an immutable digital identifier, dynamic QR code verification, and direct employer verification support.
              </p>
            </div>
          </div>
          <div className={styles.securityPoints}>
            <div className={styles.point}>
              <CheckCircle2 size={16} color="#059669" />
              <span>Instant Verification for Recruiters</span>
            </div>
            <div className={styles.point}>
              <CheckCircle2 size={16} color="#059669" />
              <span>Tamper-Proof Cloud Registry</span>
            </div>
            <div className={styles.point}>
              <CheckCircle2 size={16} color="#059669" />
              <span>Direct LinkedIn 1-Click Credential Share</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerWrapper}>
          <div className={styles.footerBrand}>
            <img
              src="/images/binary-vidya-logo.png"
              alt="Binary Vidya"
              className={styles.footerLogoImg}
            />
            <p>
              Binary Vidya Technical Academy • Providing verifiable software engineering credentials and 2-month industrial internships.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/">Home</Link>
            <Link href="/#courses">Courses</Link>
            <Link href="/training-and-internship">Training &amp; Internships</Link>
            <Link href="/careers">Careers</Link>
            <Link href="/login">Sign In</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div>&copy; {new Date().getFullYear()} Binary Vidya Inc. All rights reserved.</div>
          <div>Authorized Credential Registry Portal</div>
        </div>
      </footer>
    </div>
  );
}
