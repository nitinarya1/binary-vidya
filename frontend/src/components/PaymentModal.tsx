'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  X,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  Zap,
  AlertCircle,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    slug?: string;
    title: string;
    price: number;
    thumbnail?: string;
    category?: string;
  };
  user: {
    id?: string;
    email: string;
    name: string;
    phone?: string;
  };
  onPaymentSuccess?: (paymentDetails: any) => void;
}

// Safely loads official Razorpay Checkout SDK
const ensureRazorpayLoaded = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.getElementById('razorpay-checkout-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  course,
  user,
  onPaymentSuccess,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);

  // Trigger Authentic Razorpay Checkout Modal
  const launchRazorpayCheckout = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const loaded = await ensureRazorpayLoaded();
      if (!loaded || typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
      }

      // Create official Razorpay Order
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.slug || course.id,
          userEmail: user.email,
          userName: user.name || 'Student',
          userId: user.id || '',
        }),
      });

      const orderData = await res.json();
      if (!orderData.success || !orderData.orderId) {
        throw new Error(orderData.message || 'Failed to initialize Razorpay order.');
      }

      const options = {
        key:
          orderData.keyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_test_Td7SsGbdScfViP',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Binary Vidya',
        description: `Enrollment for ${course.title}`,
        image: 'https://binaryvidya.com/logo.png',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            setLoading(true);
            const vRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentMethod: 'razorpay_authentic',
              }),
            });

            const vData = await vRes.json();
            if (vData.success) {
              setPaymentSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: course.price,
                courseTitle: course.title,
              });

              try {
                confetti({
                  particleCount: 120,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              } catch (cErr) {}

              onPaymentSuccess?.(vData);
            } else {
              setErrorMessage(vData.message || 'Payment signature verification failed.');
            }
          } catch (verErr: any) {
            setErrorMessage(verErr.message || 'Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || '9999999999',
        },
        notes: {
          courseId: course.id,
          courseTitle: course.title,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
          confirm_close: true,
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setLoading(false);
        setErrorMessage(resp.error?.description || 'Payment was cancelled or failed in Razorpay.');
      });
      rzp.open();
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Payment initialization error.');
    }
  }, [course, user, onPaymentSuccess]);

  // Automatically launch official Razorpay standard popup on open if not already paid
  useEffect(() => {
    if (isOpen && !paymentSuccess) {
      launchRazorpayCheckout();
    }
  }, [isOpen, paymentSuccess, launchRazorpayCheckout]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '13px',
              }}
            >
              BV
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800 }}>Official Razorpay Gateway</span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '36px 28px' }}>
          {paymentSuccess ? (
            <div>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={38} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                Payment Confirmed!
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
                Your enrollment for <strong>{course.title}</strong> is active.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  textAlign: 'left',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Payment ID:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{paymentSuccess.paymentId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Amount:</span>
                  <span style={{ color: '#059669', fontWeight: 800 }}>
                    ₹{course.price.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  router.push('/my-learning');
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Go to My Learning &amp; Start Watching
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Zap size={30} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                Connecting to Razorpay Secure Gateway
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
                Paying ₹{course.price.toLocaleString('en-IN')} for <strong>{course.title}</strong>
              </p>

              {errorMessage && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={launchRazorpayCheckout}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Lock size={16} />
                <span>{loading ? 'Opening Razorpay...' : 'Open Official Razorpay Window'}</span>
              </button>

              <div style={{ marginTop: '16px', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="#059669" />
                <span>256-Bit SSL Encrypted • Powered by Razorpay</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
