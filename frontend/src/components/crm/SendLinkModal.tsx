'use client';

import React, { useState } from 'react';
import { X, Link, Copy, CheckCircle, Tag } from 'lucide-react';

interface SendLinkModalProps {
  lead: { _id: string; name: string; phone: string; email?: string } | null;
  onClose: () => void;
}

const COURSES = [
  { value: 'frontend-developer-training-internship', label: 'Frontend Training & Internship (₹2,400)' },
  { value: 'full-stack-mern-nextjs-15-mastery', label: 'Full Stack MERN & Next.js 15 (₹4,999)' },
  { value: 'cloud-devops-docker-kubernetes-engineering', label: 'Cloud DevOps & Kubernetes (₹3,999)' },
  { value: 'generative-ai-llm-systems-engineering', label: 'Generative AI & LLM Engineering (₹6,499)' },
];

export const SendLinkModal: React.FC<SendLinkModalProps> = ({ lead, onClose }) => {
  const [courseSlug, setCourseSlug] = useState('frontend-developer-training-internship');
  const [couponCode, setCouponCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!lead) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setGeneratedUrl('');

    try {
      const res = await fetch(`/api/crm/leads/${lead._id}/send-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ couponCode: couponCode.trim().toUpperCase() || undefined, courseSlug, message }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedUrl(data.checkoutUrl);
      } else {
        setError(data.message || 'Failed to generate link.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
      zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Send Payment Link</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{lead.name} · {lead.phone}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Course */}
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Course / Program
          </label>
          <select
            value={courseSlug}
            onChange={(e) => setCourseSlug(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
              fontSize: '13px', color: '#0f172a', background: '#fff', cursor: 'pointer',
              outline: 'none', boxSizing: 'border-box', marginBottom: '16px',
            }}
          >
            {COURSES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Coupon */}
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            <Tag size={11} style={{ display: 'inline', marginRight: '4px' }} />
            Coupon Code (optional)
          </label>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter your agent coupon code"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
              fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', color: '#0f172a',
              outline: 'none', boxSizing: 'border-box', marginBottom: '16px',
            }}
          />

          {/* Note */}
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Note (for log)
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Interested in frontend batch"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
              fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', marginBottom: '20px',
            }}
          />

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Generated URL */}
          {generatedUrl && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
                ✓ Checkout Link Ready
              </div>
              <div style={{ fontSize: '11px', color: '#047857', wordBreak: 'break-all', marginBottom: '10px' }}>
                {generatedUrl}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                  background: copied ? '#059669' : '#2563eb', color: '#fff', border: 'none',
                  borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
              </button>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>Cancel</button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                flex: 2, padding: '11px', borderRadius: '8px', border: 'none',
                background: '#2563eb', color: '#fff', fontSize: '13px', fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
              }}
            >
              <Link size={15} />
              {loading ? 'Generating...' : 'Generate Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
