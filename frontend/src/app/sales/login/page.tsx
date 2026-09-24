'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCrm } from '../../../context/CrmContext';
import { ForgotPasswordModal } from '../../../components/ForgotPasswordModal';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

type CrmAuthMode = 'signin' | 'first-login-change-password' | 'superadmin-otp';

export default function SalesLoginPage() {
  const { crmUser, loading, login, changeFirstPassword, verifyOtp } = useCrm();
  const router = useRouter();

  // Mode: Sign In, First-Time Change Password, or Super Admin 2FA OTP
  const [mode, setMode] = useState<CrmAuthMode>('signin');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // First Login Force Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Super Admin 2FA State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState('');
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // If already authenticated and not in first-login mode, redirect to /sales
  useEffect(() => {
    if (!loading && crmUser) {
      if (crmUser.mustChangePassword) {
        setMode('first-login-change-password');
      } else {
        router.replace('/sales');
      }
    }
  }, [loading, crmUser, router]);

  // Resend OTP countdown timer (20 seconds)
  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // =========================================================================
  // 1. Handle Sign In (Email + Password for Agents; OTP for Super Admin)
  // =========================================================================
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your work email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await login(cleanEmail, password);

      // Super Admin 2FA requirement (aryar0779@gmail.com)
      if (res.requireOtp) {
        setMode('superadmin-otp');
        setMaskedEmail(res.maskedEmail || cleanEmail);
        setSuccessMsg(res.message || `A 4-digit verification code has been sent to ${cleanEmail}`);
        setResendCooldown(20);
        setOtpDigits(['', '', '', '']);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
        return;
      }

      // First-time agent login: Must change temporary password
      if (res.mustChangePassword) {
        setMode('first-login-change-password');
        setSuccessMsg('Temporary password verified! Please set your new permanent password.');
        return;
      }

      // Normal Agent login success
      if (res.success) {
        router.replace('/sales');
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // 2. Handle First Login: Create Permanent Password
  // =========================================================================
  const handleChangeFirstPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      setError('Your new password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await changeFirstPassword(newPassword);
      if (res.success) {
        setSuccessMsg('Permanent password saved successfully! Redirecting to CRM Console...');
        setTimeout(() => router.replace('/sales'), 600);
      } else {
        setError(res.message || 'Failed to update permanent password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error saving new password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // 3. Handle Super Admin 2FA OTP Verification
  // =========================================================================
  const handleVerifySuperAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpDigits.join('').trim();
    if (cleanOtp.length !== 4) {
      setError('Please enter the complete 4-digit verification code.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await verifyOtp(email.trim(), cleanOtp);
      if (res.success) {
        setSuccessMsg('2FA Verified! Loading CRM Console...');
        setTimeout(() => router.replace('/sales'), 400);
      } else {
        setError(res.message || 'Invalid or expired code. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Super Admin OTP digit change handler
  const handleOtpDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 4).split('');
      const updated = [...otpDigits];
      pasted.forEach((char, idx) => {
        if (index + idx < 4) updated[index + idx] = char;
      });
      setOtpDigits(updated);
      const nextIdx = Math.min(index + pasted.length, 3);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    const cleanChar = val.replace(/\D/g, '');
    const updated = [...otpDigits];
    updated[index] = cleanChar;
    setOtpDigits(updated);

    if (cleanChar && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleResendSuperAdminOtp = async () => {
    if (resendCooldown > 0 || submitting) return;
    setError('');
    setSuccessMsg('');
    try {
      setSubmitting(true);
      const res = await login(email.trim(), password);
      if (res.requireOtp) {
        setSuccessMsg('A new 4-digit OTP has been sent to your email.');
        setResendCooldown(20);
        setOtpDigits(['', '', '', '']);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.');
    } finally {
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

          {/* Alert Messages */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '12px 14px',
              borderRadius: '10px',
              color: '#b91c1c',
              fontSize: '13px',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '12px 14px',
              borderRadius: '10px',
              color: '#15803d',
              fontSize: '13px',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* =============================================================
             MODE 1: AGENT PASSWORD SIGN IN
             ============================================================= */}
          {mode === 'signin' && (
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Agent Sign In
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
                Enter your work credentials to access the admissions console.
              </p>

              <form onSubmit={handleSignIn}>
                {/* Email Field */}
                <div style={{ marginBottom: '18px' }}>
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

                {/* Password Field */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      color="#94a3b8"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="crm-login-input"
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 42px',
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
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="crm-login-btn"
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.2s ease',
                    marginTop: '22px',
                  }}
                >
                  {submitting ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to Console</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* =============================================================
             MODE 2: FIRST LOGIN - CREATE PERMANENT PASSWORD
             ============================================================= */}
          {mode === 'first-login-change-password' && (
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, marginBottom: '12px' }}>
                <KeyRound size={12} />
                <span>FIRST-TIME SETUP</span>
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Create Permanent Password
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
                Welcome to Binary Vidya! For security, please replace your temporary password with a permanent password before accessing the CRM console.
              </p>

              <form onSubmit={handleChangeFirstPassword}>
                {/* New Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    New Permanent Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="At least 6 characters"
                      required
                      autoFocus
                      className="crm-login-input"
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 42px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Confirm Permanent Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Re-enter new password"
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
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="crm-login-btn"
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  {submitting ? 'Saving Password...' : 'Save Password & Enter CRM Dashboard \u2192'}
                </button>
              </form>
            </div>
          )}

          {/* =============================================================
             MODE 3: SUPER ADMIN 2FA OTP (aryar0779@gmail.com)
             ============================================================= */}
          {mode === 'superadmin-otp' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', fontWeight: 800 }}>
                  SUPER ADMIN 2FA
                </span>
              </div>

              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Two-Factor Verification
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
                A 4-digit security code was dispatched to <strong>{maskedEmail || email}</strong>. Enter it below to authorize sign-in.
              </p>

              <form onSubmit={handleVerifySuperAdminOtp}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      style={{
                        width: '56px',
                        height: '56px',
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 800,
                        color: '#1e3a8a',
                        background: '#f8fafc',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={submitting || otpDigits.join('').length < 4}
                  className="crm-login-btn"
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: submitting || otpDigits.join('').length < 4 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                    marginBottom: '16px',
                  }}
                >
                  {submitting ? 'Verifying...' : 'Verify & Enter Console \u2192'}
                </button>

                {/* Resend 20-second timer */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || submitting}
                    onClick={handleResendSuperAdminOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? '#94a3b8' : '#2563eb',
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw size={12} />
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Footer Back Link */}
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
          🔒 Authorized access for Binary Vidya staff &amp; admissions personnel.
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />

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
