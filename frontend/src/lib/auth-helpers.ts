const DEFAULT_ADMIN_EMAILS = [
  'aryar0779@gmail.com',
];

export const SUPER_ADMIN_EMAILS = [
  'aryar0779@gmail.com',
];

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  // Strictly only aryar0779@gmail.com is allowed as Super Admin
  return normalized === 'aryar0779@gmail.com';
};

export const isDefaultAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  // Strictly only aryar0779@gmail.com can hold admin privileges
  return normalized === 'aryar0779@gmail.com';
};

