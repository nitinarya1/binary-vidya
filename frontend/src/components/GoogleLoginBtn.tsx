'use client';

import React, { useState } from 'react';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { ExternalLink, AlertCircle } from 'lucide-react';

interface GoogleLoginBtnProps {
  onSuccess?: (user: any) => void;
  onError?: (msg: string) => void;
}

export const GoogleLoginBtn: React.FC<GoogleLoginBtnProps> = ({ onSuccess, onError }) => {
  const { googleAuth } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const isConfigured = envClientId.trim().length > 10 && !envClientId.includes('dummy');

  // Handle official Google ID token credential
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsProcessing(true);
      if (credentialResponse.credential) {
        const authUser = await googleAuth({ credential: credentialResponse.credential });
        if (onSuccess) {
          onSuccess(authUser);
        } else {
          window.location.href = authUser?.role === 'admin' ? '/admin' : '/';
        }
      } else {
        onError?.('Google credential token was not provided.');
      }
    } catch (err: any) {
      onError?.(err.message || 'Google sign-in verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Popup flow fallback via useGoogleLogin
  const triggerGooglePopup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsProcessing(true);
        if (tokenResponse.access_token) {
          const authUser = await googleAuth({ accessToken: tokenResponse.access_token });
          if (onSuccess) {
            onSuccess(authUser);
          } else {
            window.location.href = authUser?.role === 'admin' ? '/admin' : '/';
          }
        }
      } catch (err: any) {
        onError?.(err.message || 'Google authentication failed.');
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (err) => {
      setIsProcessing(false);
      onError?.('Google popup closed or cancelled.');
    },
  });

  return (
    <div style={{ width: '100%' }}>
      {isConfigured ? (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {/* Official Google Identity Services button with One-Tap */}
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => onError?.('Official Google sign in failed.')}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="100%"
            useOneTap
          />
        </div>
      ) : (
        <div>
          {/* Authentic Google Button styling per Google Brand Guidelines */}
          <button
            type="button"
            id="google-login-btn"
            onClick={() => triggerGooglePopup()}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #dadce0',
              color: '#3c4043',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s, box-shadow 0.2s',
              boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f7f8f8';
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            {isProcessing ? 'Connecting to Google...' : 'Continue with Google'}
          </button>

          {/* Clean setup banner if Google Client ID is not yet defined */}
          <div
            style={{
              marginTop: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#f8faff',
              border: '1px solid #dbeafe',
              fontSize: '12px',
              color: '#475569',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <AlertCircle size={15} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <span>To connect with your real Google account on localhost, add your </span>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
              >
                Google OAuth Client ID <ExternalLink size={10} style={{ display: 'inline' }} />
              </a>
              <span> in <code>frontend/.env.local</code>.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
