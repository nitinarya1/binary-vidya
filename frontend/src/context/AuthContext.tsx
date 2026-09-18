'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { isSuperAdminEmail } from '../lib/auth-helpers';

export interface TeamPermissions {
  manageCourses?: boolean;
  manageTraining?: boolean;
  manageCareers?: boolean;
  viewAnalytics?: boolean;
  manageCertificates?: boolean;
  manageTeam?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  authProvider?: string;
  dateOfBirth?: string;
  gender?: string;
  isTeamMember?: boolean;
  department?: string;
  permissions?: TeamPermissions;
  teamStatus?: 'active' | 'suspended';
}

export interface LoginResult {
  user?: User | null;
  requireOtp?: boolean;
  email?: string;
  maskedEmail?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (identifier: string, pass: string) => Promise<LoginResult>;
  verifySuperAdminOtp: (email: string, otp: string) => Promise<User | null>;
  registerUser: (name: string, email: string, pass: string, phone?: string) => Promise<User | null>;
  googleAuth: (data: string | { credential?: string; accessToken?: string }) => Promise<User | null>;
  updateUser: (updatedData: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('bv_token');
    const savedUser = localStorage.getItem('bv_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('bv_token');
        localStorage.removeItem('bv_user');
      }
    }
    setIsLoading(false);

    // Verify session in background if token exists
    if (savedToken) {
      apiRequest('/auth/me')
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('bv_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        });
    }
  }, []);

  const handleAuthSuccess = (resToken: string, resUser: User) => {
    setToken(resToken);
    setUser(resUser);
    localStorage.setItem('bv_token', resToken);
    localStorage.setItem('bv_user', JSON.stringify(resUser));
  };

  const login = async (identifier: string, pass: string): Promise<LoginResult> => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password: pass }),
    });

    if (res.requireOtp) {
      return {
        requireOtp: true,
        email: res.email,
        maskedEmail: res.maskedEmail,
        message: res.message,
      };
    }

    if (res.token && res.user) {
      handleAuthSuccess(res.token, res.user);
      return { user: res.user };
    }
    return {};
  };

  const verifySuperAdminOtp = async (email: string, otp: string): Promise<User | null> => {
    const res = await apiRequest('/auth/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });

    if (res.token && res.user) {
      handleAuthSuccess(res.token, res.user);
      return res.user;
    }
    return null;
  };

  const registerUser = async (name: string, email: string, pass: string, phone?: string): Promise<User | null> => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: pass, phone }),
    });

    if (res.token && res.user) {
      handleAuthSuccess(res.token, res.user);
      return res.user;
    }
    return null;
  };

  const googleAuth = async (data: string | { credential?: string; accessToken?: string }): Promise<any> => {
    const payload = typeof data === 'string' ? { credential: data } : data;
    const res = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.requireOtp) {
      return {
        requireOtp: true,
        email: res.email,
        maskedEmail: res.maskedEmail,
        isSuperAdmin: res.isSuperAdmin,
        message: res.message,
      };
    }

    if (res.token && res.user) {
      handleAuthSuccess(res.token, res.user);
      return res.user;
    }
    return null;
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('bv_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bv_token');
    localStorage.removeItem('bv_user');
  };

  const isSuspended = user?.teamStatus === 'suspended';
  const isSuperAdmin = Boolean(user && !isSuspended && isSuperAdminEmail(user.email));
  const hasAnyTeamPermission = Boolean(
    user?.permissions?.manageCourses ||
    user?.permissions?.manageTraining ||
    user?.permissions?.manageCareers ||
    user?.permissions?.viewAnalytics ||
    user?.permissions?.manageCertificates ||
    user?.permissions?.manageTeam
  );
  const isAdmin = Boolean(
    user &&
    !isSuspended &&
    (isSuperAdmin || hasAnyTeamPermission)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isSuperAdmin,
        login,
        verifySuperAdminOtp,
        registerUser,
        googleAuth,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
