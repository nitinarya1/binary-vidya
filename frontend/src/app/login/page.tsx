'use client';

import React, { useState } from 'react';
import styles from './login.module.css';
import { useAuth } from '../../context/AuthContext';
import { GoogleLoginBtn } from '../../components/GoogleLoginBtn';
import { ForgotPasswordModal } from '../../components/ForgotPasswordModal';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type AuthStep = 'email' | 'password' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { login, registerUser, logout } = useAuth();

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
      const loggedInUser = await login(email, password);

      if (loggedInUser?.role === 'admin') {
        setSuccessMsg('Welcome, Administrator! Opening Admin Console...');
        setTimeout(() => router.push('/admin'), 600);
      } else {
        setSuccessMsg('Welcome back! Logging you in...');
        setTimeout(() => router.push('/'), 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid password. Please check your credentials or reset password.');
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

      if (newUser?.role === 'admin') {
        setSuccessMsg('Administrator account created! Opening Admin Console...');
        setTimeout(() => router.push('/admin'), 600);
      } else {
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => router.push('/'), 600);
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
                : step === 'password'
                ? `Welcome back${verifiedUser?.name ? `, ${verifiedUser.name.split(' ')[0]}` : ''}`
                : 'Sign in to Binary Vidya'}
            </h2>
            <p className={styles.formSubtitle}>
              {step === 'register'
                ? 'Start your journey with hands-on technical excellence'
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

          {/* Divider */}
          <div className={styles.divider}>
            <span>Or continue with</span>
          </div>

          {/* Google Login Component */}
          <GoogleLoginBtn
            onSuccess={(googleUser) => {
              if (googleUser?.role === 'admin') {
                setSuccessMsg('Google verification confirmed (Admin)! Redirecting to Admin Console...');
                setTimeout(() => router.push('/admin'), 600);
              } else {
                setSuccessMsg('Google sign-in successful! Redirecting...');
                setTimeout(() => router.push('/'), 600);
              }
            }}
            onError={(msg) => setErrorMsg(msg)}
          />

          {/* Bottom Link: Don't have an account? Create one / Already have an account? Sign in */}
          <div className={styles.footerSwitchRow}>
            {step === 'register' ? (
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
