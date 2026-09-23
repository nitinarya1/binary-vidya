'use client';

import React, { useState } from 'react';
import { X, CalendarClock, CheckCircle, Clock } from 'lucide-react';

interface FollowUpSchedulerModalProps {
  lead: {
    _id: string;
    name: string;
    phone: string;
    followUpAt?: string;
  };
  onClose: () => void;
  onSave: (leadId: string, status: string, note: string, followUpAt: string) => Promise<void>;
}

function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

export const FollowUpSchedulerModal: React.FC<FollowUpSchedulerModalProps> = ({
  lead,
  onClose,
  onSave,
}) => {
  const getDefaultTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    d.setMinutes(0, 0, 0);
    return formatDatetimeLocal(d);
  };

  const [datetime, setDatetime] = useState<string>(
    lead.followUpAt ? formatDatetimeLocal(new Date(lead.followUpAt)) : getDefaultTime()
  );
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const applyPreset = (preset: '2h' | 'evening' | 'tomorrow_morning' | 'tomorrow_evening') => {
    const now = new Date();
    if (preset === '2h') {
      now.setHours(now.getHours() + 2);
    } else if (preset === 'evening') {
      now.setHours(17, 0, 0, 0);
    } else if (preset === 'tomorrow_morning') {
      now.setDate(now.getDate() + 1);
      now.setHours(10, 30, 0, 0);
    } else if (preset === 'tomorrow_evening') {
      now.setDate(now.getDate() + 1);
      now.setHours(16, 0, 0, 0);
    }
    setDatetime(formatDatetimeLocal(now));
  };

  const handleSave = async () => {
    if (!datetime) return;
    setSaving(true);
    try {
      await onSave(lead._id, 'follow_up', note, new Date(datetime).toISOString());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 700);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarClock size={18} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Schedule Callback
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                {lead.name} · {lead.phone}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Quick Presets */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Quick Time Presets
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => applyPreset('2h')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ⏱️ In 2 Hours
            </button>
            <button
              type="button"
              onClick={() => applyPreset('evening')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🌆 Today at 5:00 PM
            </button>
            <button
              type="button"
              onClick={() => applyPreset('tomorrow_morning')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ☀️ Tomorrow 10:30 AM
            </button>
            <button
              type="button"
              onClick={() => applyPreset('tomorrow_evening')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🌇 Tomorrow 4:00 PM
            </button>
          </div>

          {/* DateTime Picker */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Scheduled Callback Date &amp; Time
          </div>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: '#0f172a',
              outline: 'none',
              marginBottom: '16px',
              boxSizing: 'border-box',
              background: '#f8fafc',
              fontWeight: 600,
            }}
          />

          {/* Note Input */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Follow-Up Note
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Student requested callback after college lectures at 4 PM to discuss syllabus..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: '#0f172a',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saved || !datetime}
              style={{
                flex: 2,
                padding: '11px',
                borderRadius: '8px',
                border: 'none',
                background: saved ? '#059669' : '#d97706',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {saved ? (
                <>
                  <CheckCircle size={16} /> Saved!
                </>
              ) : saving ? (
                'Scheduling...'
              ) : (
                'Set Scheduled Callback'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
