'use client';

import React, { useState } from 'react';
import { Award, ShieldCheck, CheckCircle2, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface ConfirmNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName: string;
  courseTitle: string;
  onConfirm: (confirmedName: string) => Promise<void> | void;
  loading?: boolean;
}

export const ConfirmNameModal: React.FC<ConfirmNameModalProps> = ({
  isOpen,
  onClose,
  defaultName,
  courseTitle,
  onConfirm,
  loading = false,
}) => {
  const [name, setName] = useState(defaultName || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full legal name');
      return;
    }
    setError(null);
    onConfirm(name.trim());
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
          animation: 'confirmScale 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div
          style={{
            padding: '24px 28px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Award size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Verified Credential Issuance
                </span>
                <Sparkles size={13} color="#fbbf24" />
              </div>
              <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Confirm Your Legal Name
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} style={{ padding: '26px 28px' }}>
          <div
            style={{
              padding: '14px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#475569',
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: '#0f172a', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
              Course Specialization:
            </span>
            <span style={{ color: '#2563eb', fontWeight: 800 }}>{courseTitle}</span>
          </div>

          <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#64748b', lineHeight: 1.6 }}>
            Please confirm your full legal name exactly as you would like it to appear on your official, shareable, and verifiable Binary Vidya certificate.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="student-cert-name"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '6px',
              }}
            >
              Full Legal Name (For Certificate)
            </label>
            <input
              id="student-cert-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Nitin Kumar Arya"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: error ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              autoFocus
            />
            {error && (
              <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                {error}
              </span>
            )}
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '6px' }}>
              ℹ️ Pre-filled from your profile. You can edit spelling or format now.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  Confirm &amp; Generate Certificate <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
