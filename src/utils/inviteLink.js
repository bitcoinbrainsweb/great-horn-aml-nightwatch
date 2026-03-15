/**
 * Build registration/invite URL for a UserInvitation (NW-UPGRADE-075B).
 * Base44 auth host is appBaseUrl; invitation is identified by id and email.
 */
import { appParams } from '@/lib/app-params';

export function buildInviteLink(invitation) {
  if (!invitation?.id) return null;
  const base = appParams?.appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  if (!base) return null;
  const params = new URLSearchParams();
  params.set('invitation_id', invitation.id);
  if (invitation.email) params.set('email', invitation.email);
  if (typeof window !== 'undefined' && window.location?.href) {
    params.set('from_url', window.location.origin + window.location.pathname);
  }
  const qs = params.toString();
  const sep = base.includes('?') ? '&' : '?';
  return qs ? `${base}${sep}${qs}` : base;
}
