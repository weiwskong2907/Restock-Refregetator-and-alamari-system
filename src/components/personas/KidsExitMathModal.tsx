'use client';

import { useEffect, useState } from 'react';
import { Lock, X } from 'lucide-react';
import type { UserMode } from '@/types/pantry';

interface KidsExitMathModalProps {
  targetMode: UserMode | null;
  onCancel: () => void;
  onVerified: (mode: UserMode) => void;
}

export function KidsExitMathModal({
  targetMode,
  onCancel,
  onVerified,
}: KidsExitMathModalProps) {
  const [a, setA] = useState(6);
  const [b, setB] = useState(7);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!targetMode) return;
    setA(Math.floor(Math.random() * 6) + 3); // 3..8
    setB(Math.floor(Math.random() * 7) + 3); // 3..9
    setAnswer('');
    setError('');
  }, [targetMode]);

  if (!targetMode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.parseInt(answer.trim(), 10) === a * b) {
      onVerified(targetMode);
    } else {
      setError('答案不对哦，请爸爸妈妈帮忙算一下~');
      setAnswer('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl border-4 border-yellow-300 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-950">
            <Lock className="h-5 w-5 text-sky-500" />
            <h2 className="text-lg font-extrabold">家长验证 · 退出童趣模式</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 hover:bg-stone-100"
            aria-label="取消"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm font-medium text-stone-600">
          为防止小朋友误切模式，请答对下方简单乘法题：
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-2xl bg-sky-50 py-4 text-center text-3xl font-black text-indigo-950">
            {a} × {b} = ?
          </div>

          <input
            type="number"
            inputMode="numeric"
            autoFocus
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setError('');
            }}
            placeholder="请输入数字答案"
            className="w-full rounded-2xl border-2 border-sky-300 px-4 py-3 text-center text-xl font-extrabold outline-none focus:border-sky-500"
          />

          {error && (
            <p className="text-center text-sm font-bold text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-2xl border-2 border-stone-200 py-3 text-sm font-bold text-stone-600"
            >
              留在童趣模式
            </button>
            <button
              type="submit"
              className="kids-btn-3d flex-1 rounded-2xl bg-sky-400 py-3 text-sm font-extrabold text-sky-950"
            >
              确认切换
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
