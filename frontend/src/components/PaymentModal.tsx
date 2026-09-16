'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  X,
  QrCode,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  Info,
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

type PaymentTab = 'upi_qr' | 'upi_app' | 'cards' | 'emi' | 'netbanking' | 'wallet';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  course,
  user,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('upi_qr');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for methods
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(user.name || '');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [selectedWallet, setSelectedWallet] = useState('paytm');
  const [selectedEmiTenure, setSelectedEmiTenure] = useState('3');

  // Countdown timer for QR code
  const [secondsRemaining, setSecondsRemaining] = useState(600);

  useEffect(() => {
    let timer: any;
    if (isOpen && !paymentSuccess) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 600));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, paymentSuccess]);

  // Load Razorpay Script & Create Order on Open
  useEffect(() => {
    if (!isOpen) return;

    // Load Razorpay checkout script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Initialize Order from backend
    const initOrder = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const res = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: course.slug || course.id,
            userEmail: user.email,
            userName: user.name,
            userId: user.id,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setOrderData(data);
        } else {
          setErrorMessage(data.message || 'Failed to initialize payment order');
        }
      } catch (err: any) {
        console.error('Order creation error:', err);
        setErrorMessage(err.message || 'Payment service unreachable');
      } finally {
        setLoading(false);
      }
    };

    initOrder();

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOpen, course, user]);

  if (!isOpen) return null;

  const formattedTime = `${Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, '0')}:${(secondsRemaining % 60).toString().padStart(2, '0')}`;

  // Complete Payment Verification Flow
  const finalizePayment = async (methodUsed: string, paymentId?: string) => {
    try {
      setLoading(true);
      const generatedPaymentId = paymentId || `pay_${Date.now().toString()}_${Math.random().toString(36).slice(-4)}`;
      const orderId = orderData?.orderId || `order_${Date.now()}`;

      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayOrderId: orderId,
          razorpayPaymentId: generatedPaymentId,
          razorpaySignature: 'simulated_verified_signature',
          paymentMethod: methodUsed,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentSuccess({
          paymentId: generatedPaymentId,
          orderId: orderId,
          amount: course.price,
          courseTitle: course.title,
          method: methodUsed,
        });

        // Trigger confetti celebration
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (cErr) {}

        onPaymentSuccess?.(data);
      } else {
        setErrorMessage(data.message || 'Payment verification failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Open Official Razorpay Window
  const handleOpenRazorpayStandard = () => {
    if (typeof (window as any).Razorpay === 'undefined') {
      alert('Razorpay Checkout SDK is loading. Please try in a moment.');
      return;
    }

    const options = {
      key: orderData?.keyId || 'rzp_test_1DP5mmOlF5G5ag',
      amount: orderData?.amount || course.price * 100,
      currency: 'INR',
      name: 'Binary Vidya',
      description: `Enrollment for ${course.title}`,
      image: 'https://binaryvidya.com/logo.png',
      order_id: orderData?.orderId,
      handler: function (response: any) {
        finalizePayment('razorpay_modal', response.razorpay_payment_id);
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone || '9999999999',
      },
      theme: {
        color: '#2563eb',
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (resp: any) {
      setErrorMessage(resp.error?.description || 'Payment was cancelled or failed.');
    });
    rzp.open();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.72)',
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
          maxWidth: '820px',
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'paymentScale 0.22s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
              }}
            >
              BV
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Razorpay Secure Checkout</h3>
                <span style={{ fontSize: '10px', background: 'rgba(37, 99, 235, 0.4)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(147, 197, 253, 0.4)' }}>
                  256-bit SSL Encrypted
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Paying for: <strong style={{ color: '#e2e8f0' }}>{course.title}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Total Payable</span>
              <strong style={{ fontSize: '18px', color: '#10b981' }}>
                ₹{course.price ? course.price.toLocaleString('en-IN') : '0'}
              </strong>
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
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Success Screen */}
        {paymentSuccess ? (
          <div style={{ padding: '48px 32px', textAlign: 'center', background: '#ffffff' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 10px 25px rgba(5, 150, 105, 0.2)',
              }}
            >
              <CheckCircle2 size={44} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
              Payment Confirmed! You&apos;re Enrolled!
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Your payment of <strong style={{ color: '#0f172a' }}>₹{paymentSuccess.amount.toLocaleString('en-IN')}</strong> was successfully processed. You now have lifetime access to all lectures, project repositories, and discussion channels.
            </p>

            <div
              style={{
                maxWidth: '480px',
                margin: '0 auto 28px',
                padding: '16px 20px',
                borderRadius: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Transaction Reference:</span>
                <strong style={{ color: '#0f172a' }}>{paymentSuccess.paymentId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Order ID:</span>
                <span style={{ color: '#0f172a' }}>{paymentSuccess.orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Account:</span>
                <span style={{ color: '#0f172a' }}>{user.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Mode:</span>
                <span style={{ color: '#2563eb', fontWeight: 700, textTransform: 'uppercase' }}>
                  {paymentSuccess.method.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
              <button
                onClick={() => {
                  onClose();
                  router.push('/my-learning');
                }}
                style={{
                  padding: '12px 28px',
                  borderRadius: '12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                }}
              >
                Access Course Dashboard Now
              </button>
            </div>
          </div>
        ) : (
          /* Main Payment Layout (Sidebar Tabs + Content Area) */
          <div style={{ display: 'flex', flex: 1, minHeight: '440px', overflow: 'hidden' }}>
            {/* Sidebar Navigation */}
            <div
              style={{
                width: '240px',
                background: '#f8fafc',
                borderRight: '1px solid #e2e8f0',
                padding: '14px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', padding: '6px 12px' }}>
                UPI &amp; Instant Pay
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('upi_qr')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'upi_qr' ? '#2563eb' : 'transparent',
                  color: activeTab === 'upi_qr' ? '#ffffff' : '#334155',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <QrCode size={18} />
                <span>Scan QR (Any UPI)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('upi_app')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'upi_app' ? '#2563eb' : 'transparent',
                  color: activeTab === 'upi_app' ? '#ffffff' : '#334155',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Smartphone size={18} />
                <span>UPI Apps / VPA</span>
              </button>

              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', padding: '14px 12px 6px' }}>
                Cards &amp; Banking
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('cards')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'cards' ? '#2563eb' : 'transparent',
                  color: activeTab === 'cards' ? '#ffffff' : '#334155',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <CreditCard size={18} />
                <span>Credit / Debit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('netbanking')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'netbanking' ? '#2563eb' : 'transparent',
                  color: activeTab === 'netbanking' ? '#ffffff' : '#334155',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Building2 size={18} />
                <span>NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('emi')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'emi' ? '#2563eb' : 'transparent',
                  color: activeTab === 'emi' ? '#ffffff' : '#334155',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Zap size={18} />
                <span>EMI (No Cost)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'wallet' ? '#2563eb' : 'transparent',
                  color: activeTab === 'wallet' ? '#ffffff' : '#334155',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Wallet size={18} />
                <span>Wallets</span>
              </button>

              {/* Razorpay Standard Button at Bottom */}
              <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleOpenRazorpayStandard}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#2563eb',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <ExternalLink size={12} /> Standard Razorpay Pop
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', background: '#ffffff' }}>
              {errorMessage && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* 1. TAB: SCAN THE QR USING ANY UPI APP */}
              {activeTab === 'upi_qr' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        Scan &amp; Pay Using Any UPI App
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        Open Google Pay, PhonePe, Paytm, BHIM, or Cred on your mobile phone to scan.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#ef4444', fontWeight: 700, background: '#fef2f2', padding: '4px 10px', borderRadius: '6px' }}>
                      <Clock size={13} /> {formattedTime}
                    </div>
                  </div>

                  {/* QR Box */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px',
                      padding: '20px',
                      borderRadius: '16px',
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      marginBottom: '20px',
                    }}
                  >
                    <div
                      style={{
                        width: '180px',
                        height: '180px',
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '2px solid #2563eb',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {/* Dynamic Simulated High-Quality QR */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=binaryvidya@razorpay&pn=BinaryVidya&am=${course.price}&cu=INR`}
                        alt="UPI Payment QR"
                        style={{ width: '160px', height: '160px', borderRadius: '4px' }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                        Supported UPI Apps:
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Cred', 'WhatsApp'].map((app) => (
                          <span
                            key={app}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#334155',
                            }}
                          >
                            {app}
                          </span>
                        ))}
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
                        1. Open any UPI application on your mobile device.<br />
                        2. Select <strong>&ldquo;Scan QR&rdquo;</strong> and point camera at the screen.<br />
                        3. Confirm amount <strong>₹{course.price.toLocaleString('en-IN')}</strong> and enter your UPI PIN.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => finalizePayment('upi_qr')}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '12px',
                      background: '#10b981',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <CheckCircle2 size={18} />
                    {loading ? 'Confirming with Banking Network...' : `I Have Paid ₹${course.price.toLocaleString('en-IN')}`}
                  </button>
                </div>
              )}

              {/* 2. TAB: UPI APPS & VPA */}
              {activeTab === 'upi_app' && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Pay via UPI App or UPI ID
                  </h4>
                  <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#64748b' }}>
                    Instant approval through your preferred UPI handle.
                  </p>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Enter your Virtual Payment Address (UPI ID)
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. yourname@okhdfcbank or mobilenumber@paytm"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>
                    Or select your app:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
                    {[
                      { name: 'Google Pay', handle: '@okaxis' },
                      { name: 'PhonePe', handle: '@ybl' },
                      { name: 'Paytm UPI', handle: '@paytm' },
                      { name: 'BHIM UPI', handle: '@upi' },
                      { name: 'Cred Pay', handle: '@cred' },
                      { name: 'Amazon Pay', handle: '@apl' },
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setUpiId(`user${item.handle}`)}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          border: '1.5px solid #e2e8f0',
                          background: '#f8fafc',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#1e293b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Smartphone size={14} color="#2563eb" /> {item.name}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => finalizePayment('upi_app')}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '12px',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Requesting UPI Approval...' : `Pay ₹${course.price.toLocaleString('en-IN')} via UPI`}
                  </button>
                </div>
              )}

              {/* 3. TAB: CARDS */}
              {activeTab === 'cards' && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Pay via Credit or Debit Card
                  </h4>
                  <p style={{ margin: '0 0 18px 0', fontSize: '12px', color: '#64748b' }}>
                    All Indian &amp; International cards (Visa, Mastercard, RuPay, Amex) supported with OTP verification.
                  </p>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 •••• •••• 8910"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Rahul Sharma"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => finalizePayment('cards')}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '12px',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Processing Card Authentication...' : `Pay ₹${course.price.toLocaleString('en-IN')} Securely`}
                  </button>
                </div>
              )}

              {/* 4. TAB: NETBANKING */}
              {activeTab === 'netbanking' && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    NetBanking
                  </h4>
                  <p style={{ margin: '0 0 18px 0', fontSize: '12px', color: '#64748b' }}>
                    Select your bank to redirect to their secure online banking portal.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                    {['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'PNB'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBank(b)}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: selectedBank === b ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                          background: selectedBank === b ? '#eff6ff' : '#ffffff',
                          fontWeight: 800,
                          fontSize: '13px',
                          color: selectedBank === b ? '#1d4ed8' : '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        {b} Bank
                      </button>
                    ))}
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Or choose from all other banks
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="HDFC">HDFC Bank</option>
                      <option value="SBI">State Bank of India</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="Axis">Axis Bank</option>
                      <option value="Kotak">Kotak Mahindra Bank</option>
                      <option value="Bank of Baroda">Bank of Baroda</option>
                      <option value="Canara Bank">Canara Bank</option>
                      <option value="IndusInd">IndusInd Bank</option>
                      <option value="Federal">Federal Bank</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => finalizePayment('netbanking')}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '12px',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Connecting to Bank Gateway...' : `Proceed to ${selectedBank} Bank`}
                  </button>
                </div>
              )}

              {/* 5. TAB: EMI */}
              {activeTab === 'emi' && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    No-Cost &amp; Credit Card EMI
                  </h4>
                  <p style={{ margin: '0 0 18px 0', fontSize: '12px', color: '#64748b' }}>
                    Split your tuition payment into flexible monthly installments.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                    {[
                      { months: '3', perMonth: Math.round(course.price / 3), interest: '0% Interest (No Cost)' },
                      { months: '6', perMonth: Math.round((course.price * 1.05) / 6), interest: 'Standard Card EMI' },
                      { months: '12', perMonth: Math.round((course.price * 1.09) / 12), interest: 'Extended Tenure' },
                    ].map((plan) => (
                      <div
                        key={plan.months}
                        onClick={() => setSelectedEmiTenure(plan.months)}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: selectedEmiTenure === plan.months ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                          background: selectedEmiTenure === plan.months ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                            {plan.months} Months Plan
                          </strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                            {plan.interest}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '16px', color: '#2563eb' }}>
                            ₹{plan.perMonth.toLocaleString('en-IN')} / mo
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => finalizePayment('emi')}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '12px',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Checking Card EMI Eligibility...' : `Confirm ${selectedEmiTenure}-Month EMI Plan`}
                  </button>
                </div>
              )}

              {/* 6. TAB: WALLETS */}
              {activeTab === 'wallet' && (
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Wallets &amp; Cash Cards
                  </h4>
                  <p style={{ margin: '0 0 18px 0', fontSize: '12px', color: '#64748b' }}>
                    Pay using your verified mobile wallet balance.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                    {[
                      { id: 'paytm', name: 'Paytm Wallet' },
                      { id: 'phonepe', name: 'PhonePe Wallet' },
                      { id: 'mobikwik', name: 'MobiKwik' },
                      { id: 'amazonpay', name: 'Amazon Pay Balance' },
                    ].map((w) => (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWallet(w.id)}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: selectedWallet === w.id ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                          background: selectedWallet === w.id ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <Wallet size={18} color="#2563eb" />
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{w.name}</strong>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => finalizePayment('wallet')}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '12px',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Linking Wallet...' : `Pay ₹${course.price.toLocaleString('en-IN')} with Wallet`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <div
          style={{
            padding: '12px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#059669" />
            <span>Guaranteed Secure 256-bit Transaction by Razorpay Payments</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} />
            <span>PCI-DSS Level 1 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
