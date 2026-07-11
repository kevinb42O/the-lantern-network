/**
 * Admin configuration — single source of truth.
 * Previously duplicated in App.tsx and AuthContext.tsx.
 */
export const ADMIN_EMAILS = [
  'kevinb42O@hotmail.com',
] as const;

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
}
