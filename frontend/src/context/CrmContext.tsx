'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CrmUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'agent';
  department: string;
  salesTeam?: string;
  mustChangePassword?: boolean;
}

interface CrmContextType {
  crmUser: CrmUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    requireOtp?: boolean;
    mustChangePassword?: boolean;
    message?: string;
    email?: string;
    maskedEmail?: string;
  }>;
  changeFirstPassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  sendOtp: (email: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const CrmContext = createContext<CrmContextType>({
  crmUser: null,
  loading: true,
  login: async () => ({ success: false }),
  changeFirstPassword: async () => ({ success: false }),
  sendOtp: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  logout: async () => {},
});

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [crmUser, setCrmUser] = useState<CrmUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.user) {
        setCrmUser(data.user);
      } else {
        setCrmUser(null);
      }
    } catch {
      setCrmUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const sendOtp = async (email: string) => {
    try {
      const res = await fetch('/api/crm/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to send login code.' };
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const res = await fetch('/api/crm/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCrmUser(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Verification failed.' };
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/crm/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.requireOtp) {
        return {
          success: true,
          requireOtp: true,
          email: data.email,
          maskedEmail: data.maskedEmail,
          message: data.message,
        };
      }
      if (data.success && data.user) {
        setCrmUser(data.user);
        return {
          success: true,
          mustChangePassword: Boolean(data.mustChangePassword),
          message: data.message,
        };
      }
      return { success: false, message: data.message || 'Login failed.' };
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const changeFirstPassword = async (newPassword: string) => {
    try {
      const res = await fetch('/api/crm/auth/change-first-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCrmUser(data.user);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to update permanent password.' };
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/crm/auth/me', { method: 'POST', credentials: 'include' });
    } catch {}
    setCrmUser(null);
  };

  return (
    <CrmContext.Provider value={{ crmUser, loading, login, changeFirstPassword, sendOtp, verifyOtp, logout }}>
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => useContext(CrmContext);
