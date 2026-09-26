'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCrm } from '../../../context/CrmContext';
import { CrmSidebar } from '../../../components/crm/CrmSidebar';
import { UserPlus, CheckCircle, AlertCircle, ArrowRight, BookOpen, GraduationCap, Building2, User, Phone, Mail, Globe, ExternalLink } from 'lucide-react';

const DEFAULT_COURSES = [
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

const STUDY_YEARS = [
  '',
  '1st Year',
  '2nd Year',
  '3rd Year',
  'Final Year',
  'Just Graduated',
  'Working Professional',
];

interface FormData {
  name: string;
  phone: string;
  email: string;
  course: string;
  collegeName: string;
  year: string;
  branch: string;
}

export default function GenerateLeadPage() {
  const { crmUser, loading } = useCrm();
  const router = useRouter();

  const [courseList, setCourseList] = useState<string[]>(DEFAULT_COURSES);

  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    course: '',
    collegeName: '',
    year: '',
    branch: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !crmUser) router.replace('/sales/login');
  }, [loading, crmUser, router]);

  useEffect(() => {
    async function loadDomains() {
      try {
        const res = await fetch('/api/counselling/domains');
        const data = await res.json();
        if (data.success && Array.isArray(data.domains) && data.domains.length > 0) {
          setCourseList(data.domains.map((d: any) => d.name));
        }
      } catch {}
    }
    loadDomains();
  }, []);

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone number are required.');
      return;
    }
    if (form.phone.trim().replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          course: form.course || undefined,
          collegeName: form.collegeName.trim() || undefined,
          year: form.year || undefined,
          branch: form.branch.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Lead added successfully! It is now active in the calling queue.');
        setForm({ name: '', phone: '', email: '', course: '', collegeName: '', year: '', branch: '' });
      } else {
        setError(data.message || 'Failed to add lead.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading || !crmUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ color: '#2563eb', fontWeight: 600 }}>Loading...</div>
      </div>
    );
  }

  const fieldStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    fontSize: '13px',
    fontWeight: 500,
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    display: 'block' as const,
    fontSize: '11px',
    fontWeight: 700 as const,
    color: '#475569',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f1f6fe',
      fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif"
    }}>
      <CrmSidebar />

      <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '14px',
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Generate Lead
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Manually add a student inquiry or open the public counseling page
            </p>
          </div>

          <a
            href="/get-counselling"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
            }}
          >
            <Globe size={15} color="#2563eb" />
            <span>Lead Generation (Public)</span>
            <ExternalLink size={13} color="#60a5fa" />
          </a>
        </div>

        <div style={{ maxWidth: '640px' }}>
          {/* Form card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '30px',
            border: '1px solid #dbeafe',
            boxShadow: '0 10px 30px -5px rgba(37, 99, 235, 0.08)',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}>
                <UserPlus size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Manual Lead Creation
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                  Captured from offline campaigns, phone calls, or walk-ins
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder="e.g. Rahul Sharma"
                    className="lead-input"
                    style={fieldStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handleChange('phone')}
                    placeholder="e.g. 9876543210"
                    className="lead-input"
                    style={fieldStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder="rahul@example.com"
                    className="lead-input"
                    style={fieldStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Interested Domain</label>
                  <select
                    value={form.course}
                    onChange={handleChange('course')}
                    className="lead-input"
                    style={{ ...fieldStyle, cursor: 'pointer' }}
                  >
                    <option value="">Select course / domain...</option>
                    {courseList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>College / University Name</label>
                <input
                  type="text"
                  value={form.collegeName}
                  onChange={handleChange('collegeName')}
                  placeholder="e.g. DTU, VIT, AKTU, SRM..."
                  className="lead-input"
                  style={fieldStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Year of Study</label>
                  <select
                    value={form.year}
                    onChange={handleChange('year')}
                    className="lead-input"
                    style={{ ...fieldStyle, cursor: 'pointer' }}
                  >
                    <option value="">Select year...</option>
                    {STUDY_YEARS.filter(Boolean).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Branch / Stream</label>
                  <input
                    type="text"
                    value={form.branch}
                    onChange={handleChange('branch')}
                    placeholder="e.g. CSE, IT, ECE, Mechanical..."
                    className="lead-input"
                    style={fieldStyle}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '18px',
                }}>
                  <AlertCircle size={15} color="#dc2626" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#047857',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '18px',
                }}>
                  <CheckCircle size={15} color="#059669" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="lead-submit-btn"
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: submitting ? '#1d4ed8' : 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: submitting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                {submitting ? 'Registering Lead...' : <><span>Add Lead to Calling Queue</span><ArrowRight size={16} /></>}
              </button>
            </form>
          </div>
        </div>
      </main>

      <style>{`
        .lead-input:focus {
          border-color: #2563eb !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
        }
        .lead-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.45) !important;
        }
        .lead-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
