'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCrm } from '../../../context/CrmContext';
import { Mail, KeyRound, ShieldAlert, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';

export default function SalesLoginPage() {
  const { crmUser, loading, sendOtp, verifyOtp } = useCrm();
  const router = useRouter();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // If already authenticated, redirect to /sales
  useEffect(() => {
    if (!loading && crmUser) {
      router.replace('/sales');
    }
  }, [loading, crmUser, router]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: Send OTP to agent email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your work email address.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    const res = await sendOtp(cleanEmail);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || `A 6-digit login code has been sent to ${cleanEmail}`);
      setStep('otp');
      setCountdown(60);
      setOtp('');
    } else {
      setError(res.message || 'Email not found in authorized agent database.');
    }
  };

  // Step 2: Verify OTP and log in without password
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setSubmitting(true);

    const res = await verifyOtp(email.trim(), cleanOtp);
    if (res.success) {
      router.push('/sales');
    } else {
      setError(res.message || 'Invalid or expired code. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f1f6fe',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <div style={{ color: '#2563eb', fontSize: '14px', fontWeight: 600 }}>Loading Portal...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e0effe 50%, #f1f6fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
      position: 'relative',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Brand Showcase with Official Logos */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            {/* Logo 1: 3D Icon */}
            <div style={{
              width: '52px',
              height: '52px',
              position: 'relative',
              filter: 'drop-shadow(0 6px 14px rgba(37, 99, 235, 0.25))',
            }}>
              <Image
                src="/images/binary-vidya-icon.png"
                alt="Binary Vidya Icon"
                width={52}
                height={52}
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>

            {/* Logo 2: Wordmark */}
            <Image
              src="/images/binary-vidya-wordmark.png"
              alt="Binary Vidya"
              width={160}
              height={36}
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              priority
            />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#2563eb',
            letterSpacing: '0.04em',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)',
          }}>
            <ShieldCheck size={13} color="#2563eb" />
            <span>SALES &amp; ADMISSIONS CRM</span>
          </div>
        </div>

        {/* Card: Clean Light Blue & White Aesthetics */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid #dbeafe',
          boxShadow: '0 20px 45px -10px rgba(37, 99, 235, 0.12), 0 6px 16px rgba(0, 0, 0, 0.03)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top Accent Gradient Line */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #2563eb 0%, #0284c7 50%, #38bdf8 100%)',
          }} />

          {step === 'email' ? (
            /* =============================================================
               STEP 1: EMAIL INPUT (PASSWORDLESS)
               ============================================================= */
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Agent Sign In
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
                Enter your registered work email to receive a one-time login code. No password required.
              </p>

              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    Work Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="agent@binaryvidya.com"
                      autoComplete="email"
                      autoFocus
                      required
                      className="crm-login-input"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '14px',
                        fontWeight: 500,
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <ShieldAlert size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="crm-login-btn"
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: submitting ? '#1d4ed8' : '#2563eb',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {submitting ? (
                    'Checking database & sending code...'
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* =============================================================
               STEP 2: OTP VERIFICATION (DIRECT LOGIN WITHOUT PASSWORD)
               ============================================================= */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Change Email"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Enter Login Code
                </h2>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
                We sent a 6-digit code to <strong style={{ color: '#0f172a' }}>{email}</strong>.
              </p>

              {successMsg && (
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <CheckCircle2 size={15} color="#2563eb" style={{ flexShrink: 0 }} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    6-Digit Security Code
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound
                      size={16}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setOtp(val);
                        if (error) setError('');
                      }}
                      placeholder="123456"
                      autoFocus
                      required
                      className="crm-login-input"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '18px',
                        fontWeight: 700,
                        letterSpacing: '6px',
                        textAlign: 'left',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <ShieldAlert size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="crm-login-btn"
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: submitting ? '#1d4ed8' : '#2563eb',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    transition: 'all 0.2s ease',
                    marginBottom: '14px',
                  }}
                >
                  {submitting ? (
                    'Verifying code...'
                  ) : (
                    <>
                      <span>Direct Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    Change Email
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || submitting}
                    onClick={() => handleSendOtp()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: countdown > 0 ? '#94a3b8' : '#2563eb',
                      cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                      padding: 0,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw size={12} />
                    {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
          }}>
            <Link
              href="/"
              style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none', fontWeight: 600 }}
            >
              &larr; Back to Main Website
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '11px', color: '#64748b' }}>
          🔒 Passwordless security for authorized Binary Vidya staff &amp; agents.
        </p>
      </div>

      <style>{`
        .crm-login-input:focus {
          border-color: #2563eb !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
        }
        .crm-login-btn:hover:not(:disabled) {
          background: #1d4ed8 !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35) !important;
        }
        .crm-login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
