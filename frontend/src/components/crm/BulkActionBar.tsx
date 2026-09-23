'use client';

import React, { useState } from 'react';
import { Users, CheckCircle, X, ChevronDown, Check } from 'lucide-react';

interface AgentOption {
  _id: string;
  name: string;
}

interface BulkActionBarProps {
  selectedCount: number;
  availableAgents: AgentOption[];
  onDeselectAll: () => void;
  onBulkAssign: (agentId: string, agentName: string) => Promise<void>;
  onBulkStatus: (status: string) => Promise<void>;
}

const STATUS_CHOICES = [
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'converted', label: 'Converted' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'no_answer', label: 'No Answer' },
];

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  availableAgents,
  onDeselectAll,
  onBulkAssign,
  onBulkStatus,
}) => {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [busy, setBusy] = useState(false);

  if (selectedCount === 0) return null;

  const handleAssign = async (agent: AgentOption) => {
    setShowAssignDropdown(false);
    setBusy(true);
    try {
      await onBulkAssign(agent._id, agent.name);
    } finally {
      setBusy(false);
    }
  };

  const handleStatus = async (status: string) => {
    setShowStatusDropdown(false);
    setBusy(true);
    try {
      await onBulkStatus(status);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9000,
        background: '#0f172a',
        borderRadius: '16px',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        border: '1px solid #334155',
        color: '#ffffff',
        animation: 'slideUp 0.25s ease-out',
        maxWidth: '92vw',
        flexWrap: 'wrap',
      }}
    >
      {/* Selected Counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            background: '#2563eb',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '999px',
          }}
        >
          {selectedCount}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 700 }}>Leads Selected</span>
      </div>

      <div style={{ height: '20px', width: '1px', background: '#334155' }} />

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
        {/* Bulk Assign */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setShowAssignDropdown(!showAssignDropdown);
              setShowStatusDropdown(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            <Users size={13} color="#60a5fa" />
            Assign To...
            <ChevronDown size={12} />
          </button>

          {showAssignDropdown && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: '8px',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                minWidth: '180px',
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '4px',
                color: '#0f172a',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', padding: '6px 8px', textTransform: 'uppercase' }}>
                Select Agent
              </div>
              {availableAgents.map((ag) => (
                <button
                  key={ag._id}
                  onClick={() => handleAssign(ag)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#0f172a',
                    fontSize: '12px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {ag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bulk Status */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowAssignDropdown(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            <CheckCircle size={13} color="#34d399" />
            Set Status...
            <ChevronDown size={12} />
          </button>

          {showStatusDropdown && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: '8px',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                minWidth: '160px',
                padding: '4px',
                color: '#0f172a',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', padding: '6px 8px', textTransform: 'uppercase' }}>
                Select Outcome
              </div>
              {STATUS_CHOICES.map((st) => (
                <button
                  key={st.value}
                  onClick={() => handleStatus(st.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#0f172a',
                    fontSize: '12px',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: '20px', width: '1px', background: '#334155' }} />

      {/* Deselect All */}
      <button
        type="button"
        onClick={onDeselectAll}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          padding: '4px',
        }}
      >
        <X size={14} />
        Deselect
      </button>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
};
