'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import { FRIDGE_MODEL_MAP } from '@/data/fridgeModels';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { FridgeModelPickerModal } from '@/components/fridge/FridgeModelPickerModal';
import { ElderlyVoiceBar } from '@/components/personas/ElderlyVoiceBar';
import { KidsCheckInBar } from '@/components/personas/KidsCheckInBar';
import { KidsCheckInModal } from '@/components/personas/KidsCheckInModal';
import { KidsExitMathModal } from '@/components/personas/KidsExitMathModal';
import { StudentHubPanel } from '@/components/personas/StudentHubPanel';
import { ManagerStatsBar } from '@/components/personas/ManagerStatsBar';
import { InventoryPanel } from '@/components/inventory/InventoryPanel';
import { ItemDetailModal } from '@/components/inventory/ItemDetailModal';
import { ItemFormModal } from '@/components/inventory/ItemFormModal';
import { RestockDrawer } from '@/components/restock/RestockDrawer';
import { UndoToast } from '@/components/feedback/UndoToast';
import type { InventoryItem, MobileTab, UserMode } from '@/types/pantry';

const PantryCanvas = dynamic(
  () => import('@/components/scene/PantryCanvas').then((mod) => mod.PantryCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        className="pantry-surface flex h-[360px] flex-col items-center justify-center gap-2 lg:h-[560px]"
        style={{ color: 'var(--ink-muted)' }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-teal-700" />
        <p className="text-sm font-bold">正在构建 3D 冰箱与橱柜引擎…</p>
      </div>
    ),
  },
);

export function SmartPantryApp() {
  const {
    userMode,
    fridgeModel,
    hasChosenFridgeModel,
    remapNotice,
    setUserMode,
    dismissRemapNotice,
  } = usePantryStore();

  const [hydrated, setHydrated] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('scene');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [kidsCheckInItemId, setKidsCheckInItemId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [restockOpen, setRestockOpen] = useState(false);
  const [fridgePickerOpen, setFridgePickerOpen] = useState(false);
  const [pendingModeExit, setPendingModeExit] = useState<UserMode | null>(null);

  useEffect(() => {
    void usePantryStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const activeMode = hydrated ? userMode : 'manager';
  const fridgePreset = FRIDGE_MODEL_MAP[fridgeModel];

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.persona = activeMode;
    }
  }, [activeMode]);

  const handleRequestModeSwitch = (targetMode: UserMode) => {
    if (targetMode === activeMode) return;
    if (activeMode === 'kids') {
      setPendingModeExit(targetMode);
      return;
    }
    setUserMode(targetMode);
  };

  const handleOpenItemFrom3D = (itemId: string) => {
    if (activeMode === 'kids') {
      setKidsCheckInItemId(itemId);
    } else {
      setDetailItemId(itemId);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  return (
    <div
      data-persona={activeMode}
      className="min-h-[100dvh] pb-28 transition-colors duration-200 lg:pb-8"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--ink-primary)',
      }}
    >
      <TopNavbar
        onRequestModeSwitch={handleRequestModeSwitch}
        onOpenAddModal={openAddModal}
        onOpenRestockDrawer={() => setRestockOpen(true)}
        onOpenFridgePicker={() => setFridgePickerOpen(true)}
      />

      <main className="mx-auto max-w-[1480px] space-y-4 px-3.5 py-4 sm:px-6 sm:py-5">
        {/* First-time Fridge Model Setup Banner */}
        {hydrated && !hasChosenFridgeModel && activeMode !== 'kids' && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
            style={{
              backgroundColor: 'var(--accent-soft)',
              borderColor: 'var(--accent)',
            }}
          >
            <div
              className="flex items-center gap-2.5 text-sm font-bold"
              style={{ color: 'var(--ink-primary)' }}
            >
              <SlidersHorizontal
                className="h-4 w-4 shrink-0"
                style={{ color: 'var(--accent)' }}
              />
              <span>
                首次使用？当前默认为「{fridgePreset.name}」，可一键切换你家同款 3D 冰箱结构（双门 / 对开门 / 法式多门 / 迷你单门）
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFridgePickerOpen(true)}
              className="rounded-xl px-4 py-2 text-xs font-extrabold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              立即选择我家冰箱型号
            </button>
          </div>
        )}

        {/* Remap Notice Banner */}
        {remapNotice && (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900">
            <span>✅ {remapNotice}</span>
            <button
              type="button"
              onClick={dismissRemapNotice}
              className="rounded-lg p-1 hover:bg-emerald-100"
              aria-label="关闭提示"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Persona-Specific Top Module */}
        {activeMode === 'elderly' && (
          <ElderlyVoiceBar
            onVoiceSearchQuery={setSearchQuery}
            onItemLocated={() => setMobileTab('scene')}
          />
        )}
        {activeMode === 'kids' && <KidsCheckInBar />}
        {activeMode === 'student' && (
          <StudentHubPanel onFocusIn3D={() => setMobileTab('scene')} />
        )}
        {activeMode === 'manager' && (
          <ManagerStatsBar onOpenRestockDrawer={() => setRestockOpen(true)} />
        )}

        {/* Core Workspace: Desktop 2-Column Split / Mobile Tab-Adaptive */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
          <div
            className={`lg:col-span-7 ${
              mobileTab === 'scene' ? 'block' : 'hidden lg:block'
            }`}
          >
            <PantryCanvas
              onOpenItemDetail={handleOpenItemFrom3D}
              onOpenFridgePicker={() => setFridgePickerOpen(true)}
              onJumpToInventoryMobile={() => setMobileTab('inventory')}
            />
          </div>

          <div
            className={`lg:col-span-5 ${
              mobileTab === 'inventory' ? 'block' : 'hidden lg:block'
            }`}
          >
            <InventoryPanel
              externalSearch={searchQuery}
              onExternalSearchChange={setSearchQuery}
              onOpenDetail={(id) => setDetailItemId(id)}
              onOpenKidsCheckIn={(id) => setKidsCheckInItemId(id)}
              onEditItem={openEditModal}
              onFocusIn3D={() => setMobileTab('scene')}
            />
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={mobileTab}
        onTabChange={(tab) => setMobileTab(tab)}
        onOpenRestock={() => setRestockOpen(true)}
        onOpenFridgePicker={() => setFridgePickerOpen(true)}
      />

      {/* Modals & Drawers */}
      <FridgeModelPickerModal
        open={fridgePickerOpen}
        onClose={() => setFridgePickerOpen(false)}
      />

      <KidsCheckInModal
        itemId={kidsCheckInItemId}
        onClose={() => setKidsCheckInItemId(null)}
      />

      <KidsExitMathModal
        targetMode={pendingModeExit}
        onCancel={() => setPendingModeExit(null)}
        onVerified={(nextMode) => {
          setUserMode(nextMode);
          setPendingModeExit(null);
        }}
      />

      <ItemDetailModal
        itemId={detailItemId}
        onClose={() => setDetailItemId(null)}
        onEdit={openEditModal}
        onOpenRestock={() => setRestockOpen(true)}
        onFocusIn3D={() => setMobileTab('scene')}
      />

      <ItemFormModal
        open={formOpen}
        editingItem={editingItem}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
      />

      <RestockDrawer
        open={restockOpen}
        onClose={() => setRestockOpen(false)}
      />

      {/* 3-Second Anti-Mistake Undo Toast */}
      <UndoToast />
    </div>
  );
}
