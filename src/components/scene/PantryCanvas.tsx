'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import {
  DoorClosed,
  DoorOpen,
  Eye,
  RotateCcw,
  Refrigerator,
  Archive,
  SlidersHorizontal,
} from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import { FRIDGE_MODELS } from '@/data/fridgeModels';
import { getCompartmentsForUnit } from '@/data/compartments';
import { getCompartmentWorstColor } from '@/lib/inventoryUtils';
import { DynamicFridge3D } from './DynamicFridge3D';
import { CustomGlbFridge } from './CustomGlbFridge';
import { Cabinet3D } from './Cabinet3D';
import { CameraRig } from './CameraRig';
import type { DoorMode } from '@/types/pantry';

interface PantryCanvasProps {
  onOpenItemDetail: (itemId: string) => void;
  onOpenFridgePicker: () => void;
  onJumpToInventoryMobile?: () => void;
}

const DOOR_OPTIONS: { id: DoorMode; label: string; icon: typeof DoorOpen }[] = [
  { id: 'closed', label: '关门', icon: DoorClosed },
  { id: 'open', label: '开门', icon: DoorOpen },
  { id: 'transparent', label: '透明', icon: Eye },
];

export function PantryCanvas({
  onOpenItemDetail,
  onOpenFridgePicker,
  onJumpToInventoryMobile,
}: PantryCanvasProps) {
  const {
    userMode,
    fridgeModel,
    fridgeProfile,
    customGlbUrl,
    customGlbName,
    activeUnit,
    doorMode,
    items,
    selectedCompartmentId,
    highlightedCompartmentId,
    selectedItemId,
    setFridgeModel,
    clearCustomGlbModel,
    setActiveUnit,
    setDoorMode,
    selectCompartmentFrom3D,
    focusItemFromList,
    clearSelection,
  } = usePantryStore();

  const [resetCounter, setResetCounter] = useState(0);

  const unitCompartments = getCompartmentsForUnit(activeUnit, fridgeModel);
  const unitItems = items.filter((i) => i.unitType === activeUnit);

  const isElderly = userMode === 'elderly';
  const isKids = userMode === 'kids';

  return (
    <section className="pantry-surface flex flex-col overflow-hidden">
      {/* Top 3D Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2.5 sm:px-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {/* Switch Fridge / Cabinet */}
        <div className="pantry-subtle inline-flex p-1">
          <button
            type="button"
            onClick={() => setActiveUnit('fridge')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${
              isElderly ? 'min-h-[48px] text-lg' : 'text-xs sm:text-sm'
            }`}
            style={
              activeUnit === 'fridge'
                ? {
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--ink-primary)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  }
                : { color: 'var(--ink-secondary)' }
            }
          >
            <Refrigerator className="h-4 w-4" />
            <span>{isKids ? '🧊 魔法冰箱' : '我的 3D 冰箱'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveUnit('cabinet')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${
              isElderly ? 'min-h-[48px] text-lg' : 'text-xs sm:text-sm'
            }`}
            style={
              activeUnit === 'cabinet'
                ? {
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--ink-primary)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  }
                : { color: 'var(--ink-secondary)' }
            }
          >
            <Archive className="h-4 w-4" />
            <span>{isKids ? '🚪 零食橱柜' : '3D 厨房橱柜'}</span>
          </button>
        </div>

        {/* Door mode & Reset */}
        <div className="flex items-center gap-1.5">
          {!customGlbUrl && (
            <div className="pantry-subtle inline-flex p-1">
              {DOOR_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = doorMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDoorMode(opt.id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-colors ${
                      isElderly ? 'min-h-[44px] text-base' : 'text-xs'
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
                    <Icon className="h-3.5 w-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              clearSelection();
              setResetCounter((c) => c + 1);
            }}
            title="重置 3D 视角"
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold hover:opacity-80"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--ink-secondary)',
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inline 1-Click Fridge Model Quick-Switcher Strip */}
      {activeUnit === 'fridge' && !isKids && (
        <div
          className="flex items-center gap-1.5 overflow-x-auto border-b px-3.5 py-2 sm:px-4"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-canvas)',
          }}
        >
          <span className="shrink-0 text-[11px] font-extrabold text-stone-500">
            冰箱型号：
          </span>
          {FRIDGE_MODELS.map((preset) => {
            const active = !customGlbUrl && fridgeModel === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setFridgeModel(preset.id)}
                className={`shrink-0 rounded-lg border px-2.5 py-1 font-bold transition-colors ${
                  isElderly ? 'min-h-[44px] text-sm' : 'text-xs'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--accent)',
                        borderColor: 'var(--accent)',
                        color: 'var(--accent-ink)',
                      }
                    : {
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-secondary)',
                      }
                }
              >
                {preset.name}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenFridgePicker}
            className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 font-extrabold transition-opacity hover:opacity-85 ${
              isElderly ? 'min-h-[44px] text-sm' : 'text-xs'
            }`}
            style={{
              backgroundColor: 'var(--accent-soft)',
              borderColor: 'var(--accent)',
              color: 'var(--ink-primary)',
            }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
            <span>选品牌 / 颜色 / 传3D</span>
          </button>
        </div>
      )}

      {/* Interactive 3D WebGL Canvas */}
      <div
        className="relative h-[340px] w-full touch-none sm:h-[430px] lg:h-[500px]"
        style={{
          background:
            userMode === 'kids'
              ? 'radial-gradient(circle at 50% 35%, #fffef5 0%, #fef08a 100%)'
              : userMode === 'elderly'
                ? 'radial-gradient(circle at 50% 35%, #ffffff 0%, #ede9dd 100%)'
                : userMode === 'student'
                  ? 'radial-gradient(circle at 50% 30%, #f8fafc 0%, #e0e7ff 100%)'
                  : 'radial-gradient(circle at 50% 30%, #f9fafb 0%, #e5e7eb 100%)',
        }}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [3.2, 1.35, 5.1], fov: 42 }}
          onPointerMissed={() => clearSelection()}
        >
          <ambientLight intensity={0.82} />
          <directionalLight
            position={[5, 7, 6]}
            intensity={1.15}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-4, 3, -3]} intensity={0.45} />

          {activeUnit === 'fridge' ? (
            customGlbUrl ? (
              <CustomGlbFridge
                url={customGlbUrl}
                fileName={customGlbName ?? 'custom.glb'}
                onErrorFallback={clearCustomGlbModel}
              />
            ) : (
              <DynamicFridge3D
                model={fridgeModel}
                profile={fridgeProfile}
                items={unitItems}
                doorMode={doorMode}
                selectedCompartmentId={selectedCompartmentId}
                highlightedCompartmentId={highlightedCompartmentId}
                selectedItemId={selectedItemId}
                onSelectCompartment={selectCompartmentFrom3D}
                onSelectItem={(id) => {
                  focusItemFromList(id);
                  onOpenItemDetail(id);
                }}
                onToggleDoor={() =>
                  setDoorMode(doorMode === 'closed' ? 'open' : 'closed')
                }
              />
            )
          ) : (
            <Cabinet3D
              items={unitItems}
              doorMode={doorMode}
              selectedCompartmentId={selectedCompartmentId}
              highlightedCompartmentId={highlightedCompartmentId}
              selectedItemId={selectedItemId}
              onSelectCompartment={selectCompartmentFrom3D}
              onSelectItem={(id) => {
                focusItemFromList(id);
                onOpenItemDetail(id);
              }}
              onToggleDoor={() =>
                setDoorMode(doorMode === 'closed' ? 'open' : 'closed')
              }
            />
          )}

          <ContactShadows
            position={[0, -1.9, 0]}
            opacity={0.3}
            scale={8}
            blur={2.4}
            far={4.2}
          />

          <CameraRig
            activeUnit={activeUnit}
            fridgeModel={fridgeModel}
            highlightedCompartmentId={highlightedCompartmentId}
            resetCounter={resetCounter}
          />
        </Canvas>

        {/* Top-left gesture hint or custom GLB badge */}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <div
            className="pointer-events-none rounded-lg border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(255,255,255,0.88)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--ink-secondary)',
            }}
          >
            单指旋转 · 双指缩放 · 点隔层筛选
          </div>

          {activeUnit === 'fridge' && customGlbUrl && (
            <button
              type="button"
              onClick={clearCustomGlbModel}
              className="rounded-lg bg-teal-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-teal-800"
            >
              外部模型：{customGlbName} · 切回内置交互
            </button>
          )}
        </div>

        {/* Bottom-left color legend */}
        <div
          className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--ink-primary)',
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
            新鲜
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            3天内临期
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
            过期 / 缺货
          </span>
        </div>

        {/* Mobile Quick Jump Pill when a 3D compartment is selected */}
        {selectedCompartmentId && onJumpToInventoryMobile && (
          <button
            type="button"
            onClick={onJumpToInventoryMobile}
            className="absolute bottom-3 right-3 rounded-full px-3.5 py-2 text-xs font-extrabold text-white shadow-lg transition-transform active:scale-95 lg:hidden"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            查看该隔层 (
            {items.filter((i) => i.compartmentId === selectedCompartmentId).length}
            ) →
          </button>
        )}
      </div>

      {/* Quick Compartment Selector Pills */}
      <div
        className="flex flex-wrap items-center gap-1.5 border-t px-3.5 py-2.5 sm:px-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <button
          type="button"
          onClick={() => selectCompartmentFrom3D(null)}
          className={`rounded-xl border px-3 py-1.5 font-bold transition-colors ${
            isElderly ? 'min-h-[48px] text-base' : 'text-xs'
          }`}
          style={
            selectedCompartmentId === null
              ? {
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  borderColor: 'var(--accent)',
                }
              : {
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-secondary)',
                }
          }
        >
          全部隔层 ({unitItems.length})
        </button>

        {unitCompartments.map((comp) => {
          const compItems = items.filter((i) => i.compartmentId === comp.id);
          const worst = getCompartmentWorstColor(compItems);
          const active =
            selectedCompartmentId === comp.id ||
            highlightedCompartmentId === comp.id;
          const dotColor =
            worst === 'red'
              ? '#dc2626'
              : worst === 'yellow'
                ? '#eab308'
                : worst === 'green'
                  ? '#16a34a'
                  : '#9ca3af';

          const displayLabel =
            fridgeProfile.customZoneLabels?.[comp.id]?.trim() || comp.shortLabel;

          return (
            <button
              key={comp.id}
              type="button"
              onClick={() => selectCompartmentFrom3D(comp.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-semibold transition-colors ${
                isElderly ? 'min-h-[48px] text-base' : 'text-xs'
              }`}
              style={
                active
                  ? {
                      backgroundColor: 'var(--accent-soft)',
                      borderColor: 'var(--accent)',
                      color: 'var(--ink-primary)',
                    }
                  : {
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-secondary)',
                    }
              }
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: dotColor }}
              />
              <span>{displayLabel}</span>
              <span className="tabular-nums opacity-70">{compItems.length}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
