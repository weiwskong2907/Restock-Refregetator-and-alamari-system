'use client';

import {
  Box,
  ClipboardList,
  ShoppingCart,
  SlidersHorizontal,
} from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import type { MobileTab } from '@/types/pantry';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onOpenRestock: () => void;
  onOpenFridgePicker: () => void;
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
  onOpenRestock,
  onOpenFridgePicker,
}: MobileBottomNavProps) {
  const { userMode, restockList } = usePantryStore();
  const pendingCount = restockList.filter((r) => !r.checked).length;
  const isKids = userMode === 'kids';
  const isElderly = userMode === 'elderly';

  return (
    <nav
      aria-label="移动端底部导航"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md lg:hidden"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 96%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
        <button
          type="button"
          onClick={() => onTabChange('scene')}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 font-bold transition-colors ${
            isElderly ? 'min-h-[60px] text-sm' : 'min-h-[52px] text-[11px]'
          }`}
          style={{
            color: activeTab === 'scene' ? 'var(--accent)' : 'var(--ink-muted)',
            backgroundColor:
              activeTab === 'scene' ? 'var(--accent-soft)' : 'transparent',
          }}
        >
          <Box className="h-5 w-5" />
          <span>3D 空间</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('inventory')}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 font-bold transition-colors ${
            isElderly ? 'min-h-[60px] text-sm' : 'min-h-[52px] text-[11px]'
          }`}
          style={{
            color:
              activeTab === 'inventory' ? 'var(--accent)' : 'var(--ink-muted)',
            backgroundColor:
              activeTab === 'inventory' ? 'var(--accent-soft)' : 'transparent',
          }}
        >
          <ClipboardList className="h-5 w-5" />
          <span>{isKids ? '我的宝藏' : '库存清单'}</span>
        </button>

        {!isKids && (
          <button
            type="button"
            onClick={onOpenRestock}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 font-bold transition-colors ${
              isElderly ? 'min-h-[60px] text-sm' : 'min-h-[52px] text-[11px]'
            }`}
            style={{ color: 'var(--ink-muted)' }}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="tabular-nums absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-extrabold text-white">
                  {pendingCount}
                </span>
              )}
            </div>
            <span>补货比价</span>
          </button>
        )}

        {!isKids && (
          <button
            type="button"
            onClick={onOpenFridgePicker}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 font-bold transition-colors ${
              isElderly ? 'min-h-[60px] text-sm' : 'min-h-[52px] text-[11px]'
            }`}
            style={{ color: 'var(--ink-muted)' }}
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span>换冰箱</span>
          </button>
        )}
      </div>
    </nav>
  );
}
