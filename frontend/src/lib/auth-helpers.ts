const DEFAULT_ADMIN_EMAILS = [
  'aryar0779@gmail.com',
  'binaryvidyaadmin@gmail.com',
  'admin@binaryvidya.edu',
];

export const isDefaultAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const envAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  return DEFAULT_ADMIN_EMAILS.includes(normalized) || envAdmins.includes(normalized);
};
