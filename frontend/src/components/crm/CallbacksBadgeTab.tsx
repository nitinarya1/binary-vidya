'use client';

import React from 'react';
import { CalendarClock } from 'lucide-react';

interface CallbacksBadgeTabProps {
  count: number;
  isActive: boolean;
  onClick: () => void;
}

export const CallbacksBadgeTab: React.FC<CallbacksBadgeTabProps> = ({
  count,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '10px',
        border: isActive ? '1px solid #2563eb' : '1px solid #cbd5e1',
        background: isActive ? '#eff6ff' : '#ffffff',
        color: isActive ? '#1d4ed8' : '#334155',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
        transition: 'all 0.15s ease',
      }}
    >
      <CalendarClock size={15} color={isActive ? '#2563eb' : '#64748b'} />
      <span>Callbacks Due Today</span>
      {count > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '20px',
            height: '20px',
            padding: '0 6px',
            borderRadius: '999px',
            background: isActive ? '#2563eb' : '#dc2626',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 800,
            lineHeight: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
};
