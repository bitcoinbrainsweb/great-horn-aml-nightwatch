import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logAudit } from '../util/auditLog';

/**
 * EngagementLockBanner — shows lock state of engagement and allows admin unlock.
 */
export default function EngagementLockBanner({ engagement, user, onUnlock }) {
  const [unlocking, setUnlocking] = useState(false);

  const isAdmin = ['super_admin', 'compliance_admin', 'admin'].includes(user?.role);

  async function handleUnlock() {
    setUnlocking(true);
    await base44.entities.Engagement.update(engagement.id, { is_locked: false, locked_by: null, locked_at: null });
    await logAudit({
      userEmail: user?.email,
      objectType: 'Engagement',
      objectId: engagement.id,
      action: 'engagement_unlocked',
      details: `Engagement unlocked by ${user?.email}. Integrity seal may be invalidated.`,
    });
    setUnlocking(false);
    if (onUnlock) onUnlock();
  }

  if (!engagement.is_locked) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl mb-4">
      <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Engagement Locked</p>
        <p className="text-[11px] text-slate-400">
          Locked after report finalization. Risks, controls, intake, and report sections are read-only.
          {engagement.locked_by && ` Locked by ${engagement.locked_by}.`}
        </p>
      </div>
      {isAdmin && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleUnlock}
          disabled={unlocking}
          className="border-amber-400/30 text-amber-400 hover:bg-white/10 hover:text-white gap-1.5"
        >
          <Unlock className="w-3.5 h-3.5" />
          {unlocking ? 'Unlocking...' : 'Unlock'}
        </Button>
      )}
    </div>
  );
}