import { base44 } from '@/api/base44Client';

/**
 * Write a record to the AuditLog entity.
 * Failures are swallowed so audit writes never break the main app flow.
 * Pass workspaceId when available for full workspace-scoped audit trails.
 */
export async function logAudit({
  workspaceId,
  userEmail,
  userName,
  objectType,
  objectId,
  action,
  fieldChanged,
  oldValue,
  newValue,
  details,
}) {
  try {
    const email = userEmail || 'unknown';
    const name = userName || '';
    await base44.entities.AuditLog.create({
      workspace_id: workspaceId || '',
      user_email: email,
      user_name: name || '',
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