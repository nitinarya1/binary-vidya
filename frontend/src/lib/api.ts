const getBaseApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  // In browser on Vercel or client side, use same-origin /api to prevent mixed content and CORS
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: any;
  email?: string;
  maskedEmail?: string;
  accounts?: any[];
  [key: string]: any;
}

export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bv_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const primaryBase = getBaseApiUrl();
  const fallbackBase = primaryBase.startsWith('http')
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:5000/api');

  let res: Response | null = null;
  let lastError: any = null;

  try {
    res = await fetch(`${primaryBase}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    console.warn(`[API] Primary request to ${primaryBase}${endpoint} failed: ${err.message}. Retrying fallback...`);
    lastError = err;
    if (fallbackBase && fallbackBase !== primaryBase) {
      try {
        res = await fetch(`${fallbackBase}${endpoint}`, {
          ...options,
          headers,
        });
      } catch (fallbackErr: any) {
        lastError = fallbackErr;
      }
    }
  }

  if (!res) {
    throw new Error(
      lastError?.message === 'Failed to fetch' || lastError?.message === 'fetch failed'
        ? 'Unable to connect to server. Please check your internet connection or try again.'
        : lastError?.message || 'Server connection error. Please try again.'
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
};
