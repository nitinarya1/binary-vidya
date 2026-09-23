'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Percent,
  IndianRupee,
  Check,
  AlertCircle,
  Sparkles,
  Calendar,
  Layers,
  HelpCircle,
  RefreshCw,
  Gift,
} from 'lucide-react';

export interface CouponItem {
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  applicableTo: 'all' | 'courses' | 'training';
  isActive: boolean;
  description: string;
  validUntil?: string | null;
  usageCount?: number;
  maxUsageLimit?: number;
  createdAt?: string;
}

interface CouponAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponToEdit?: CouponItem | null;
  onSave: (couponData: Partial<CouponItem>) => Promise<void>;
}

export function CouponAdminModal({
  isOpen,
  onClose,
  couponToEdit,
  onSave,
}: CouponAdminModalProps) {
  const isEditing = Boolean(couponToEdit);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>(20);
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>(0);
  const [applicableTo, setApplicableTo] = useState<'all' | 'courses' | 'training'>('all');
  const [description, setDescription] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [maxUsageLimit, setMaxUsageLimit] = useState<number | ''>(0);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (couponToEdit) {
      setCode(couponToEdit.code || '');
      setDiscountType(couponToEdit.discountType || 'percentage');
      setDiscountValue(couponToEdit.discountValue ?? 20);
      setMinOrderAmount(couponToEdit.minOrderAmount ?? 0);
      setMaxDiscountAmount(couponToEdit.maxDiscountAmount ?? 0);
      setApplicableTo(couponToEdit.applicableTo || 'all');
      setDescription(couponToEdit.description || '');
      setValidUntil(couponToEdit.validUntil ? couponToEdit.validUntil.split('T')[0] : '');
      setMaxUsageLimit(couponToEdit.maxUsageLimit ?? 0);
      setIsActive(couponToEdit.isActive !== false);
    } else {
      setCode('');
      setDiscountType('percentage');
      setDiscountValue(20);
      setMinOrderAmount(0);
      setMaxDiscountAmount(0);
      setApplicableTo('all');
      setDescription('');
      setValidUntil('');
      setMaxUsageLimit(0);
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [couponToEdit, isOpen]);

  if (!isOpen) return null;

  // Live simulation numbers for preview
  const sampleAmount = applicableTo === 'training' ? 2400 : 4999;
  let simulatedSavings = 0;
  if (discountType === 'percentage') {
    const pct = typeof discountValue === 'number' ? discountValue : 0;
    simulatedSavings = Math.round((sampleAmount * pct) / 100);
    const maxCap = typeof maxDiscountAmount === 'number' ? maxDiscountAmount : 0;
    if (maxCap > 0 && simulatedSavings > maxCap) simulatedSavings = maxCap;
  } else {
    const fixedVal = typeof discountValue === 'number' ? discountValue : 0;
    simulatedSavings = Math.min(sampleAmount, fixedVal);
  }
  const simulatedFinal = Math.max(0, sampleAmount - simulatedSavings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode || cleanCode.length < 3) {
      setErrorMsg('Coupon code must be at least 3 alphanumeric characters (e.g., WELCOME20, FLAT500).');
      return;
    }

    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Discount value must be a valid positive number.');
      return;
    }

    if (discountType === 'percentage' && val > 100) {
      setErrorMsg('Percentage discount cannot exceed 100%.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        code: cleanCode,
        discountType,
        discountValue: val,
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: discountType === 'percentage' ? (Number(maxDiscountAmount) || 0) : 0,
        applicableTo,
        description: description.trim(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        maxUsageLimit: Number(maxUsageLimit) || 0,
        isActive,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
          fontFamily: 'inherit',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #1e293b, #0f172a)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              }}
            >
              <Tag size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {isEditing ? `Edit Coupon: ${couponToEdit?.code}` : 'Create New Discount Coupon'}
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Configure promo codes, percentage or money off, conditions, and program scope
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px' }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Code & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Coupon Promo Code <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE25, FLAT500"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Alphanumeric characters only. Auto-uppercased.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: isActive ? '1px solid #10b981' : '1px solid #64748b',
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                  color: isActive ? '#34d399' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#10b981' : '#64748b',
                  }}
                />
                <span>{isActive ? 'Active (Live)' : 'Inactive (Disabled)'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Discount Type Selector (Percent vs Money Off) */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
              Select Discount Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              {/* Percentage Toggle Card */}
              <div
                onClick={() => setDiscountType('percentage')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border:
                    discountType === 'percentage'
                      ? '2px solid #38bdf8'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor:
                    discountType === 'percentage'
                      ? 'rgba(56, 189, 248, 0.12)'
                      : 'rgba(30, 41, 59, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: discountType === 'percentage' ? '#0284c7' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Percent size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: discountType === 'percentage' ? '#38bdf8' : '#e2e8f0' }}>
                    Percentage Off (%)
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    e.g., 10%, 20%, 30% discount off total
                  </div>
                </div>
              </div>

              {/* Fixed Money Off Toggle Card */}
              <div
                onClick={() => setDiscountType('fixed')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border:
                    discountType === 'fixed'
                      ? '2px solid #10b981'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor:
                    discountType === 'fixed'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(30, 41, 59, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: discountType === 'fixed' ? '#059669' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <IndianRupee size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: discountType === 'fixed' ? '#34d399' : '#e2e8f0' }}>
                    Fixed Money Off (₹)
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    e.g., Flat ₹500, ₹1,000, ₹2,000 off total
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Value and Applicability */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                {discountType === 'percentage' ? 'Percentage Off (%)' : 'Discount Amount (₹)'}{' '}
                <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  max={discountType === 'percentage' ? '100' : '50000'}
                  step="1"
                  required
                  placeholder={discountType === 'percentage' ? '20' : '500'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '11px 36px 11px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    fontSize: '15px',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 800,
                    color: discountType === 'percentage' ? '#38bdf8' : '#34d399',
                    fontSize: '14px',
                  }}
                >
                  {discountType === 'percentage' ? '%' : '₹'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                {discountType === 'percentage' ? 'Must be between 1% and 100%' : 'Exact cash amount deducted from checkout'}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                Applicable Program Scope
              </label>
              <select
                value={applicableTo}
                onChange={(e: any) => setApplicableTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Programs (Courses &amp; Training)</option>
                <option value="courses">Courses Only (/courses/...)</option>
                <option value="training">Training &amp; Internship Only</option>
              </select>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Limits coupon usage to specific categories
              </span>
            </div>
          </div>

          {/* Section 4: Live Simulation Preview Banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px dashed rgba(56, 189, 248, 0.4)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                  Live Checkout Calculation Preview
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  On a sample ₹{sampleAmount.toLocaleString('en-IN')} tuition, student saves{' '}
                  <strong style={{ color: '#34d399' }}>₹{simulatedSavings.toLocaleString('en-IN')}</strong> and pays{' '}
                  <strong style={{ color: '#ffffff' }}>₹{simulatedFinal.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
            <span
              style={{
                backgroundColor: discountType === 'percentage' ? '#0284c7' : '#059669',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.5px',
              }}
            >
              {discountType === 'percentage' ? `${discountValue || 0}% OFF` : `FLAT ₹${discountValue || 0} OFF`}
            </span>
          </div>

          {/* Section 5: Conditions (Min Order, Max Cap, Expiry) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Min Order Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0 (no minimum)"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value === '' ? '' : Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Max Discount Cap (₹)
              </label>
              <input
                type="number"
                min="0"
                disabled={discountType === 'fixed'}
                placeholder={discountType === 'fixed' ? 'N/A for fixed' : '0 (no cap)'}
                value={discountType === 'fixed' ? '' : maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value === '' ? '' : Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: discountType === 'fixed' ? '#0f172a' : '#1e293b',
                  color: discountType === 'fixed' ? '#475569' : '#f8fafc',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Section 6: Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Offer Description / Promotional Tagline
            </label>
            <textarea
              rows={2}
              placeholder="e.g., 20% Special Community Discount across all professional programs."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                fontSize: '13px',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />
          </div>

          {/* Modal Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check size={16} /> {isEditing ? 'Save Coupon Changes' : 'Create & Activate Coupon'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
