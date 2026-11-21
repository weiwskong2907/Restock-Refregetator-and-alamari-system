'use client';

import {
  Plus,
  ShoppingCart,
  HeartHandshake,
  Smile,
  GraduationCap,
  LayoutDashboard,
  SlidersHorizontal,
  Lock,
} from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import { FRIDGE_MODEL_MAP } from '@/data/fridgeModels';
import type { UserMode } from '@/types/pantry';

interface TopNavbarProps {
  onRequestModeSwitch: (targetMode: UserMode) => void;
  onOpenAddModal: () => void;
  onOpenRestockDrawer: () => void;
  onOpenFridgePicker: () => void;
}

const MODES: {
  id: UserMode;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'elderly', label: '长辈模式', shortLabel: '长辈', icon: HeartHandshake },
  { id: 'kids', label: '童趣模式', shortLabel: '童趣', icon: Smile },
  { id: 'student', label: '学生模式', shortLabel: '学生', icon: GraduationCap },
  { id: 'manager', label: '管家模式', shortLabel: '管家', icon: LayoutDashboard },
];

export function TopNavbar({
  onRequestModeSwitch,
  onOpenAddModal,
  onOpenRestockDrawer,
  onOpenFridgePicker,
}: TopNavbarProps) {
  const { userMode, fridgeModel, fridgeProfile, customGlbName, restockList } =
    usePantryStore();
  const pendingRestockCount = restockList.filter((r) => !r.checked).length;
  const fridgePreset = FRIDGE_MODEL_MAP[fridgeModel];
  const fridgeDisplayLabel = customGlbName
    ? `自定义3D · ${customGlbName}`
    : `${fridgeProfile.brand} ${fridgeProfile.modelCode} (${fridgePreset.name})`;

  const isElderly = userMode === 'elderly';
  const isKids = userMode === 'kids';

  return (
    <header
      className="safe-top sticky top-0 z-30 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 94%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 sm:px-6">
        {/* Brand + Current Fridge Model Pill */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: 'var(--accent-soft)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }}
            aria-hidden="true"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect
                x="4"
                y="2.5"
                width="16"
                height="19"
                rx="3"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <line
                x1="4"
                y1="9.5"
                x2="20"
                y2="9.5"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <line
                x1="8"
                y1="5.5"
                x2="8"
                y2="7.2"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <line
                x1="8"
                y1="12.5"
                x2="8"
                y2="16.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div
              className={`font-extrabold leading-tight tracking-tight ${
                isElderly ? 'text-2xl' : 'text-base sm:text-lg'
              }`}
              style={{ color: 'var(--ink-primary)' }}
            >
              SmartPantry 3D
            </div>
            {!isKids && (
              <button
                type="button"
                onClick={onOpenFridgePicker}
                className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                <SlidersHorizontal className="h-3 w-3" />
                <span className="max-w-[200px] truncate sm:max-w-none">
                  {fridgeDisplayLabel}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Persona Mode Switcher */}
        <nav
          aria-label="切换全龄段模式"
          className="pantry-subtle order-3 flex w-full items-center justify-between gap-1 p-1 md:order-2 md:w-auto"
        >
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const active = userMode === mode.id;
            const lockedForKids = isKids && mode.id !== 'kids';

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onRequestModeSwitch(mode.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 font-bold transition-all md:flex-initial md:px-3 ${
                  isElderly ? 'min-h-[52px] text-lg' : 'text-xs sm:text-sm'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-ink)',
                      }
                    : { color: 'var(--ink-secondary)' }
                }
              >
                {lockedForKids ? (
                  <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                ) : (
                  <Icon className="h-4 w-4 shrink-0" />
                )}
                <span className="hidden sm:inline">{mode.label}</span>
                <span className="sm:hidden">{mode.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions (Hidden delete/price actions in Kids Mode) */}
        {!isKids && (
          <div className="order-2 flex items-center gap-2 md:order-3">
            <button
              type="button"
              onClick={onOpenRestockDrawer}
              className={`relative hidden items-center gap-1.5 rounded-xl border px-3 py-2 font-bold transition-opacity hover:opacity-85 sm:inline-flex ${
                isElderly ? 'min-h-[56px] text-lg' : 'text-xs sm:text-sm'
              }`}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--ink-primary)',
              }}
            >
              <ShoppingCart className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              <span>补货比价</span>
              {pendingRestockCount > 0 && (
                <span className="tabular-nums inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-bold text-white">
                  {pendingRestockCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-bold transition-opacity hover:opacity-90 ${
                isElderly ? 'min-h-[56px] px-5 text-lg' : 'text-xs sm:text-sm'
              }`}
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-ink)',
              }}
            >
              <Plus className="h-4 w-4" />
              <span>入库</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
