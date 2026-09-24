export const ROOT_SUPER_ADMIN_EMAIL = 'aryar0779@gmail.com';

export const SUPER_ADMIN_EMAILS = [
  'aryar0779@gmail.com',
  'binaryvidyaadmin@gmail.com',
];

const DEFAULT_ADMIN_EMAILS = [
  'aryar0779@gmail.com',
  'binaryvidyaadmin@gmail.com',
];

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return SUPER_ADMIN_EMAILS.includes(normalized);
};

export const isRootSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return normalized === ROOT_SUPER_ADMIN_EMAIL.toLowerCase() || normalized === 'binaryvidyaadmin@gmail.com';
};

export const isDefaultAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return DEFAULT_ADMIN_EMAILS.includes(normalized);
};

