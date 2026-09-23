'use client';

import React from 'react';
import { CrmProvider } from '../../context/CrmContext';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmProvider>
      {children}
    </CrmProvider>
  );
}
