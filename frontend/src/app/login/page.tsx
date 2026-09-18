'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { useAuth } from '../../context/AuthContext';
import { GoogleLoginBtn } from '../../components/GoogleLoginBtn';
import { ForgotPasswordModal } from '../../components/ForgotPasswordModal';
import { isSuperAdminEmail } from '../../lib/auth-helpers';
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

type AuthMode = 'signin' | 'register' | 'superadmin-otp';

export default function LoginPage() {
  const router = useRouter();
  const { login, verifySuperAdminOtp, registerUser, user, isLoading } = useAuth();

  // Mode: Sign In, Register, or 2FA OTP
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Super Admin 2FA State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for 2FA resend
  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      if (isSuperAdminEmail(user.email)) {
        router.push('/super-admin');
      } else {
        router.push('/');
      }
    }
  }, [isLoading, user, router]);

  // =========================================================================
  // 1. Handle Sign In
  // =========================================================================
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const loginId = email.trim();
    if (!loginId) {
      setErrorMsg('Please enter your email address or mobile number.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const result = await login(loginId, password);

      // Super Admin 2FA requirement
      if (result.requireOtp) {
        if (result.maskedEmail) setMaskedEmail(result.maskedEmail);
        setSuccessMsg(result.message || 'Super Admin 4-digit OTP sent to your registered email!');
        setMode('superadmin-otp');
        setOtpDigits(['', '', '', '']);
        setResendCooldown(60);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
        return;
      }

      if (result.user) {
        if (isSuperAdminEmail(result.user.email)) {
          setSuccessMsg('Welcome, Super Admin! Opening Super Admin Console...');
          setTimeout(() => router.push('/super-admin'), 250);
        } else {
          setSuccessMsg('Welcome back! Logging you in...');
          setTimeout(() => router.push('/'), 250);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 2. Handle Register New Account
  // =========================================================================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const rawPhone = phone.replace(/\D/g, '');
    if (!rawPhone || rawPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg('Please enter a valid email address and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const fullPhone = `${countryCode}${rawPhone}`;
      const newUser = await registerUser(name.trim(), email.trim(), password, fullPhone);

      if (isSuperAdminEmail(newUser?.email)) {
        setSuccessMsg('Super Admin account created! Opening Super Admin Console...');
        setTimeout(() => router.push('/super-admin'), 250);
      } else {
        setSuccessMsg('Account created successfully! Welcome to Binary Vidya...');
        setTimeout(() => router.push('/'), 250);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. An account may already exist with this email/phone.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 3. Handle Super Admin 2FA OTP
  // =========================================================================
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

  const handleSuperAdminOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 4) {
      setErrorMsg('Please enter the complete 4-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      const verified = await verifySuperAdminOtp(email, fullOtp);
      if (verified) {
        if (isSuperAdminEmail(verified.email)) {
          setSuccessMsg('Super Admin 2FA Verified! Opening Super Admin Console...');
          setTimeout(() => router.push('/super-admin'), 250);
        } else {
          setSuccessMsg('Admin 2FA Verified! Opening Admin Console...');
          setTimeout(() => router.push('/admin'), 250);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP code. Please try again.');
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

  return (
    <main className={styles.pageContainer}>
      <div className={styles.glowOrbTop} />

      <div className={styles.authCard}>
        {/* Brand Header with Official Company Logo */}
        <div className={styles.brandHeader}>
          <Link href="/" className={styles.logoLink} title="Binary Vidya Home">
            <img
              src="/images/binary-vidya-logo.png"
              alt="Binary Vidya"
              className={styles.brandLogoImg}
            />
          </Link>

          {mode !== 'superadmin-otp' && (
            <>
              <h1 className={styles.cardTitle}>
                {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
              </h1>
              <p className={styles.cardSubtitle}>
                {mode === 'signin'
                  ? 'Sign in to access your courses, internship, and credentials.'
                  : 'Start your software engineering journey with Binary Vidya.'}
              </p>
            </>
          )}
        </div>

        {/* Segmented Tab Switcher (Only in signin/register mode) */}
        {mode !== 'superadmin-otp' && (
          <div className={styles.tabSwitcher}>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`${styles.tabBtn} ${mode === 'signin' ? styles.tabBtnActive : ''}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`${styles.tabBtn} ${mode === 'register' ? styles.tabBtnActive : ''}`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Feedback Alert Banners */}
        {errorMsg && (
          <div className={styles.errorAlert}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className={styles.successAlert}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ===================================================================
            MODE 1: SIGN IN
            =================================================================== */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className={styles.form}>
            {/* Email / Identifier */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address or Mobile</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com or 9876543210"
                  className={styles.input}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <div className={styles.label}>
                <span>Password</span>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className={styles.forgotBtn}
                >
                  Forgot Password?
                </button>
              </div>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${styles.input} ${styles.inputPassword}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeToggleBtn}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className={styles.optionsRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={16} />
            </button>

            {/* Social Divider */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or continue with</span>
              <div className={styles.dividerLine} />
            </div>

            {/* Google Login */}
            <GoogleLoginBtn
              onSuccess={(authUser) => {
                if (isSuperAdminEmail(authUser?.email)) {
                  router.push('/super-admin');
                } else {
                  router.push('/');
                }
              }}
              onError={(err) => setErrorMsg(err)}
            />

            {/* Switch to Register */}
            <div className={styles.switchRow}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={styles.switchBtn}
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* ===================================================================
            MODE 2: CREATE ACCOUNT (REGISTER)
            =================================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className={styles.form}>
            {/* Full Name */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <div className={styles.inputWrapper}>
                <UserIcon size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className={styles.input}
                  autoFocus
                />
              </div>
            </div>

            {/* Email Address */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={styles.input}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Mobile Number (WhatsApp updates)</label>
              <div className={styles.phoneRow}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className={styles.countryCodeSelect}
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                </select>
                <div className={styles.inputWrapper} style={{ flex: 1 }}>
                  <Phone size={18} className={styles.inputIcon} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Create Password</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`${styles.input} ${styles.inputPassword}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeToggleBtn}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Creating Account...' : 'Create Free Account'} <ArrowRight size={16} />
            </button>

            {/* Social Divider */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or sign up with</span>
              <div className={styles.dividerLine} />
            </div>

            {/* Google Register */}
            <GoogleLoginBtn
              onSuccess={() => router.push('/')}
              onError={(err) => setErrorMsg(err)}
            />

            {/* Switch to Sign In */}
            <div className={styles.switchRow}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={styles.switchBtn}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ===================================================================
            MODE 3: SUPER ADMIN 2FA OTP VERIFICATION
            =================================================================== */}
        {mode === 'superadmin-otp' && (
          <div className={styles.otpCard}>
            <div className={styles.otpShieldWrap}>
              <ShieldCheck size={32} color="#2563eb" />
            </div>

            <h2 className={styles.otpTitle}>Two-Factor Authentication</h2>
            <p className={styles.otpSubtitle}>
              Please enter the 4-digit authorization code sent to{' '}
              <strong style={{ color: '#0f172a' }}>{maskedEmail || email}</strong>
            </p>

            <form onSubmit={handleSuperAdminOtpSubmit}>
              <div className={styles.otpInputsGroup}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputsRef.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={styles.otpInputBox}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <div className={styles.resendRow}>
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResendSuperAdminOtp}
                  className={styles.resendBtn}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Verifying...' : 'Verify & Enter Console'} <ArrowRight size={16} />
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={styles.backToSignInBtn}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Page Footer Navigation */}
      <div className={styles.pageFooter}>
        <Link href="/" className={styles.footerLink}>
          &larr; Back to Home
        </Link>
        <span>•</span>
        <Link href="/verify-certificate" className={styles.footerLink}>
          Verify Certificate
        </Link>
        <span>•</span>
        <Link href="/training-and-internship" className={styles.footerLink}>
          Training &amp; Internships
        </Link>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={email}
      />
    </main>
  );
}
