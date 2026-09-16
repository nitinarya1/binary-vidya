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
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const { login, registerUser, user } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Modal States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      const rawDigits = phone.replace(/\D/g, '');
      if (!rawDigits || rawDigits.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    try {
      setLoading(true);
      if (isRegister) {
        const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;
        const newUser = await registerUser(name, email, password, fullPhone);
        if (newUser?.role === 'admin') {
          setSuccessMsg('Administrator account created! Redirecting to Admin Portal...');
          setTimeout(() => {
            router.push('/admin');
          }, 600);
        } else {
          setSuccessMsg('Account created successfully! Redirecting...');
          setTimeout(() => {
            router.push('/');
          }, 600);
        }
      } else {
        const loggedInUser = await login(email, password);
        if (loggedInUser?.role === 'admin') {
          setSuccessMsg('Welcome, Administrator! Redirecting to Admin Portal...');
          setTimeout(() => {
            router.push('/admin');
          }, 600);
        } else {
          setSuccessMsg('Welcome back! Logging you in...');
          setTimeout(() => {
            router.push('/');
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
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
          {/* Tab Switcher */}
          <div className={styles.tabSwitcher}>
            <button
              type="button"
              id="tab-sign-in"
              className={`${styles.tabButton} ${!isRegister ? styles.tabButtonActive : ''}`}
              onClick={() => {
                setIsRegister(false);
                setErrorMsg(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              id="tab-create-account"
              className={`${styles.tabButton} ${isRegister ? styles.tabButtonActive : ''}`}
              onClick={() => {
                setIsRegister(true);
                setErrorMsg(null);
              }}
            >
              Create Account
            </button>
          </div>

          {/* Form Header */}
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p className={styles.formSubtitle}>
              {isRegister
                ? 'Start your journey with hands-on technical excellence'
                : 'Enter your credentials to access your courses and dashboard'}
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

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} id="auth-form">
            {isRegister && (
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
                    required={isRegister}
                    className={styles.inputField}
                  />
                </div>
              </div>
            )}

            {isRegister && (
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
                      required={isRegister}
                      className={styles.inputField}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel} htmlFor="auth-email">
                {isRegister ? 'Email Address' : 'Email or Mobile Number'}
              </label>
              <div className={styles.inputFieldWrapper}>
                <Mail size={18} color="#94a3b8" />
                <input
                  type={isRegister ? 'email' : 'text'}
                  id="auth-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isRegister ? 'learner@binaryvidya.edu' : 'learner@binaryvidya.edu or +91 98765 43210'}
                  required
                  className={styles.inputField}
                />
              </div>
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

            {!isRegister && (
              <div className={styles.rowBetween}>
                <label className={styles.rememberMe}>
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me for 30 days</span>
                </label>
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={() => setIsForgotModalOpen(true)}
                  className={styles.forgotPassLink}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              className={styles.submitBtn}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  {isRegister ? 'Create Free Account' : 'Sign In to Account'}{' '}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span>Or continue with</span>
          </div>

          {/* Google Login Component */}
          <GoogleLoginBtn
            onSuccess={(googleUser) => {
              if (googleUser?.role === 'admin') {
                setSuccessMsg('Google verification confirmed (Admin)! Redirecting to Admin Portal...');
                setTimeout(() => router.push('/admin'), 600);
              } else {
                setSuccessMsg('Google sign-in successful! Redirecting...');
                setTimeout(() => router.push('/'), 600);
              }
            }}
            onError={(msg) => setErrorMsg(msg)}
          />

          {/* Role-Based Authentication Info */}
          <div
            style={{
              marginTop: '20px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            <ShieldCheck size={14} color="#2563eb" />
            <span>Unified Portal: Administrators automatically route to the Admin Dashboard upon sign-in.</span>
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
