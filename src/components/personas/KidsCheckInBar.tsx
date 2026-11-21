'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Star, Trophy } from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';

export function KidsCheckInBar() {
  const { kidsPoints, kidsLogs } = usePantryStore();
  const [celebratingId, setCelebratingId] = useState<string | null>(null);

  const latestLog = kidsLogs[0];

  useEffect(() => {
    if (!latestLog) return;
    // Trigger celebration animation only for recent check-ins (< 3 seconds ago)
    const age = Date.now() - new Date(latestLog.timestamp).getTime();
    if (age < 3500) {
      setCelebratingId(latestLog.id);
      const t = window.setTimeout(() => setCelebratingId(null), 1300);
      return () => window.clearTimeout(t);
    }
  }, [latestLog]);

  const level =
    kidsPoints >= 100
      ? { title: '超级冰箱大队长', next: 150, badge: '👑' }
      : kidsPoints >= 60
        ? { title: '整理小超人', next: 100, badge: '🦸' }
        : { title: '星星收纳员', next: 60, badge: '🌟' };

  const progress = Math.min(100, Math.round((kidsPoints / level.next) * 100));

  return (
    <section className="pantry-surface relative overflow-hidden p-4 sm:p-5">
      {/* Celebration Star Burst Overlay */}
      {celebratingId && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex items-center gap-4 text-4xl">
            <span className="animate-confetti">🎉</span>
            <span className="animate-confetti" style={{ animationDelay: '0.08s' }}>
              ⭐
            </span>
            <span className="animate-confetti" style={{ animationDelay: '0.16s' }}>
              ✨
            </span>
            <span className="animate-confetti" style={{ animationDelay: '0.22s' }}>
              🏆
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border-2 border-yellow-300 bg-yellow-100 text-4xl">
            {level.badge}
          </div>
          <div>
            <h2 className="text-xl font-black text-indigo-950">
              {level.title} · 星星打卡进度
            </h2>
            <p className="mt-0.5 text-sm font-bold text-indigo-700">
              点一下下面的大 Emoji 物品，就能记录「我拿了一个」或「我放回去了」哦！
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[200px] flex-1 rounded-2xl border-2 border-yellow-400 bg-yellow-50 px-4 py-3">
            <div className="flex items-center justify-between text-xs font-extrabold text-amber-900">
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                下一枚奖章
              </span>
              <span className="tabular-nums">
                {kidsPoints} / {level.next} ⭐
              </span>
            </div>
            <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-yellow-200">
              <div
                className="h-full rounded-full bg-sky-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="kids-btn-3d flex min-h-[60px] items-center gap-2 rounded-2xl border-2 border-yellow-500 bg-yellow-400 px-4 py-2 text-indigo-950">
            <Star className="h-6 w-6 fill-white text-white" />
            <div>
              <div className="text-[11px] font-extrabold">星星总分</div>
              <div className="tabular-nums text-2xl font-black leading-none">
                {kidsPoints}
              </div>
            </div>
          </div>
        </div>
      </div>

      {latestLog && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-extrabold text-sky-950">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" />
            <span>
              最新打卡：{latestLog.emoji} {latestLog.itemName} ·{' '}
              {latestLog.action === 'return'
                ? '真棒！乖乖放回原位啦！'
                : '礼貌记录拿走一个！'}
            </span>
          </div>
          <span className="rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-black text-indigo-950">
            +{latestLog.pointsEarned} ⭐
          </span>
        </div>
      )}
    </section>
  );
}
