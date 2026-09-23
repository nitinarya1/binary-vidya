'use client';

import React, { useState } from 'react';
import { X, MessageSquare, CheckCircle } from 'lucide-react';

type LeadStatus = 'new' | 'contacted' | 'interested' | 'follow_up' | 'converted' | 'not_interested' | 'no_answer' | 'invalid';

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'interested', label: 'Interested', color: '#059669' },
  { value: 'contacted', label: 'Contacted', color: '#2563eb' },
  { value: 'follow_up', label: 'Follow Up', color: '#d97706' },
  { value: 'converted', label: 'Converted ✓', color: '#7c3aed' },
  { value: 'not_interested', label: 'Not Interested', color: '#dc2626' },
  { value: 'no_answer', label: 'No Answer', color: '#64748b' },
  { value: 'invalid', label: 'Invalid Number', color: '#9ca3af' },
  { value: 'new', label: 'New / Reset', color: '#0284c7' },
];

interface DispositionModalProps {
  lead: {
    _id: string;
    name: string;
    phone: string;
    status: LeadStatus;
    statusUpdatedByName?: string;
    statusUpdatedAt?: string;
    callNotes?: {
      agentId: string;
      agentName: string;
      note: string;
      status: LeadStatus;
      createdAt: string;
    }[];
  } | null;
  onClose: () => void;
  onSave: (leadId: string, status: LeadStatus, note: string) => Promise<void>;
}

export const DispositionModal: React.FC<DispositionModalProps> = ({ lead, onClose, onSave }) => {
  const [status, setStatus] = useState<LeadStatus>(lead?.status || 'contacted');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!lead) return null;

  const lastUpdatedBy =
    lead.statusUpdatedByName ||
    lead.callNotes?.[lead.callNotes.length - 1]?.agentName;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(lead._id, status, note);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 800);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
      zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Call Feedback &amp; Disposition
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {lead.name} · {lead.phone}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Current Status & Last Updated By Notice */}
          <div style={{
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Current Status: </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '99px',
                background: `${STATUS_OPTIONS.find(s => s.value === lead.status)?.color || '#64748b'}18`,
                color: STATUS_OPTIONS.find(s => s.value === lead.status)?.color || '#64748b',
              }}>
                {STATUS_OPTIONS.find(s => s.value === lead.status)?.label || lead.status}
              </span>
            </div>
            {lastUpdatedBy && (
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                Updated by: <strong style={{ color: '#0f172a' }}>{lastUpdatedBy}</strong>
              </div>
            )}
          </div>

          {/* Status grid */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
            New Call Outcome
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: status === opt.value ? `2px solid ${opt.color}` : '2px solid #e2e8f0',
                  background: status === opt.value ? `${opt.color}15` : '#f8fafc',
                  color: status === opt.value ? opt.color : '#475569',
                  fontSize: '12px',
                  fontWeight: status === opt.value ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Note */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            <MessageSquare size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Call Note (optional)
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a quick note about this call..."
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit',
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              color: '#0f172a',
            }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #e2e8f0',
                background: '#f8fafc', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                flex: 2, padding: '11px', borderRadius: '8px', border: 'none',
                background: saved ? '#059669' : '#2563eb', color: '#fff',
                fontSize: '13px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background 0.2s ease',
              }}
            >
              {saved ? <><CheckCircle size={16} /> Saved!</> : saving ? 'Saving...' : 'Save Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
