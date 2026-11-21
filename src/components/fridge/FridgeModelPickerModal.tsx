'use client';

import { useRef, useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  Search,
  Palette,
  Upload,
  Refrigerator,
  RotateCcw,
} from 'lucide-react';
import {
  BRAND_FRIDGE_CATALOG,
  FRIDGE_FINISHES,
  FRIDGE_FINISH_MAP,
  FRIDGE_MODEL_MAP,
  FRIDGE_MODELS,
} from '@/data/fridgeModels';
import { usePantryStore } from '@/store/usePantryStore';
import type { FridgeModelType } from '@/types/pantry';

interface FridgeModelPickerModalProps {
  open: boolean;
  onClose: () => void;
}

type PickerTab = 'presets' | 'customize' | 'upload';

function FridgeSilhouetteSvg({
  model,
  fillHex = '#E2E8F0',
}: {
  model: FridgeModelType;
  fillHex?: string;
}) {
  switch (model) {
    case 'top-freezer':
      return (
        <svg viewBox="0 0 64 88" className="h-14 w-11 shrink-0" fill="none">
          <rect x="8" y="4" width="48" height="80" rx="6" fill={fillHex} stroke="#475569" strokeWidth="2.5" />
          <line x1="8" y1="30" x2="56" y2="30" stroke="#475569" strokeWidth="2.5" />
          <rect x="14" y="14" width="4" height="10" rx="2" fill="#0F766E" />
          <rect x="14" y="38" width="4" height="22" rx="2" fill="#0F766E" />
        </svg>
      );
    case 'bottom-freezer':
      return (
        <svg viewBox="0 0 64 88" className="h-14 w-11 shrink-0" fill="none">
          <rect x="8" y="4" width="48" height="80" rx="6" fill={fillHex} stroke="#475569" strokeWidth="2.5" />
          <line x1="8" y1="58" x2="56" y2="58" stroke="#475569" strokeWidth="2.5" />
          <rect x="14" y="20" width="4" height="24" rx="2" fill="#0F766E" />
          <rect x="20" y="65" width="24" height="4" rx="2" fill="#2563EB" />
        </svg>
      );
    case 'side-by-side':
      return (
        <svg viewBox="0 0 76 88" className="h-14 w-12 shrink-0" fill="none">
          <rect x="6" y="4" width="64" height="80" rx="6" fill={fillHex} stroke="#475569" strokeWidth="2.5" />
          <line x1="34" y1="4" x2="34" y2="84" stroke="#475569" strokeWidth="2.5" />
          <rect x="27" y="28" width="3.5" height="26" rx="1.75" fill="#2563EB" />
          <rect x="38" y="28" width="3.5" height="26" rx="1.75" fill="#0F766E" />
        </svg>
      );
    case 'french-door':
      return (
        <svg viewBox="0 0 76 88" className="h-14 w-12 shrink-0" fill="none">
          <rect x="6" y="4" width="64" height="80" rx="6" fill={fillHex} stroke="#475569" strokeWidth="2.5" />
          <line x1="38" y1="4" x2="38" y2="52" stroke="#475569" strokeWidth="2.5" />
          <line x1="6" y1="52" x2="70" y2="52" stroke="#475569" strokeWidth="2.5" />
          <line x1="6" y1="68" x2="70" y2="68" stroke="#475569" strokeWidth="2" />
          <rect x="31" y="20" width="3.5" height="20" rx="1.75" fill="#0F766E" />
          <rect x="41.5" y="20" width="3.5" height="20" rx="1.75" fill="#0F766E" />
          <rect x="26" y="58" width="24" height="3.5" rx="1.75" fill="#2563EB" />
          <rect x="26" y="74" width="24" height="3.5" rx="1.75" fill="#2563EB" />
        </svg>
      );
    case 'mini-fridge':
      return (
        <svg viewBox="0 0 64 88" className="h-14 w-11 shrink-0" fill="none">
          <rect x="10" y="20" width="44" height="60" rx="7" fill={fillHex} stroke="#475569" strokeWidth="2.5" />
          <rect x="16" y="34" width="4" height="18" rx="2" fill="#4F46E5" />
          <rect x="24" y="28" width="20" height="8" rx="2" fill="#BAE6FD" />
        </svg>
      );
  }
}

