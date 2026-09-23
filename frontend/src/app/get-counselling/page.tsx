'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  User,
  GraduationCap,
  Building2,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Clock,
  Compass,
  Star,
  Award
} from 'lucide-react';

const COURSE_INTERESTS = [
  'Full Stack Web Development (MERN)',
  'Frontend Mastery (React, Next.js, TS)',
  'Cloud Computing & DevOps',
  'Generative AI, LLMs & Prompt Engineering',
  'Data Science & Analytics',
  'Backend Architecture & System Design',
  'DSA & Placement Preparation',
  'General Career Guidance / Not Decided Yet'
];

const STUDY_YEARS = [
  '1st Year (Freshman)',
  '2nd Year (Sophomore)',
  '3rd Year (Pre-final)',
  '4th / Final Year',
  'Recent Graduate (Looking for Jobs)',
  'Working Professional / Career Switcher'
];

const BRANCHES = [
  'Computer Science & Engg (CSE)',
  'Information Technology (IT / AI & DS)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics (EEE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'BCA / MCA',
  'B.Sc / M.Sc (IT / CS)',
  'Commerce / Management / MBA',
  'Other Stream'
];

export default function GetCounsellingPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    interest: '',
    collegeName: '',
    year: '',
    branch: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = formData.phone.trim();
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!formData.interest) {
      setError('Please select your area of interest.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim() || undefined,
          phone: cleanPhone,
          email: formData.email.trim(),
          course: formData.interest,
          interest: formData.interest,
          collegeName: formData.collegeName.trim() || undefined,
          year: formData.year || undefined,
          branch: formData.branch || undefined,
          source: 'counselling_landing_page',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f6fe',
      color: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: "'Plus Jakarta Sans', 'Outfit', -apple-system, sans-serif",
    }}>
      {/* Top Header with BOTH Company Logos */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #dbeafe',
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.04)',
      }}>
        <div style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '0 20px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo Brand: 3D Icon + Wordmark */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
          >
            {/* Logo 1: 3D Icon */}
            <div style={{
              width: '42px',
              height: '42px',
              position: 'relative',
              filter: 'drop-shadow(0 3px 8px rgba(37, 99, 235, 0.25))',
            }}>
              <Image
                src="/images/binary-vidya-icon.png"
                alt="Binary Vidya Icon"
                width={42}
                height={42}
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>

            {/* Logo 2: Wordmark */}
            <Image
              src="/images/binary-vidya-wordmark.png"
              alt="Binary Vidya"
              width={145}
              height={32}
              style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
              priority
            />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="hide-mobile" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '99px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                display: 'inline-block',
                animation: 'pulse 2s infinite',
              }} />
              Admissions Open 2025-26
            </span>
            <Link
              href="/"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#2563eb',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#eff6ff',
                border: '1px solid #dbeafe',
              }}
            >
              Back to Home →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px 20px 60px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          {!submitted ? (
            <div className="counselling-grid">
              {/* Left Column: Catchy Value Proposition & Benefits */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {/* Pill Tag */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: '99px',
                  width: 'fit-content',
                  marginBottom: '18px',
                  letterSpacing: '0.03em',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)',
                }}>
                  <Sparkles size={14} color="#2563eb" />
                  <span>1-ON-1 FREE CAREER COUNSELLING</span>
                </div>

                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.25,
                  margin: '0 0 16px',
                  letterSpacing: '-0.02em',
                }}>
                  Build Your Dream Tech Career With{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Binary Vidya Mentors
                  </span>
                </h1>

                <p style={{
                  fontSize: '15px',
                  color: '#475569',
                  lineHeight: 1.6,
                  margin: '0 0 28px',
                }}>
                  Confused between Full Stack MERN, GenAI, or Cloud DevOps? Talk directly to industry practitioners who have mentored thousands of engineering students into top product jobs.
                </p>

                {/* 3 Value Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    backgroundColor: '#ffffff',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    border: '1px solid #dbeafe',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.04)',
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Compass size={20} color="#2563eb" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px' }}>
                        Custom Curriculum & Career Path
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                        Tailored roadmap matching your college branch, graduation year, and placement targets.
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    backgroundColor: '#ffffff',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    border: '1px solid #dbeafe',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.04)',
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#eff6ff',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Award size={20} color="#0284c7" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px' }}>
                        Real Industry Insights
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                        Understand what high-paying companies test for in tech interviews and system design.
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    backgroundColor: '#ffffff',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    border: '1px solid #dbeafe',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.04)',
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#f0fdf4',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Clock size={20} color="#059669" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 3px' }}>
                        Priority 24-Hour Callback
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                        Speak with a senior academic advisor at your convenient slot.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Proof Bar */}
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', color: '#f59e0b', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>4.9/5 Rating</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>
                    5,000+ Students Mentored
                  </div>
                </div>
              </div>

              {/* Right Column: Catchy Form Card in Light Blue & White */}
              <div>
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  boxShadow: '0 20px 45px -10px rgba(37, 99, 235, 0.12), 0 8px 20px -6px rgba(0, 0, 0, 0.04)',
                  border: '1px solid #bfdbfe',
                  padding: '32px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Top Decorative Blue Gradient Line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: 'linear-gradient(90deg, #2563eb 0%, #0284c7 50%, #38bdf8 100%)',
                  }} />

                  <div style={{ marginBottom: '22px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                      Book Free 1-on-1 Counselling
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                      No payment or commitment required. 100% free expert advice.
                    </p>
                  </div>

                  {error && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Row 1: Name & Phone */}
                    <div className="form-two-cols">
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                          Full Name
                        </label>
                        <div style={{ position: 'relative' }}>
                          <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Rahul Sharma"
                            className="counselling-input"
                            style={{
                              width: '100%',
                              padding: '11px 14px 11px 38px',
                              borderRadius: '12px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                              fontSize: '13px',
                              fontWeight: 500,
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'all 0.2s ease',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                          Phone Number <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="e.g. 9876543210"
                            maxLength={15}
                            className="counselling-input"
                            style={{
                              width: '100%',
                              padding: '11px 14px 11px 38px',
                              borderRadius: '12px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                              fontSize: '13px',
                              fontWeight: 600,
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'all 0.2s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Email & Course Interest */}
                    <div className="form-two-cols">
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                          Email Address <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="rahul@gmail.com"
                            className="counselling-input"
                            style={{
                              width: '100%',
                              padding: '11px 14px 11px 38px',
                              borderRadius: '12px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                              fontSize: '13px',
                              fontWeight: 500,
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'all 0.2s ease',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                          Interested Domain <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <BookOpen size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <select
                            name="interest"
                            required
                            value={formData.interest}
                            onChange={handleChange}
                            className="counselling-input"
                            style={{
                              width: '100%',
                              padding: '11px 14px 11px 38px',
                              borderRadius: '12px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                              fontSize: '13px',
                              fontWeight: 500,
                              outline: 'none',
                              boxSizing: 'border-box',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <option value="">Select your area of interest...</option>
                            {COURSE_INTERESTS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: College Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                        College / University Name
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Building2 size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          name="collegeName"
                          value={formData.collegeName}
                          onChange={handleChange}
                          placeholder="e.g. DTU, VIT, AKTU, SRM, Mumbai University..."
                          className="counselling-input"
                          style={{
                            width: '100%',
                            padding: '11px 14px 11px 38px',
                            borderRadius: '12px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#f8fafc',
                            color: '#0f172a',
                            fontSize: '13px',
                            fontWeight: 500,
                            outline: 'none',
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Row 4: Year of Study & Branch */}
                    <div className="form-two-cols">
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                          Year of Study
                        </label>
                        <div style={{ position: 'relative' }}>
                          <GraduationCap size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <select
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className="counselling-input"
                            style={{
                              width: '100%',
                              padding: '11px 14px 11px 38px',
                              borderRadius: '12px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                              fontSize: '13px',
                              fontWeight: 500,
                              outline: 'none',
                              boxSizing: 'border-box',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <option value="">Select your year...</option>
                            {STUDY_YEARS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                          Branch / Stream
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Compass size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <select
                            name="branch"
                            value={formData.branch}
                            onChange={handleChange}
                            className="counselling-input"
                            style={{
                              width: '100%',
                              padding: '11px 14px 11px 38px',
                              borderRadius: '12px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                              fontSize: '13px',
                              fontWeight: 500,
                              outline: 'none',
                              boxSizing: 'border-box',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <option value="">Select your branch...</option>
                            {BRANCHES.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div style={{ paddingTop: '8px' }}>
                      <button
                        type="submit"
                        disabled={loading}
                        className="submit-counselling-btn"
                        style={{
                          width: '100%',
                          padding: '14px 20px',
                          borderRadius: '14px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 800,
                          cursor: loading ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 8px 22px -4px rgba(37, 99, 235, 0.4)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {loading ? (
                          <>
                            <span style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderTop: '2px solid #ffffff',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }} />
                            <span>Scheduling Your Session...</span>
                          </>
                        ) : (
                          <>
                            <span>Get Free Career Counselling</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#64748b',
                      paddingTop: '4px',
                    }}>
                      <ShieldCheck size={14} color="#059669" />
                      <span>Your personal information is 100% confidential. No spam calls.</span>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Success State - Light Mode Clean Experience */
            <div style={{
              maxWidth: '560px',
              margin: '0 auto',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '40px 32px',
              border: '1px solid #bfdbfe',
              boxShadow: '0 20px 45px -10px rgba(37, 99, 235, 0.1)',
              textAlign: 'center',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                border: '1px solid #bfdbfe',
              }}>
                <CheckCircle size={36} color="#2563eb" />
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '99px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '12px',
              }}>
                <span>Counselling Request Confirmed</span>
              </div>

              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
                You're All Set! 🎉
              </h2>

              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: '0 0 24px' }}>
                Thank you, <strong style={{ color: '#0f172a' }}>{formData.name || 'future engineer'}</strong>. Our senior academic counsellor is reviewing your profile and will call you at <strong style={{ color: '#2563eb' }}>{formData.phone}</strong> within 24 hours.
              </p>

              {/* What happens next box */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                marginBottom: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  What happens next?
                </h4>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}>1</span>
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                    <strong style={{ color: '#0f172a' }}>Profile Evaluation:</strong> We analyze your branch ({formData.branch || 'stream'}) and current year ({formData.year || 'year'}) to tailor the roadmap.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}>2</span>
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                    <strong style={{ color: '#0f172a' }}>1-on-1 Strategy Call:</strong> We'll call you to answer all your doubts regarding course fees, syllabus, and placements.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}>3</span>
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                    <strong style={{ color: '#0f172a' }}>Curriculum Access:</strong> Free starter study materials sent directly to <span style={{ color: '#0f172a', fontWeight: 600 }}>{formData.email}</span>.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                <Link
                  href="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '13px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  Explore All Programs
                  <ArrowRight size={16} />
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      phone: '',
                      email: '',
                      interest: '',
                      collegeName: '',
                      year: '',
                      branch: '',
                    });
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Submit Another Query
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer with BOTH Company Logos */}
      <footer style={{
        width: '100%',
        padding: '24px 20px',
        borderTop: '1px solid #dbeafe',
        backgroundColor: '#ffffff',
      }}>
        <div style={{
          maxWidth: '1120px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Logo 1: 3D Icon */}
            <div style={{ width: '28px', height: '28px', position: 'relative' }}>
              <Image
                src="/images/binary-vidya-icon.png"
                alt="Binary Vidya Icon"
                width={28}
                height={28}
                style={{ objectFit: 'contain' }}
              />
            </div>
            {/* Logo 2: Wordmark */}
            <Image
              src="/images/binary-vidya-wordmark.png"
              alt="Binary Vidya"
              width={105}
              height={22}
              style={{ height: '20px', width: 'auto', objectFit: 'contain' }}
            />
            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>
              © {new Date().getFullYear()} Binary Vidya. All rights reserved.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '12px' }}>
            <Link href="/" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Courses</Link>
            <Link href="/about" style={{ color: '#64748b', textDecoration: 'none' }}>About Us</Link>
            <Link href="/privacy-policy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
          </div>
        </div>
      </footer>

      {/* Pure Vanilla CSS Styles for Responsive Grid, Hover Effects, and Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .counselling-grid {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 48px;
          align-items: start;
        }

        .form-two-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .counselling-input:focus {
          border-color: #2563eb !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
        }

        .submit-counselling-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px -4px rgba(37, 99, 235, 0.5) !important;
          background: linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%) !important;
        }

        .submit-counselling-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        @media (max-width: 900px) {
          .counselling-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
        }

        @media (max-width: 600px) {
          .form-two-cols {
            grid-template-columns: 1fr !important;
          }
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
