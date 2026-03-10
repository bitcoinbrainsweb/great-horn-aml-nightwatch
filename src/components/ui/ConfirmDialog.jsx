import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmDialog — requires the user to type a confirmation phrase before proceeding.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onConfirm: () => void
 *   title: string
 *   description: string | ReactNode
 *   confirmWord: string — exact text user must type (e.g. "DELETE" or a client name)
 *   actionLabel: string — button label (default: "Confirm")
 *   danger: boolean — red button (default: true)
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description,
  confirmWord = 'DELETE',
  actionLabel = 'Confirm',
  danger = true,
}) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === confirmWord;

  // Reset typed input when dialog opens/closes
  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  function handleConfirm() {
    if (!matches) return;
    onConfirm();
    setTyped('');
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {danger && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription asChild>
              <div className="text-sm text-slate-600 mt-1">{description}</div>
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <p className="text-sm text-slate-600">
            Type <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">{confirmWord}</span> to confirm:
          </p>
          <Input
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder={`Type "${confirmWord}"...`}
            className="font-mono"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && matches) handleConfirm(); }}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!matches}
            onClick={handleConfirm}
            className={danger
              ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-40'
              : 'bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40'
            }
          >
            {actionLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}