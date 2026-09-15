'use client';

import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../context/AuthContext';

export const ClientProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientId, setClientId] = useState<string>(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-google-client-id.apps.googleusercontent.com'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bv_custom_google_client_id');
      if (stored && stored.trim().length > 10) {
        setClientId(stored.trim());
      }
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>{children}</AuthProvider>
    </GoogleOAuthProvider>
  );
};
