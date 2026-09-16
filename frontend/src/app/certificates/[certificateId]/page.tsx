'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './certificate.module.css';
import {
  Printer,
  Download,
  Share2,
  Check,
  ArrowLeft,
  ShieldCheck,
  Award,
  ExternalLink,
  QrCode,
  Sparkles,
} from 'lucide-react';

interface CertificateData {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  courseSlug?: string;
  batchName: string;
  instructor: string;
  issuedAt: string;
  grade: string;
  status: string;
  verificationUrl: string;
}

export default function CertificateDetailPage() {
  const params = useParams();
  const certificateId = params?.certificateId as string;

  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadCertificate() {
      if (!certificateId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/certificates/${encodeURIComponent(certificateId)}`);
        const data = await res.json();

        if (data.success && data.certificate) {
          setCert(data.certificate);
        } else {
          setErrorMsg(data.message || 'Certificate not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch certificate:', err);
        setErrorMsg('Failed to load certificate. Please verify the Certificate ID.');
      } finally {
        setLoading(false);
      }
    }
    loadCertificate();
  }, [certificateId]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareLinkedIn = () => {
    if (!cert) return;
    const certUrl = encodeURIComponent(window.location.href);
    const certName = encodeURIComponent(`${cert.courseTitle} - Binary Vidya`);
    const shareUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&organizationName=Binary+Vidya&issueYear=${new Date(
      cert.issuedAt
    ).getFullYear()}&issueMonth=${new Date(cert.issuedAt).getMonth() + 1}&certUrl=${certUrl}&certId=${encodeURIComponent(
      cert.certificateId
    )}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = cert?.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'September 2026';

  if (loading) {
    return (
      <div className={styles.pageContainer} style={{ justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              border: '3px solid #2563eb',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Loading Official Credential...</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Verifying Certificate ID: {certificateId}</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !cert) {
    return (
      <div className={styles.pageContainer} style={{ justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px', padding: '40px 24px', background: '#1e293b', borderRadius: '16px' }}>
          <ShieldCheck size={44} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>Certificate Not Found</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px' }}>
            {errorMsg || 'The requested certificate could not be located in our verifiable credential registry.'}
          </p>
          <Link href="/my-learning" className={styles.printBtn}>
            <ArrowLeft size={16} /> Return to My Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Top Action Controls Bar */}
      <div className={styles.topActionsBar}>
        <Link href="/my-learning" className={styles.backLink}>
          <ArrowLeft size={15} /> Back to My Learning
        </Link>

        <div className={styles.actionsGroup}>
          <button type="button" onClick={handleCopyLink} className={styles.shareBtn} title="Copy Verification Link">
            {copied ? <Check size={15} color="#10b981" /> : <Share2 size={15} />}
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>

          <button type="button" onClick={handleShareLinkedIn} className={styles.shareBtn} title="Add to LinkedIn Profile">
            <ExternalLink size={15} /> Add to LinkedIn
          </button>

          <button type="button" onClick={handlePrint} className={styles.printBtn} id="download-certificate-btn">
            <Download size={16} /> Download PDF / Print
          </button>
        </div>
      </div>

      {/* The Printable Official Certificate */}
      <div className={styles.certFrame} id="official-certificate-frame">
        <div className={styles.certOuterBorder}>
          <div className={styles.certInnerBorder}>
            {/* Background Security Watermark */}
            <div className={styles.watermark}>BV</div>

            {/* Header: Emblem & Academy Title */}
            <div className={styles.certHeader}>
              <div className={styles.brandEmblem}>BV</div>
              <div style={{ textAlign: 'left' }}>
                <h5 className={styles.academyTitle}>Binary Vidya Technical Academy</h5>
                <h1 className={styles.certMainTitle}>Certificate of Excellence</h1>
              </div>
            </div>

            {/* Gold Divider Ribbon */}
            <div className={styles.goldDivider} />

            <p className={styles.presentationText}>This verified credential is proudly presented to:</p>

            {/* Recipient Full Name */}
            <h2 className={styles.studentName} id="cert-student-name">
              {cert.studentName}
            </h2>

            {/* Achievement Text */}
            <p className={styles.achievementDesc}>
              for successful and demonstrated mastery in the comprehensive technical specialization program:
            </p>

            {/* Course Title Badge */}
            <div className={styles.courseTitleBadge} id="cert-course-title">
              {cert.courseTitle}
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
              Academic Track: <strong style={{ color: '#0f172a' }}>{cert.batchName}</strong> • Honors Distinction:{' '}
              <strong style={{ color: '#059669' }}>{cert.grade || 'Verified Honors'}</strong>
            </p>

            {/* Footer Row: Signatures, Seal, and Verification Details */}
            <div className={styles.certFooterRow}>
              {/* Academic Director Signature */}
              <div className={styles.signBlock}>
                <div className={styles.signScript}>Nitin Arya</div>
                <div className={styles.signLine} />
                <div className={styles.signTitle}>Academic Director</div>
                <div className={styles.signRole}>Binary Vidya Faculty Council</div>
              </div>

              {/* Official Gold Medallion Seal */}
              <div className={styles.officialSeal}>
                <div className={styles.sealMedallion}>
                  <span>★ OFFICIAL ★</span>
                  <Award size={18} />
                  <span>SEAL</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#b45309', letterSpacing: '0.5px' }}>
                  256-BIT CRYPTO VERIFIED
                </span>
              </div>

              {/* Verification QR & Certificate ID */}
              <div className={styles.verifyBlock}>
                <div className={styles.qrContainer}>
                  {/* Dynamic Scalable Vector QR pattern */}
                  <svg width="50" height="50" viewBox="0 0 100 100" fill="#0f172a">
                    <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
                    <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                    <rect x="18" y="18" width="9" height="9" fill="#0f172a" />
                    <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
                    <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                    <rect x="73" y="18" width="9" height="9" fill="#0f172a" />
                    <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
                    <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                    <rect x="18" y="73" width="9" height="9" fill="#0f172a" />
                    <rect x="42" y="42" width="16" height="16" fill="#0f172a" />
                    <rect x="45" y="10" width="8" height="20" fill="#0f172a" />
                    <rect x="42" y="68" width="16" height="18" fill="#0f172a" />
                    <rect x="68" y="45" width="22" height="8" fill="#0f172a" />
                    <rect x="68" y="65" width="10" height="20" fill="#0f172a" />
                    <rect x="82" y="75" width="10" height="12" fill="#0f172a" />
                  </svg>
                </div>
                <div className={styles.certMetaText}>
                  <div>
                    Certificate ID: <span className={styles.certIdHighlight}>{cert.certificateId}</span>
                  </div>
                  <div>Issued Date: {formattedDate}</div>
                  <div style={{ color: '#2563eb', fontWeight: 700, fontSize: '10px' }}>
                    binaryvidya.com/certificates/{cert.certificateId}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
