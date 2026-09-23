'use client';

import React from 'react';
import { getLeadTemperature } from '../../utils/leadTemperature';

interface TemperatureBadgeProps {
  createdAt: string | Date;
  updatedAt?: string | Date;
  compact?: boolean;
}

export const TemperatureBadge: React.FC<TemperatureBadgeProps> = ({
  createdAt,
  updatedAt,
  compact = false,
}) => {
  const info = getLeadTemperature(createdAt, updatedAt);

  return (
    <span
      title={info.description}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: compact ? '10px' : '11px',
        fontWeight: 700,
        padding: compact ? '1px 6px' : '2px 8px',
        borderRadius: '999px',
        background: info.bgColor,
        color: info.color,
        border: `1px solid ${info.borderColor}`,
        whiteSpace: 'nowrap',
        cursor: 'help',
        lineHeight: 1.3,
      }}
    >
      <span>{info.icon}</span>
      {!compact && <span>{info.label}</span>}
    </span>
  );
};
