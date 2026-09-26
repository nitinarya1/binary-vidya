'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Compass,
  Calendar,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface DomainOption {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

const DEFAULT_DOMAINS: string[] = [
  'Full Stack Development',
  'Data Science',
  'Data Analytics',
  'App Development',
  'Cyber Security',
  'Cloud / DevOps',
  'AI / ML',
  'Web Development',
  'Generative AI & LLM',
  'Prompt Engineering',
];

const EDUCATION_OPTIONS = [
  'B.Tech / B.E.',
  'BCA',
  'MCA',
  'B.Sc (CS / IT / Science)',
  'M.Sc (CS / IT)',
  'M.Tech / M.E.',
  'Diploma in Engineering',
  'Commerce / B.Com / BBA',
  'Other / Self-Taught',
];

const CURRENT_YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  'Final Year',
  'Just Graduated',
  'Working Professional',
];

export default function GetCounsellingPage() {
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    collegeName: '',
    education: '',
    branch: '',
    year: '',
    preferredDomain: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Fetch dynamic domains from database (CRUD by Lead Gen Team & CRM Admin)
  useEffect(() => {
    async function loadDomains() {
      try {
        const res = await fetch('/api/counselling/domains');
        const data = await res.json();
        if (data.success && Array.isArray(data.domains) && data.domains.length > 0) {
          setDomains(data.domains);
        } else {
          setDomains(DEFAULT_DOMAINS.map((name, i) => ({ id: `default-${i}`, name })));
        }
      } catch (err) {
        console.error('Failed to load dynamic domains, using defaults:', err);
        setDomains(DEFAULT_DOMAINS.map((name, i) => ({ id: `default-${i}`, name })));
      } finally {
        setDomainsLoading(false);
      }
    }
    loadDomains();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!formData.collegeName.trim()) {
      setError('Please enter your college name or university.');
      return;
    }

    if (!formData.education) {
      setError('Please select your education qualification.');
      return;
    }

    if (!formData.branch.trim()) {
      setError('Please enter your branch or specialization.');
      return;
    }

    if (!formData.year) {
      setError('Please select your current year of study / status.');
      return;
    }

    if (!formData.preferredDomain) {
      setError('Please select your preferred domain.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: cleanPhone,
          email: formData.email.trim(),
          collegeName: formData.collegeName.trim(),
          education: formData.education,
          branch: formData.branch.trim(),
          year: formData.year,
          preferredDomain: formData.preferredDomain,
          course: formData.preferredDomain,
          source: 'counselling_page',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Submission failed. Please try again.');
      }
    } catch {
      setError('Network connection error. Please try again in a moment.');
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
      fontFamily: "'Plus Jakarta Sans', 'Outfit', -apple-system, sans-serif",
      overflowX: 'hidden',
      maxWidth: '100vw',
      width: '100%',
    }}>
      {/* Sleek Top Navigation */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #dbeafe',
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.04)',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 16px',
          height: '64px',
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
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <Image
              src="/images/binary-vidya-icon.png"
              alt="Binary Vidya Icon"
              width={36}
              height={36}
              style={{ objectFit: 'contain' }}
              priority
            />
            <Image
              src="/images/binary-vidya-wordmark.png"
              alt="Binary Vidya"
              width={130}
              height={28}
              style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
              priority
            />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              padding: '5px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              <ShieldCheck size={14} color="#059669" />
              100% Free Session
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px 48px',
        boxSizing: 'border-box',
        width: '100%',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '680px',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>

          {submitted ? (
            /* Catchy Success State */
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '40px 24px',
              textAlign: 'center',
              boxShadow: '0 20px 45px -10px rgba(37, 99, 235, 0.12), 0 0 0 1px #dbeafe',
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                border: '2px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#059669',
              }}>
                <CheckCircle2 size={42} strokeWidth={2.5} />
              </div>

              <h2 style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '10px',
                letterSpacing: '-0.02em',
              }}>
                Counselling Session Booked!
              </h2>

              <p style={{
                fontSize: '15px',
                color: '#475569',
                lineHeight: 1.6,
                maxWidth: '480px',
                margin: '0 auto 24px',
              }}>
                Hi <strong>{formData.name}</strong>, our senior tech counsellor has received your details for <strong>{formData.preferredDomain}</strong> and will call/WhatsApp you within <strong>24 hours</strong>.
              </p>

              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                padding: '16px 20px',
                border: '1px solid #e2e8f0',
                maxWidth: '440px',
                margin: '0 auto 28px',
                textAlign: 'left',
                fontSize: '13px',
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div><strong>📱 Contact:</strong> +91 {formData.phone}</div>
                <div><strong>🎓 Education:</strong> {formData.education} ({formData.branch})</div>
                <div><strong>🏛️ College:</strong> {formData.collegeName}</div>
                <div><strong>🎯 Preferred Domain:</strong> {formData.preferredDomain}</div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '14px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  Explore Home Page
                  <ArrowRight size={16} />
                </Link>

                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      collegeName: '',
                      education: '',
                      branch: '',
                      year: '',
                      preferredDomain: '',
                    });
                  }}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Book Another Session
                </button>
              </div>
            </div>
          ) : (
            /* Clean, Catchy, Responsive Form Card */
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '32px 24px',
              boxShadow: '0 20px 45px -10px rgba(37, 99, 235, 0.12), 0 0 0 1px #dbeafe',
              boxSizing: 'border-box',
              width: '100%',
            }}>
              {/* Header inside Card */}
              <div style={{ textAlign: 'center', marginBottom: '26px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '12px',
                }}>
                  <Sparkles size={13} color="#2563eb" />
                  Free 1-on-1 Career Counselling
                </div>

                <h1 style={{
                  fontSize: 'clamp(22px, 5.5vw, 30px)',
                  fontWeight: 900,
                  color: '#0f172a',
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                  marginBottom: '8px',
                  wordBreak: 'break-word',
                }}>
                  Book Your Career Guidance Session
                </h1>

                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  lineHeight: 1.5,
                  maxWidth: '520px',
                  margin: '0 auto',
                }}>
                  Confused about career options, internships, or switching tech domains? Get personalised advice from senior engineers.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <HelpCircle size={16} />
                  {error}
                </div>
              )}

              {/* Form Grid */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* 1. Full Name & Email (2 Cols on Desktop, 1 Col on Mobile) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '14px',
                  width: '100%',
                }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Rahul Sharma"
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          borderRadius: '12px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          backgroundColor: '#f8fafc',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="rahul@example.com"
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          borderRadius: '12px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          backgroundColor: '#f8fafc',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Phone & College Name */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '14px',
                  width: '100%',
                }}>
                  {/* Phone */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Mobile / WhatsApp Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#475569',
                        fontSize: '13px',
                        fontWeight: 700,
                        pointerEvents: 'none',
                      }}>
                        <Phone size={14} color="#94a3b8" />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="98765 43210"
                        maxLength={10}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 64px',
                          borderRadius: '12px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          backgroundColor: '#f8fafc',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                      />
                    </div>
                  </div>

                  {/* College Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      College / University Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        type="text"
                        name="collegeName"
                        value={formData.collegeName}
                        onChange={handleChange}
                        placeholder="e.g. Delhi Technological University"
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          borderRadius: '12px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          backgroundColor: '#f8fafc',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Education & Branch / Specialization */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '14px',
                  width: '100%',
                }}>
                  {/* Education */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Education <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <GraduationCap size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <select
                        name="education"
                        value={formData.education}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          borderRadius: '12px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          color: formData.education ? '#0f172a' : '#94a3b8',
                          backgroundColor: '#f8fafc',
                          boxSizing: 'border-box',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                      >
                        <option value="">Select Education...</option>
                        {EDUCATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} style={{ color: '#0f172a' }}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Branch / Specialization */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Branch / Specialization <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Compass size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        type="text"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        placeholder="e.g. Computer Science, AI, ECE..."
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          borderRadius: '12px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          color: '#0f172a',
                          backgroundColor: '#f8fafc',
                          boxSizing: 'border-box',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Current Year & Preferred Domain */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '14px',
                  width: '100%',
                }}>
                  {/* Current Year */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Current Year / Status <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          borderRadius: '12px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          color: formData.year ? '#0f172a' : '#94a3b8',
                          backgroundColor: '#f8fafc',
                          boxSizing: 'border-box',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                      >
                        <option value="">Select Year...</option>
                        {CURRENT_YEAR_OPTIONS.map((yr) => (
                          <option key={yr} value={yr} style={{ color: '#0f172a' }}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preferred Domain (Dynamically loaded & Managed) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Preferred Domain <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Sparkles size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <select
                        name="preferredDomain"
                        value={formData.preferredDomain}
                        onChange={handleChange}
                        required
                        disabled={domainsLoading}
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 40px',
                          borderRadius: '12px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '14px',
                          color: formData.preferredDomain ? '#0f172a' : '#94a3b8',
                          backgroundColor: '#f8fafc',
                          boxSizing: 'border-box',
                          outline: 'none',
                          cursor: domainsLoading ? 'wait' : 'pointer',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                      >
                        <option value="">
                          {domainsLoading ? 'Loading available domains...' : 'Select Preferred Domain...'}
                        </option>
                        {domains.map((dom) => (
                          <option key={dom.id || dom.name} value={dom.name} style={{ color: '#0f172a' }}>
                            {dom.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '14px',
                    backgroundColor: '#2563eb',
                    backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.8 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '2.5px solid rgba(255, 255, 255, 0.4)',
                        borderTopColor: '#ffffff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Booking Your Free Session...
                    </>
                  ) : (
                    <>
                      Book Free Career Counselling Session
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {/* Trust Footer Note */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  marginTop: '6px',
                  fontSize: '12px',
                  color: '#64748b',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={14} color="#059669" /> 100% Free & No Hidden Cost
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} color="#2563eb" /> Response within 24 Hours
                  </span>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* Global Spin Keyframe */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
