import { base44 } from '@/api/base44Client';

/**
 * Write a record to the AuditLog entity.
 * Failures are swallowed so audit writes never break the main app flow.
 */
export async function logAudit({
  userEmail,
  objectType,
  objectId,
  action,
  fieldChanged,
  oldValue,
  newValue,
  details,
}) {
  try {
    let email = userEmail;
    if (!email) {
      const me = await base44.auth.me();
      email = me?.email || 'unknown';
    }
    await base44.entities.AuditLog.create({
      user_email: email,
      object_type: objectType || '',
      object_id: objectId ? String(objectId) : '',
      action: action || '',
      field_changed: fieldChanged || '',
      old_value: oldValue != null ? String(oldValue) : '',
      new_value: newValue != null ? String(newValue) : '',
      details: details || '',
    });
  } catch (e) {
    console.warn('[AuditLog] Write failed:', e.message);
  }
}