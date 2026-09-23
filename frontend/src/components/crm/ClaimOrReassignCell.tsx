'use client';

import React, { useState } from 'react';
import { UserPlus, UserCheck, ChevronDown, Check } from 'lucide-react';

interface AgentOption {
  _id: string;
  name: string;
  team?: string;
  department?: string;
}

interface ClaimOrReassignCellProps {
  leadId: string;
  assignedTo?: string | null;
  assignedAgentName?: string;
  currentUserId: string;
  isSuperAdmin: boolean;
  availableAgents: AgentOption[];
  onClaim: (leadId: string) => Promise<void>;
  onReassign: (leadId: string, agentId: string, agentName: string) => Promise<void>;
}

export const ClaimOrReassignCell: React.FC<ClaimOrReassignCellProps> = ({
  leadId,
  assignedTo,
  assignedAgentName,
  currentUserId,
  isSuperAdmin,
  availableAgents,
  onClaim,
  onReassign,
}) => {
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isAssignedToMe = assignedTo === currentUserId;

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await onClaim(leadId);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = async (agent: AgentOption, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(false);
    setLoading(true);
    try {
      await onReassign(leadId, agent._id, agent.name);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      {/* If lead is unassigned */}
      {!assignedTo || assignedTo === '' ? (
        <button
          onClick={handleClaim}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '7px',
            border: '1px solid #bfdbfe',
            background: '#eff6ff',
            color: '#2563eb',
            fontSize: '11px',
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <UserPlus size={12} />
          {loading ? 'Claiming...' : 'Claim Lead'}
        </button>
      ) : isAssignedToMe ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <UserCheck size={12} color="#059669" />
            You
          </span>

          {isSuperAdmin && (
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Reassign to another agent"
            >
              <ChevronDown size={12} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontSize: '11px',
              color: '#334155',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100px',
              display: 'inline-block',
            }}
            title={assignedAgentName || 'Assigned'}
          >
            {assignedAgentName || 'Assigned'}
          </span>

          {isSuperAdmin && (
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Reassign to another agent"
            >
              <ChevronDown size={12} />
            </button>
          )}
        </div>
      )}

      {/* Admin Reassign Dropdown */}
      {showDropdown && isSuperAdmin && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 100,
            marginTop: '4px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
            minWidth: '180px',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', padding: '6px 8px', textTransform: 'uppercase' }}>
            Reassign Lead To
          </div>
          {availableAgents.map((ag) => (
            <button
              key={ag._id}
              onClick={(e) => handleSelectAgent(ag, e)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 8px',
                borderRadius: '6px',
                border: 'none',
                background: ag._id === assignedTo ? '#eff6ff' : 'transparent',
                color: ag._id === assignedTo ? '#2563eb' : '#0f172a',
                fontSize: '12px',
                fontWeight: ag._id === assignedTo ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>{ag.name}</span>
              {ag._id === assignedTo && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
