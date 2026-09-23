'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Phone,
  Link as LinkIcon,
  MessageCircle,
  Calendar,
  Clock,
  User,
  School,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { TemperatureBadge } from './TemperatureBadge';

interface LeadActivityDrawerProps {
  leadId: string | null;
  onClose: () => void;
  onOpenDisposition: (lead: any) => void;
  onOpenSendLink: (lead: any) => void;
}

export const LeadActivityDrawer: React.FC<LeadActivityDrawerProps> = ({
  leadId,
  onClose,
  onOpenDisposition,
  onOpenSendLink,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leadId) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/crm/leads/${leadId}/history`, { credentials: 'include' })
      .then((res) => res.json())
      .then((resData) => {
        if (isMounted && resData.success) {
          setData(resData);
        }
      })
      .catch((err) => console.error('Failed to fetch lead history:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  if (!leadId) return null;

  const lead = data?.lead;
  const timeline = data?.timeline || [];

  const handleWhatsApp = () => {
    if (!lead?.phone) return;
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `Hi ${lead.name}, this is regarding your inquiry for ${lead.course || 'the course'} at Binary Vidya. When is a good time to connect for a quick 5-min counselling roadmap?`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          height: '100%',
          boxShadow: '-10px 0 35px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: '#f8fafc',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {lead ? lead.name : 'Lead Activity'}
              </h2>
              {lead && <TemperatureBadge createdAt={lead.createdAt} />}
            </div>
            {lead && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <a
                  href={`tel:${lead.phone}`}
                  style={{ fontSize: '13px', color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}
                >
                  {lead.phone}
                </a>
                {lead.email && <span style={{ fontSize: '12px', color: '#64748b' }}>· {lead.email}</span>}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        {lead && (
          <div
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid #f1f5f9',
              background: '#ffffff',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => onOpenDisposition(lead)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Phone size={13} />
              Log Call
            </button>
            <button
              onClick={handleWhatsApp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                background: '#f0fdf4',
                color: '#059669',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <MessageCircle size={13} />
              WhatsApp
            </button>
            <button
              onClick={() => onOpenSendLink(lead)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <LinkIcon size={13} />
              Send Link
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block', color: '#2563eb' }} />
              Loading lead timeline...
            </div>
          ) : !lead ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No details found.</div>
          ) : (
            <div>
              {/* Academic & Target Profile Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Student Profile
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>College</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{lead.collegeName || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Year &amp; Branch</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                      {[lead.year, lead.branch].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Target Track</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>{lead.course || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Assigned Counselor</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{lead.assignedAgentName || 'Unassigned'}</div>
                  </div>
                </div>

                {lead.followUpAt && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px dashed #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#d97706',
                      fontWeight: 700,
                    }}
                  >
                    <Clock size={13} />
                    <span>
                      Scheduled Callback: {new Date(lead.followUpAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Timeline Stream */}
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Activity &amp; Call Timeline
              </div>

              {timeline.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '13px' }}>No events recorded yet.</div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: '24px' }}>
                  {/* Vertical rule */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      bottom: '8px',
                      left: '7px',
                      width: '2px',
                      background: '#e2e8f0',
                    }}
                  />

                  {timeline.map((item: any, idx: number) => (
                    <div key={idx} style={{ position: 'relative', marginBottom: '18px' }}>
                      {/* Node bullet */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-24px',
                          top: '3px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: item.type === 'created' ? '#059669' : item.type === 'payment_link' ? '#7c3aed' : '#2563eb',
                          border: '3px solid #ffffff',
                          boxShadow: '0 0 0 1px #cbd5e1',
                        }}
                      />

                      <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{item.title}</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {new Date(item.timestamp).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {item.description && (
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                            {item.description}
                          </div>
                        )}
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
                          By: <strong style={{ color: '#334155' }}>{item.actor}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
