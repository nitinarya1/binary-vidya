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
  ArrowRight,
  ShieldCheck,
  Wand2,
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

  const handleGenerateCode = () => {
    const prefixes = ['BV', 'LEARN', 'FESTIVE', 'SUPER', 'SUMMER', 'SKILL'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const val = typeof discountValue === 'number' && discountValue > 0 ? discountValue : '25';
    setCode(`${p}${val}`);
  };

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
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 1px 1px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#0f172a',
          fontFamily: 'inherit',
        }}
      >
        {/* Solid Light Mode Header */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1.5px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.12)',
              }}
            >
              <Tag size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.01em' }}>
                {isEditing ? `Edit Coupon: ${couponToEdit?.code}` : 'Create New Discount Coupon'}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0 0' }}>
                Configure promo codes, percentage or cash discount, scope, and validity limits
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '8px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.color = '#64748b';
            }}
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body - Pure Solid White */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px 28px', backgroundColor: '#ffffff' }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Promo Code & Status Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '16px', marginBottom: '22px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Coupon Promo Code <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0 4px',
                  }}
                >
                  <Wand2 size={12} /> Auto-Generate
                </button>
              </div>

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
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Uppercase alphanumeric characters only (auto-converted).
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Coupon Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: isActive ? '1.5px solid #a7f3d0' : '1.5px solid #cbd5e1',
                  backgroundColor: isActive ? '#ecfdf5' : '#f8fafc',
                  color: isActive ? '#047857' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#10b981' : '#94a3b8',
                  }}
                />
                <span>{isActive ? 'Active (Live)' : 'Inactive (Draft)'}</span>
              </button>
              <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block', textAlign: 'center' }}>
                Click button to toggle live status
              </span>
            </div>
          </div>

          {/* Section 2: Discount Type Selector (Percentage vs Fixed Money Off) */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Select Discount Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
              }}
            >
              {/* Percentage Toggle Card */}
              <div
                onClick={() => setDiscountType('percentage')}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border:
                    discountType === 'percentage'
                      ? '2px solid #2563eb'
                      : '1.5px solid #e2e8f0',
                  backgroundColor:
                    discountType === 'percentage'
                      ? '#eff6ff'
                      : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.15s ease',
                  boxShadow: discountType === 'percentage' ? '0 4px 14px rgba(37, 99, 235, 0.1)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: discountType === 'percentage' ? '#2563eb' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: discountType === 'percentage' ? '#ffffff' : '#64748b',
                    flexShrink: 0,
                  }}
                >
                  <Percent size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: discountType === 'percentage' ? '#1d4ed8' : '#0f172a' }}>
                    Percentage Off (%)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    e.g., 10%, 20%, 30% discount off tuition
                  </div>
                </div>
                {discountType === 'percentage' && (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Fixed Money Off Toggle Card */}
              <div
                onClick={() => setDiscountType('fixed')}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border:
                    discountType === 'fixed'
                      ? '2px solid #059669'
                      : '1.5px solid #e2e8f0',
                  backgroundColor:
                    discountType === 'fixed'
                      ? '#ecfdf5'
                      : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.15s ease',
                  boxShadow: discountType === 'fixed' ? '0 4px 14px rgba(5, 150, 105, 0.1)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: discountType === 'fixed' ? '#059669' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: discountType === 'fixed' ? '#ffffff' : '#64748b',
                    flexShrink: 0,
                  }}
                >
                  <IndianRupee size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: discountType === 'fixed' ? '#047857' : '#0f172a' }}>
                    Fixed Money Off (₹)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    e.g., Flat ₹500, ₹1,000, ₹2,000 off total
                  </div>
                </div>
                {discountType === 'fixed' && (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Value and Applicability */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
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
                    padding: '11px 40px 11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '15px',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 800,
                    color: discountType === 'percentage' ? '#2563eb' : '#059669',
                    fontSize: '15px',
                  }}
                >
                  {discountType === 'percentage' ? '%' : '₹'}
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                {discountType === 'percentage' ? 'Value between 1% and 100%' : 'Exact cash deduction amount'}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Applicable Program Scope
              </label>
              <select
                value={applicableTo}
                onChange={(e: any) => setApplicableTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              >
                <option value="all">All Programs (Courses &amp; Training)</option>
                <option value="courses">Courses Only (/courses/...)</option>
                <option value="training">Training &amp; Internship Only</option>
              </select>
              <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Limits coupon usage to specific platform modules
              </span>
            </div>
          </div>

          {/* Section 4: Live Checkout Calculation Preview (Solid Light Mode) */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                  Live Checkout Calculation Preview
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                  On a sample ₹{sampleAmount.toLocaleString('en-IN')} tuition: student saves{' '}
                  <strong style={{ color: '#047857' }}>₹{simulatedSavings.toLocaleString('en-IN')}</strong> and pays{' '}
                  <strong style={{ color: '#0f172a' }}>₹{simulatedFinal.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
            <span
              style={{
                backgroundColor: discountType === 'percentage' ? '#eff6ff' : '#ecfdf5',
                color: discountType === 'percentage' ? '#1d4ed8' : '#047857',
                border: `1px solid ${discountType === 'percentage' ? '#bfdbfe' : '#a7f3d0'}`,
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 800,
                letterSpacing: '0.3px',
                whiteSpace: 'nowrap',
              }}
            >
              {discountType === 'percentage' ? `${discountValue || 0}% OFF` : `FLAT ₹${discountValue || 0} OFF`}
            </span>
          </div>

          {/* Section 5: Conditions (Min Order, Max Cap, Expiry) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '22px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
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
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
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
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: discountType === 'fixed' ? '#f1f5f9' : '#ffffff',
                  color: discountType === 'fixed' ? '#94a3b8' : '#0f172a',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />
            </div>
          </div>

          {/* Section 6: Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Offer Description / Promotional Tagline
            </label>
            <textarea
              rows={2}
              placeholder="e.g., 20% Special Community Discount across all professional programs."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontSize: '13.5px',
                boxSizing: 'border-box',
                resize: 'none',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>

          {/* Modal Footer Actions - Solid Light Mode */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '18px',
              borderTop: '1.5px solid #f1f5f9',
              backgroundColor: '#ffffff',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '11px 20px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '11px 24px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
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