export function FridgeModelPickerModal({
  open,
  onClose,
}: FridgeModelPickerModalProps) {
  const {
    fridgeModel,
    fridgeProfile,
    customGlbUrl,
    customGlbName,
    setFridgeModel,
    updateFridgeProfile,
    applyBrandFridgePreset,
    setCustomGlbModel,
    clearCustomGlbModel,
  } = usePantryStore();

  const [tab, setTab] = useState<PickerTab>('presets');
  const [brandQuery, setBrandQuery] = useState('');
  const glbInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const currentPreset = FRIDGE_MODEL_MAP[fridgeModel];
  const currentFinish =
    FRIDGE_FINISH_MAP[fridgeProfile.finishId] ?? FRIDGE_FINISH_MAP.silver;

  const filteredBrandCatalog = BRAND_FRIDGE_CATALOG.filter((item) => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return true;
    const structName = FRIDGE_MODEL_MAP[item.structure].name;
    return `${item.brand} ${item.modelCode} ${item.displayName} ${structName} ${item.capacityLabel}`
      .toLowerCase()
      .includes(q);
  });

  const handleGlbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setCustomGlbModel(blobUrl, file.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:rounded-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              <h2
                className="text-lg font-extrabold"
                style={{ color: 'var(--ink-primary)' }}
              >
                选择或自定义你的 3D 冰箱型号
              </h2>
            </div>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
              当前：{fridgeProfile.brand} {fridgeProfile.modelCode} ·{' '}
              {currentPreset.name}（{currentFinish.name}）
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-stone-100"
            aria-label="关闭冰箱型号选择器"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3 Mode Tabs */}
        <div
          className="flex gap-1 border-b px-5 py-2.5"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-canvas)',
          }}
        >
          {(
            [
              { id: 'presets', label: '品牌与门型库', icon: Refrigerator },
              { id: 'customize', label: '自定义配色与隔层', icon: Palette },
              { id: 'upload', label: '导入我的 3D 模型 (.glb)', icon: Upload },
            ] as { id: PickerTab; label: string; icon: typeof Refrigerator }[]
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition-colors sm:text-sm"
                style={
                  active
                    ? {
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-ink)',
                      }
                    : { color: 'var(--ink-secondary)' }
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'presets' && (
            <div className="space-y-5">
              {/* Section A: 5 Core 3D Structures */}
              <div>
                <h3 className="mb-2.5 text-xs font-extrabold uppercase tracking-wide text-stone-500">
                  1. 按自家冰箱门体结构一键重构 3D 模型
                </h3>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {FRIDGE_MODELS.map((preset) => {
                    const active = !customGlbUrl && fridgeModel === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setFridgeModel(preset.id);
                        }}
                        className="flex items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all hover:shadow-xs"
                        style={{
                          backgroundColor: active
                            ? 'var(--accent-soft)'
                            : 'var(--bg-surface)',
                          borderColor: active
                            ? 'var(--accent)'
                            : 'var(--border-subtle)',
                        }}
                      >
                        <FridgeSilhouetteSvg
                          model={preset.id}
                          fillHex={currentFinish.swatchHex}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="truncate text-sm font-extrabold"
                              style={{ color: 'var(--ink-primary)' }}
                            >
                              {preset.name}
                            </span>
                            {active && (
                              <span
                                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                                style={{ backgroundColor: 'var(--accent)' }}
                              >
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[11px] font-semibold text-teal-700">
                            {preset.recommendedFor}
                          </div>
                          <div className="mt-1 text-[11px] text-stone-500">
                            {preset.compartments.length} 个交互隔层
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section B: Searchable Real-World Brand Catalog */}
              <div>
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-stone-500">
                    2. 搜索并匹配常见品牌型号（自动配好结构 + 外观色）
                  </h3>
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={brandQuery}
                      onChange={(e) => setBrandQuery(e.target.value)}
                      placeholder="搜 Samsung / LG / Panasonic / Sharp…"
                      className="w-full rounded-xl border py-1.5 pl-8 pr-3 text-xs outline-none"
                      style={{ borderColor: 'var(--border-strong)' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {filteredBrandCatalog.map((item) => {
                    const finish = FRIDGE_FINISH_MAP[item.finishId];
                    const isMatched =
                      !customGlbUrl &&
                      fridgeModel === item.structure &&
                      fridgeProfile.brand === item.brand &&
                      fridgeProfile.modelCode === item.modelCode;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          applyBrandFridgePreset(item);
                          onClose();
                        }}
                        className="flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all hover:border-teal-600"
                        style={{
                          backgroundColor: isMatched
                            ? 'var(--accent-soft)'
                            : 'var(--bg-surface)',
                          borderColor: isMatched
                            ? 'var(--accent)'
                            : 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="h-8 w-8 shrink-0 rounded-xl border border-stone-300 shadow-inner"
                            style={{ backgroundColor: finish.swatchHex }}
                            title={finish.name}
                          />
                          <div className="min-w-0">
                            <div className="truncate text-xs font-extrabold text-stone-900">
                              {item.displayName}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                              <span>{item.capacityLabel}</span>
                              <span>· {finish.name}</span>
                            </div>
                          </div>
                        </div>

                        {item.popularTag && (
                          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {item.popularTag}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'customize' && (
            <div className="space-y-5">
              {/* Brand & Model Code */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-700">
                    自家冰箱品牌
                  </label>
                  <input
                    type="text"
                    value={fridgeProfile.brand}
                    onChange={(e) =>
                      updateFridgeProfile({ brand: e.target.value })
                    }
                    placeholder="例如：Samsung / LG / Panasonic / 我家的冰箱"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--border-strong)' }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-700">
                    型号代号 / 昵称
                  </label>
                  <input
                    type="text"
                    value={fridgeProfile.modelCode}
                    onChange={(e) =>
                      updateFridgeProfile({ modelCode: e.target.value })
                    }
                    placeholder="例如：RT38 / 厨房大冰箱"
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--border-strong)' }}
                  />
                </div>
              </div>

              {/* 6 Metallic/Matte 3D Finish Colors */}
              <div>
                <label className="mb-2 block text-xs font-bold text-stone-700">
                  选择 3D 冰箱外观材质颜色（实时生效）
                </label>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                  {FRIDGE_FINISHES.map((finish) => {
                    const active = fridgeProfile.finishId === finish.id;
                    return (
                      <button
                        key={finish.id}
                        type="button"
                        onClick={() =>
                          updateFridgeProfile({ finishId: finish.id })
                        }
                        className="flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 transition-all"
                        style={{
                          borderColor: active
                            ? 'var(--accent)'
                            : 'var(--border-subtle)',
                          backgroundColor: active
                            ? 'var(--accent-soft)'
                            : 'var(--bg-surface)',
                        }}
                      >
                        <span
                          className="h-9 w-9 rounded-full border border-stone-300 shadow-inner"
                          style={{ backgroundColor: finish.swatchHex }}
                        />
                        <span className="text-xs font-bold text-stone-800">
                          {finish.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rename Compartments */}
              <div>
                <label className="mb-2 block text-xs font-bold text-stone-700">
                  自定义「{currentPreset.name}」各隔层名称（留空则使用默认名）
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {currentPreset.compartments.map((comp) => (
                    <div key={comp.id} className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-xs font-semibold text-stone-500">
                        {comp.shortLabel}
                      </span>
                      <input
                        type="text"
                        value={fridgeProfile.customZoneLabels?.[comp.id] ?? ''}
                        onChange={(e) =>
                          updateFridgeProfile({
                            customZoneLabels: { [comp.id]: e.target.value },
                          })
                        }
                        placeholder={`如：${comp.shortLabel} / 宝宝辅食层`}
                        className="flex-1 rounded-xl border px-3 py-1.5 text-xs"
                        style={{ borderColor: 'var(--border-strong)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-4">
              <div
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center"
                style={{
                  borderColor: 'var(--border-strong)',
                  backgroundColor: 'var(--bg-canvas)',
                }}
              >
                <Upload className="h-10 w-10" style={{ color: 'var(--accent)' }} />
                <h3 className="mt-3 text-base font-extrabold text-stone-900">
                  上传你自己的冰箱 3D 模型文件 (.glb / .gltf)
                </h3>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-stone-600">
                  如果你从 Sketchfab、品牌官网或手机 3D 扫描 App 导出了自家冰箱的
                  <code className="mx-1 rounded bg-stone-200 px-1">.glb</code>
                  文件，可以直接载入场景并自动居中缩放预览。
                </p>

                <input
                  ref={glbInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleGlbFileChange}
                  className="hidden"
                />

                <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => glbInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <Upload className="h-4 w-4" />
                    <span>选择本地 .glb / .gltf 文件</span>
                  </button>

                  {customGlbUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        clearCustomGlbModel();
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>切回内置交互式 3D 冰箱</span>
                    </button>
                  )}
                </div>

                {customGlbName && (
                  <p className="mt-3 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    当前已加载外部模型：{customGlbName}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="safe-bottom flex items-center justify-end gap-2 border-t px-5 py-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-sm font-extrabold text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            完成并返回 3D 视图
          </button>
        </div>
      </div>
    </div>
  );
}
