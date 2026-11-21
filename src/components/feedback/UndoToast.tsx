'use client';

import { useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';

export function UndoToast() {
  const { undoSnapshot, triggerUndo, dismissUndo } = usePantryStore();

  useEffect(() => {
    if (!undoSnapshot) return;
    const remaining = Math.max(500, undoSnapshot.expiresAt - Date.now());
    const timer = window.setTimeout(() => {
      dismissUndo();
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [undoSnapshot, dismissUndo]);

  if (!undoSnapshot) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-6">
      <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-gray-900 px-4 py-3 text-white shadow-2xl">
        <span className="truncate text-sm font-semibold">
          {undoSnapshot.message}
        </span>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={triggerUndo}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-extrabold text-gray-950 transition-transform active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>撤销 (Undo)</span>
          </button>
          <button
            type="button"
            onClick={dismissUndo}
            className="rounded-lg p-1 text-gray-400 hover:text-white"
            aria-label="关闭提示"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
