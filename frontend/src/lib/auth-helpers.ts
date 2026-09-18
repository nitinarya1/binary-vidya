const DEFAULT_ADMIN_EMAILS = [
  'aryar0779@gmail.com',
  'binaryvidyaadmin@gmail.com',
];

export const SUPER_ADMIN_EMAILS = [
  'aryar0779@gmail.com',
  'binaryvidyaadmin@gmail.com',
];

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return SUPER_ADMIN_EMAILS.includes(normalized) || normalized.includes('binaryvidyaadmin');
};

export const isDefaultAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return DEFAULT_ADMIN_EMAILS.includes(normalized) || normalized.includes('binaryvidyaadmin');
};

