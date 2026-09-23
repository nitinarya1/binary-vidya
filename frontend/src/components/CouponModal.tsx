'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, Check, Copy, X, ArrowRight, ShieldCheck, Gift, Percent } from 'lucide-react';

export interface CouponItem {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableTo?: string;
  description?: string;
  badge?: string;
}

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoupon: (code: string) => Promise<boolean | void>;
  currentAmount: number;
  itemType?: 'course' | 'training' | 'all';
  currentlyAppliedCode?: string;
}

export const CouponModal: React.FC<CouponModalProps> = ({
  isOpen,
  onClose,
  onApplyCoupon,
  currentAmount,
  itemType = 'all',
  currentlyAppliedCode,
}) => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setInputCode('');

    async function fetchAvailableCoupons() {
      try {
        setLoading(true);
        const res = await fetch(`/api/coupons/available?itemType=${itemType}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.coupons)) {
          setCoupons(data.coupons);
        }
      } catch (err) {
        console.error('Failed to fetch available coupons:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailableCoupons();
  }, [isOpen, itemType]);

  const handleApply = async (codeToApply: string) => {
    if (!codeToApply.trim()) {
      setErrorMsg('Please enter a coupon code.');
      return;
    }

    try {
      setErrorMsg(null);
      setApplyingCode(codeToApply.trim().toUpperCase());
      await onApplyCoupon(codeToApply.trim().toUpperCase());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply coupon.');
    } finally {
      setApplyingCode(null);
    }
  };

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Tag size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Apply Coupon Code
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Save more on your learning with verified promo discounts
              </p>
            </div>
          </div>

          <button
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
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Manual Input Form */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}
            >
              Enter Promo Code
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="e.g. BINARY20, SKILL500"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setErrorMsg(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApply(inputCode);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: errorMsg ? '1.5px solid #ef4444' : '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleApply(inputCode)}
                disabled={!inputCode.trim() || Boolean(applyingCode)}
                style={{
                  padding: '0 20px',
                  borderRadius: '12px',
                  background: !inputCode.trim() || Boolean(applyingCode) ? '#94a3b8' : '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  cursor: !inputCode.trim() || Boolean(applyingCode) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {applyingCode === inputCode.trim().toUpperCase() ? 'Applying...' : 'Apply'}
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '12.5px',
                  color: '#dc2626',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>&bull;</span> {errorMsg}
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0 16px 0',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Available Verified Offers
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Available Coupons List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '13px' }}>
              Finding best promotional discounts...
            </div>
          ) : coupons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '13px' }}>
              No promo codes active currently.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {coupons.map((coupon) => {
                const isCurrentlyApplied =
                  currentlyAppliedCode &&
                  currentlyAppliedCode.toUpperCase() === coupon.code.toUpperCase();
                const isApplyingThis = applyingCode === coupon.code;
                const meetsMinOrder =
                  !coupon.minOrderAmount || currentAmount >= coupon.minOrderAmount;

                return (
                  <div
                    key={coupon.code}
                    style={{
                      border: isCurrentlyApplied
                        ? '2px solid #10b981'
                        : '1.5px dashed #cbd5e1',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      backgroundColor: isCurrentlyApplied ? '#f0fdf4' : '#f8fafc',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            backgroundColor: isCurrentlyApplied ? '#dcfce7' : '#ffffff',
                            color: isCurrentlyApplied ? '#15803d' : '#1e3a8a',
                            border: '1px solid #cbd5e1',
                          }}
                        >
                          {coupon.code}
                        </span>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#ffffff',
                            backgroundColor: isCurrentlyApplied ? '#10b981' : '#2563eb',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {coupon.badge || (coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`)}
                        </span>
                      </div>

                      {/* Action Button */}
                      {isCurrentlyApplied ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#15803d',
                          }}
                        >
                          <Check size={15} /> Applied
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApply(coupon.code)}
                          disabled={!meetsMinOrder || Boolean(applyingCode)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: meetsMinOrder ? '#2563eb' : '#cbd5e1',
                            color: '#ffffff',
                            border: 'none',
                            cursor: meetsMinOrder ? 'pointer' : 'not-allowed',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isApplyingThis ? 'Applying...' : 'Apply Coupon'}
                        </button>
                      )}
                    </div>

                    <p style={{ margin: '0 0 6px 0', fontSize: '12.5px', color: '#475569', lineHeight: 1.45 }}>
                      {coupon.description}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#64748b',
                      }}
                    >
                      <span>
                        {coupon.minOrderAmount && coupon.minOrderAmount > 0
                          ? `Min. order: ₹${coupon.minOrderAmount.toLocaleString('en-IN')}`
                          : 'No minimum purchase required'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleCopy(coupon.code, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedCode === coupon.code ? '#10b981' : '#2563eb',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: 0,
                        }}
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check size={12} /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy Code
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Guaranteed Instant Discount on Razorpay</span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
