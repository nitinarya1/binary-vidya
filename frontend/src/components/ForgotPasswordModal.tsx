'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../lib/api';
import { X, Mail, KeyRound, CheckCircle, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your registered email or mobile number');
      return;
    }

    try {
      setLoading(true);
      const res = await apiRequest('/auth/forgot-password/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          identifier: email.trim(),
        }),
      });

      if (res.email) {
        setEmail(res.email);
      }

      setSuccessMsg(res.message || 'OTP code sent to your registered email.');
      setStep(2);
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 6).split('');
      const updated = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) updated[i] = char;
      });
      setOtpDigits(updated);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = val.replace(/\D/g, '');
    setOtpDigits(updated);

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const fullOtp = otpDigits.join('');

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP code');
      return;
    }

    try {
      setLoading(true);
      await apiRequest('/auth/forgot-password/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp: fullOtp }),
      });
      setSuccessMsg('OTP verified! Now enter your new password.');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await apiRequest('/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({ email, otp: fullOtp, newPassword }),
      });
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '470px',
          padding: '32px',
          position: 'relative',
          background: '#ffffff',
          border: '1px solid #bfdbfe',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(37, 99, 235, 0.15), 0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          id="close-forgot-modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          <X size={16} />
        </button>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '4px',
                background: step >= s ? '#2563eb' : '#e2e8f0',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            {step === 1 && 'Reset Your Password'}
            {step === 2 && 'Enter Verification Code'}
            {step === 3 && 'Create New Password'}
            {step === 4 && 'Password Updated!'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            {step === 1 && 'Enter your registered email address or mobile number to receive your 6-digit OTP code.'}
            {step === 2 && (successMsg || `Check your email inbox for the 6-digit verification code.`)}
            {step === 3 && 'Choose a strong password with at least 6 characters.'}
            {step === 4 && 'Your password has been updated. You can now sign in.'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div
            id="forgot-modal-error"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Enter Email or Mobile */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email or Mobile Number <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  gap: '10px',
                }}
              >
                <Mail size={18} color="#64748b" />
                <input
                  type="text"
                  id="forgot-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com or +91 98765 43210"
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0f172a',
                    fontSize: '14px',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              id="send-otp-btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> Sending Code...
                </>
              ) : (
                <>
                  Send Reset OTP <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '12px', textAlign: 'center' }}>
                Enter 6-Digit Code from Email
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    id={`otp-input-${idx}`}
                    style={{
                      width: '46px',
                      height: '54px',
                      textAlign: 'center',
                      fontSize: '22px',
                      fontWeight: 700,
                      background: digit ? '#eff6ff' : '#f8fafc',
                      border: digit ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
                      borderRadius: '12px',
                      color: '#2563eb',
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="verify-otp-btn"
              disabled={loading || fullOtp.length < 6}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading || fullOtp.length < 6 ? 0.6 : 1,
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> Verifying Code...
                </>
              ) : (
                <>
                  Verify Code <ShieldCheck size={16} />
                </>
              )}
            </button>

            {/* Resend OTP */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                id="resend-otp-btn"
                onClick={() => handleSendOtp()}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: 'none',
                  color: resendCooldown > 0 ? '#94a3b8' : '#2563eb',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive code? Resend Email OTP"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                New Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  gap: '10px',
                }}
              >
                <KeyRound size={18} color="#64748b" />
                <input
                  type="password"
                  id="forgot-new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0f172a',
                    fontSize: '14px',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Confirm New Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  gap: '10px',
                }}
              >
                <KeyRound size={18} color="#64748b" />
                <input
                  type="password"
                  id="forgot-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0f172a',
                    fontSize: '14px',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              id="submit-new-password-btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.25)',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> Updating Password...
                </>
              ) : (
                <>
                  Save New Password <CheckCircle size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Success */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#eff6ff',
                border: '2px solid #2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#2563eb',
              }}
            >
              <CheckCircle size={32} />
            </div>
            <p style={{ fontSize: '14px', color: '#334155', marginBottom: '24px' }}>
              Your password has been changed. You can now log into your Binary Vidya account.
            </p>
            <button
              id="back-to-login-btn"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
