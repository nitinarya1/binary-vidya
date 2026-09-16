'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './login.module.css';
import { useAuth } from '../../context/AuthContext';
import { GoogleLoginBtn } from '../../components/GoogleLoginBtn';
import { ForgotPasswordModal } from '../../components/ForgotPasswordModal';
import { isSuperAdminEmail } from '../../lib/auth-helpers';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
  ShieldCheck,
  Zap,
  BookOpen,
  Phone,
  CheckCircle2,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type AuthStep = 'email' | 'password' | 'register' | 'superadmin-otp';

export default function LoginPage() {
  const router = useRouter();
  const { login, verifySuperAdminOtp, registerUser, logout, user, isLoading } = useAuth();

  // Current Authentication Step
  const [step, setStep] = useState<AuthStep>('email');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Verified User Cache from Step 1
  const [verifiedUser, setVerifiedUser] = useState<any | null>(null);

  // Status & Modal States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Super Admin 2FA States
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      if (isSuperAdminEmail(user.email)) {
        router.push('/super-admin');
      } else {
        router.push('/');
      }
    }
  }, [isLoading, user, router]);

  // Step 1: Verify Email / Identifier
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const loginId = email.trim();
    if (!loginId) {
      setErrorMsg('Please enter your email address or mobile number.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginId }),
      });

      const data = await res.json();
      if (data.success && data.exists) {
        setVerifiedUser(data.user);
        setStep('password');
      } else {
        setErrorMsg(
          data.message || 'No account found with this email. Please check spelling or create an account.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Sign In with Password
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const result = await login(email, password);

      if (result.requireOtp) {
        if (result.maskedEmail) setMaskedEmail(result.maskedEmail);
        setSuccessMsg(result.message || 'Super Admin 4-digit OTP sent to your registered email!');
        setStep('superadmin-otp');
        setOtpDigits(['', '', '', '']);
        setResendCooldown(60);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
        return;
      }

      if (result.user) {
        if (isSuperAdminEmail(result.user.email)) {
          setSuccessMsg('Welcome, Super Admin! Opening Super Admin Console...');
          setTimeout(() => router.push('/super-admin'), 200);
        } else {
          setSuccessMsg('Welcome back! Logging you in...');
          setTimeout(() => router.push('/'), 200);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid password. Please check your credentials or reset password.');
    } finally {
      setLoading(false);
    }
  };

  // Super Admin OTP digit change
  const handleOtpDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 4).split('');
      const updated = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 4) updated[i] = char;
      });
      setOtpDigits(updated);
      const nextIdx = Math.min(pasted.length, 3);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = val.replace(/\D/g, '');
    setOtpDigits(updated);

    if (val && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Step 2FA: Verify Super Admin Login OTP
  const handleSuperAdminOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 4) {
      setErrorMsg('Please enter the complete 4-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const verified = await verifySuperAdminOtp(email, fullOtp);
      if (verified) {
        if (isSuperAdminEmail(verified.email)) {
          setSuccessMsg('Super Admin 2FA Verified! Opening Super Admin Console...');
          setTimeout(() => router.push('/super-admin'), 200);
        } else {
          setSuccessMsg('Admin 2FA Verified! Opening Admin Console...');
          setTimeout(() => router.push('/admin'), 200);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendSuperAdminOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setLoading(true);
      const res = await login(email, password);
      if (res.requireOtp) {
        setSuccessMsg('A new 4-digit OTP has been sent to your email.');
        setResendCooldown(60);
        setOtpDigits(['', '', '', '']);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Register New User
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const rawDigits = phone.replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Please enter a valid email address and password.');
      return;
    }

    try {
      setLoading(true);
      const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
      const newUser = await registerUser(name, email, password, fullPhone);

      if (isSuperAdminEmail(newUser?.email)) {
        setSuccessMsg('Super Admin account ready! Opening Super Admin Console...');
        setTimeout(() => router.push('/super-admin'), 200);
      } else {
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => router.push('/'), 200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.pageContainer}>
      <div className={styles.authWrapper}>
        {/* Left Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.brandHeader}>
            <div className={styles.brandLogo}>BV</div>
            <span className={styles.brandName}>Binary Vidya</span>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroTag}>
              <Sparkles size={14} /> Next-Gen Technical Academy
            </div>
            <h1 className={styles.heroTitle}>Master the Code. Shape the Future.</h1>
            <p className={styles.heroSubtitle}>
              Experience interactive computer science, real-world development masterclasses, and verified certifications.
            </p>

            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <Zap size={14} />
                </div>
                <span>Curated Industry Grade Roadmaps & Projects</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <ShieldCheck size={14} />
                </div>
                <span>End-to-End Enterprise Auth & Security</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <BookOpen size={14} />
                </div>
                <span>Interactive Video Player & Live Assessments</span>
              </div>
            </div>
          </div>

          <div className={styles.heroFooter}>
            <span>&copy; {new Date().getFullYear()} Binary Vidya Inc.</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </section>

        {/* Right Form Section */}
        <section className={styles.formSection}>
          {/* Form Header */}
          <div className={styles.formHeader}>
            {step === 'superadmin-otp' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  border: '1px solid #f59e0b',
                  color: '#92400e',
                  fontSize: '12px',
                  fontWeight: 800,
                  marginBottom: '10px',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                <ShieldCheck size={14} /> {isSuperAdminEmail(email) ? 'Super Admin 2FA Security' : 'Admin Authorization 2FA'}
              </div>
            )}
            {step === 'password' && verifiedUser?.role === 'admin' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '10px',
                }}
              >
                <ShieldCheck size={14} /> Administrator Account Verified
              </div>
            )}

            <h2 className={styles.formTitle}>
              {step === 'register'
                ? 'Create your account'
                : step === 'superadmin-otp'
                ? isSuperAdminEmail(email) ? 'Super Admin 2FA Verification' : 'Admin Security Verification'
                : step === 'password'
                ? `Welcome back${verifiedUser?.name ? `, ${verifiedUser.name.split(' ')[0]}` : ''}`
                : 'Sign in to Binary Vidya'}
            </h2>
            <p className={styles.formSubtitle}>
              {step === 'register'
                ? 'Start your journey with hands-on technical excellence'
                : step === 'superadmin-otp'
                ? `Enter the 4-digit code dispatched to ${maskedEmail || email || 'aryar0779@gmail.com'}`
                : step === 'password'
                ? 'Enter your password to access your courses and dashboard'
                : 'Enter your email or mobile number to continue'}
            </p>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div id="auth-error-alert" className={styles.errorBox}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div id="auth-success-alert" className={styles.successBox}>
              <Check size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: ASK FOR EMAIL FIRST */}
          {step === 'email' && (
            <form onSubmit={handleVerifyEmail} id="auth-email-form">
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="auth-email">
                  Email Address or Mobile Number
                </label>
                <div className={styles.inputFieldWrapper}>
                  <Mail size={18} color="#94a3b8" />
                  <input
                    type="text"
                    id="auth-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="learner@binaryvidya.edu or 98765 43210"
                    required
                    autoFocus
                    className={styles.inputField}
                  />
                </div>
              </div>

              <button
                type="submit"
                id="auth-continue-btn"
                disabled={loading}
                className={styles.submitBtn}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Verifying email...' : <>Continue <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* STEP 2: ASK FOR PASSWORD (AFTER EMAIL IS VERIFIED) */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSignIn} id="auth-password-form">
              {/* Verified Account Pill */}
              <div className={styles.verifiedEmailBadge}>
                <div className={styles.verifiedEmailText}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span>{verifiedUser?.email || email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setPassword('');
                    setErrorMsg(null);
                  }}
                  className={styles.changeEmailBtn}
                  title="Change email"
                >
                  Change
                </button>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="auth-password">
                  Password
                </label>
                <div className={styles.inputFieldWrapper}>
                  <Lock size={18} color="#94a3b8" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="auth-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoFocus
                    className={styles.inputField}
                  />
                  <button
                    type="button"
                    id="toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.togglePasswordBtn}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Forgot password button right under password */}
              <div className={styles.forgotPassRow}>
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={() => setIsForgotModalOpen(true)}
                  className={styles.forgotPassLink}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                id="auth-submit-btn"
                disabled={loading}
                className={styles.submitBtn}
                style={{
                  opacity: loading ? 0.7 : 1,
                  background: verifiedUser?.role === 'admin' ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' : undefined,
                }}
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    Sign In to Account <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2.5: SUPER ADMIN 2FA OTP VERIFICATION */}
          {step === 'superadmin-otp' && (
            <form onSubmit={handleSuperAdminOtpSubmit} id="superadmin-otp-form">
              {/* Email Pill Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '18px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#2563eb" />
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('password');
                    setErrorMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Change
                </button>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>
                  Enter 4-Digit Security Code
                </label>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    margin: '12px 0 18px 0',
                  }}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      id={`superadmin-otp-input-${idx}`}
                      style={{
                        width: '56px',
                        height: '60px',
                        textAlign: 'center',
                        fontSize: '24px',
                        fontWeight: 700,
                        borderRadius: '12px',
                        border: digit ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
                        background: digit ? '#eff6ff' : '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        transition: 'all 0.15s ease-in-out',
                        boxShadow: digit ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Resend OTP button */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {resendCooldown > 0 ? (
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Resend code in <strong>{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendSuperAdminOtp}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                id="superadmin-otp-submit-btn"
                disabled={loading || otpDigits.some((d) => !d)}
                className={styles.submitBtn}
                style={{
                  opacity: loading || otpDigits.some((d) => !d) ? 0.6 : 1,
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                }}
              >
                {loading ? 'Verifying OTP...' : <>Verify & Enter Super Admin Console <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* STEP 3: CREATE ACCOUNT FORM */}
          {step === 'register' && (
            <form onSubmit={handleRegisterSubmit} id="auth-register-form">
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="register-name">
                  Full Name
                </label>
                <div className={styles.inputFieldWrapper}>
                  <UserIcon size={18} color="#94a3b8" />
                  <input
                    type="text"
                    id="register-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    autoFocus
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="register-phone">
                  Mobile Number
                </label>
                <div className={styles.inputFieldWrapper} style={{ padding: 0, overflow: 'hidden' }}>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className={styles.countryCodeSelect}
                    id="register-country-code"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+65">🇸🇬 +65</option>
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '12px 14px', gap: '10px' }}>
                    <Phone size={18} color="#94a3b8" />
                    <input
                      type="tel"
                      id="register-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      required
                      className={styles.inputField}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="register-email">
                  Email Address
                </label>
                <div className={styles.inputFieldWrapper}>
                  <Mail size={18} color="#94a3b8" />
                  <input
                    type="email"
                    id="register-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="learner@binaryvidya.edu"
                    required
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="register-password">
                  Password
                </label>
                <div className={styles.inputFieldWrapper}>
                  <Lock size={18} color="#94a3b8" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="register-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className={styles.inputField}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.togglePasswordBtn}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="auth-register-btn"
                disabled={loading}
                className={styles.submitBtn}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Creating Account...' : <>Create Free Account <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* Divider and Google Login (hidden during Super Admin 2FA) */}
          {step !== 'superadmin-otp' && (
            <>
              <div className={styles.divider}>
                <span>Or continue with</span>
              </div>

              <GoogleLoginBtn
                onSuccess={(googleUser) => {
                  if (googleUser?.requireOtp) {
                    setStep('superadmin-otp');
                    setEmail(googleUser.email);
                    if (googleUser.maskedEmail) setMaskedEmail(googleUser.maskedEmail);
                    setSuccessMsg(googleUser.message || 'OTP sent to aryar0779@gmail.com for Super Admin verification.');
                    setResendCooldown(60);
                    return;
                  }
                  if (isSuperAdminEmail(googleUser?.email)) {
                    setSuccessMsg('Super Admin account confirmed! Opening Super Admin Console...');
                    setTimeout(() => router.push('/super-admin'), 200);
                  } else if (googleUser?.role === 'admin') {
                    setSuccessMsg('Google verification confirmed (Admin)! Redirecting to Admin Console...');
                    setTimeout(() => router.push('/admin'), 200);
                  } else {
                    setSuccessMsg('Google sign-in successful! Redirecting...');
                    setTimeout(() => router.push('/'), 200);
                  }
                }}
                onError={(msg) => setErrorMsg(msg)}
              />
            </>
          )}

          {/* Bottom Link: Don't have an account? Create one / Already have an account? Sign in */}
          <div className={styles.footerSwitchRow}>
            {step === 'superadmin-otp' ? (
              <span>
                Want to use a different account?{' '}
                <button
                  type="button"
                  id="link-switch-to-signin-from-otp"
                  onClick={() => {
                    setStep('email');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={styles.footerSwitchBtn}
                >
                  Return to Sign In
                </button>
              </span>
            ) : step === 'register' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  id="link-switch-to-signin"
                  onClick={() => {
                    setStep('email');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={styles.footerSwitchBtn}
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  id="link-switch-to-register"
                  onClick={() => {
                    setStep('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={styles.footerSwitchBtn}
                >
                  Create one
                </button>
              </span>
            )}
          </div>
        </section>
      </div>

      {/* Forgot Password OTP Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={email}
      />
    </main>
  );
}
