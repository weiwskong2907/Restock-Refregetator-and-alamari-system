'use client';

import { useState } from 'react';
import { usePantryStore } from '@/store/usePantryStore';
import { getCompartmentMeta } from '@/data/compartments';

interface KidsCheckInModalProps {
  itemId: string | null;
  onClose: () => void;
}

export function KidsCheckInModal({ itemId, onClose }: KidsCheckInModalProps) {
  const { items, adjustQuantity } = usePantryStore();
  const [celebrateText, setCelebrateText] = useState<string | null>(null);

  if (!itemId) return null;
  const item = items.find((i) => i.id === itemId);
  if (!item) return null;

  const loc = getCompartmentMeta(item.compartmentId);

  const handleAction = (delta: number) => {
    adjustQuantity(item.id, delta, true);
    setCelebrateText(
      delta > 0 ? '太棒啦！乖乖放回原位 +10⭐' : '好有礼貌！已登记拿取 +5⭐',
    );
    window.setTimeout(() => {
      setCelebrateText(null);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border-4 border-yellow-300 bg-white p-6 text-center shadow-2xl">
        {celebrateText ? (
          <div className="py-8">
            <div className="flex justify-center gap-3 text-5xl">
              <span className="animate-confetti">🎉</span>
              <span className="animate-confetti" style={{ animationDelay: '0.1s' }}>
                ⭐
              </span>
              <span className="animate-confetti" style={{ animationDelay: '0.2s' }}>
                🏆
              </span>
            </div>
            <div className="mt-4 text-2xl font-black text-indigo-950">
              {celebrateText}
            </div>
          </div>
        ) : (
          <>
            <div className="text-7xl leading-none">{item.emoji}</div>
            <h3 className="mt-3 text-2xl font-black text-indigo-950">
              {item.name}
            </h3>
            <p className="mt-1 text-sm font-bold text-indigo-600">
              住在「{loc?.shortLabel ?? '储物格'}」 · 现在有 {item.quantity}{' '}
              {item.unit}
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                disabled={item.quantity === 0}
                onClick={() => handleAction(-1)}
                className="kids-btn-3d flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-sky-400 px-5 text-xl font-black text-sky-950 disabled:opacity-40"
              >
                🖐️ 我拿了一个 (+5⭐)
              </button>

              <button
                type="button"
                onClick={() => handleAction(1)}
                className="kids-btn-3d flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 text-xl font-black text-amber-950"
              >
                🙌 我放回去了 (+10⭐)
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-1 min-h-[56px] w-full rounded-2xl border-2 border-stone-200 text-base font-extrabold text-stone-500"
              >
                先看看别的
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
