'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Mic, Sparkles, X } from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import {
  CATEGORY_LABELS,
  getCompartmentMeta,
  getCompartmentsForUnit,
} from '@/data/compartments';
import { remapCompartmentForModel } from '@/data/fridgeModels';
import { QUICK_INGREDIENT_PRESETS } from '@/data/quickPresets';
import { buildDefaultQuotesForNewItem } from '@/lib/priceUtils';
import { startChineseVoiceRecognition } from '@/lib/speech';
import type {
  CompartmentId,
  InventoryItem,
  ItemCategory,
  ItemUnit,
  QuickIngredientPreset,
  SemanticZoneRole,
  StorageUnitType,
} from '@/types/pantry';

interface ItemFormModalProps {
  open: boolean;
  editingItem: InventoryItem | null;
  onClose: () => void;
}

const EMOJI_PRESETS = [
  '🥛', '🥚', '🍎', '🥬', '🍗', '🍦', '🥟', '🍜', '🍾', '🍚', '🥜', '🍪', '🧃', '🍞', '🧀', '🍌',
];

const UNITS: ItemUnit[] = ['盒', '瓶', '袋', '个', '颗', '罐', '包', '支', '把'];

function futureDateStr(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export function ItemFormModal({
  open,
  editingItem,
  onClose,
}: ItemFormModalProps) {
  const { addItem, updateItem, activeUnit, fridgeModel } = usePantryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🥛');
  const [category, setCategory] = useState<ItemCategory>('dairy');
  const [quantity, setQuantity] = useState(2);
  const [minStock, setMinStock] = useState(1);
  const [unit, setUnit] = useState<ItemUnit>('盒');
  const [expiryDate, setExpiryDate] = useState(futureDateStr(7));
  const [unitType, setUnitType] = useState<StorageUnitType>(activeUnit);
  const [compartmentId, setCompartmentId] = useState<CompartmentId>('');
  const [preferredRole, setPreferredRole] = useState<SemanticZoneRole>('fridge-middle');
  const [refPrice, setRefPrice] = useState('8.90');
  const [notes, setNotes] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [voiceListening, setVoiceListening] = useState(false);
  const [scanHint, setScanHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setScanHint(null);
    if (editingItem) {
      setName(editingItem.name);
      setEmoji(editingItem.emoji);
      setCategory(editingItem.category);
      setQuantity(editingItem.quantity);
      setMinStock(editingItem.minStock);
      setUnit(editingItem.unit);
      setExpiryDate(editingItem.expiryDate);
      setUnitType(editingItem.unitType);
      setCompartmentId(editingItem.compartmentId);
      setPreferredRole(editingItem.preferredRole);
      setRefPrice((editingItem.prices[0]?.price ?? 8.9).toFixed(2));
      setNotes(editingItem.notes ?? '');
      setPhotoDataUrl(editingItem.photoDataUrl);
    } else {
      const defaultUnit = activeUnit;
      const comps = getCompartmentsForUnit(defaultUnit, fridgeModel);
      const firstComp = comps[1] ?? comps[0];
      setName('');
      setEmoji('🥛');
      setCategory('dairy');
      setQuantity(2);
      setMinStock(1);
      setUnit('盒');
      setExpiryDate(futureDateStr(7));
      setUnitType(defaultUnit);
      setCompartmentId(firstComp.id);
      setPreferredRole(firstComp.role);
      setRefPrice('8.90');
      setNotes('');
      setPhotoDataUrl(undefined);
    }
  }, [open, editingItem, activeUnit, fridgeModel]);

  if (!open) return null;

  const compartments = getCompartmentsForUnit(unitType, fridgeModel);

  const handleUnitTypeChange = (nextUnit: StorageUnitType) => {
    setUnitType(nextUnit);
    const first = getCompartmentsForUnit(nextUnit, fridgeModel)[0];
    if (first) {
      setCompartmentId(first.id);
      setPreferredRole(first.role);
    }
  };

  const applyQuickPreset = (preset: QuickIngredientPreset) => {
    setName(preset.name);
    setEmoji(preset.emoji);
    setCategory(preset.category);
    setUnit(preset.defaultUnit);
    setQuantity(preset.defaultQty);
    setExpiryDate(futureDateStr(preset.defaultShelfLifeDays));
    setUnitType(preset.unitType);
    setPreferredRole(preset.preferredRole);
    setRefPrice(preset.refPriceRM.toFixed(2));
    if (preset.unitType === 'fridge') {
      setCompartmentId(remapCompartmentForModel(preset.preferredRole, fridgeModel));
    } else {
      setCompartmentId(preset.preferredRole);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : undefined;
      setPhotoDataUrl(result);
      // Infer friendly item name from file name or offer instant scan fill
      const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
      if (!name) {
        setName(base.length > 2 && !/^img|pxl|dsc|photo/i.test(base) ? base : '扫码识别商品');
      }
      setScanHint('已捕获后置摄像头照片，可确认名称与保质期后一键入库。');
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceFill = () => {
    if (voiceListening) return;
    setVoiceListening(true);
    startChineseVoiceRecognition({
      onTranscript: (text) => {
        setName(text.replace(/[。，！？]/g, '').trim());
        setVoiceListening(false);
      },
      onError: () => setVoiceListening(false),
      onEnd: () => setVoiceListening(false),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const parsedPrice = Number.parseFloat(refPrice);
    const safePrice = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 8.9;
    const selectedCompMeta = getCompartmentMeta(compartmentId);
    const resolvedRole = selectedCompMeta?.role ?? preferredRole;

    if (editingItem) {
      updateItem(editingItem.id, {
        name: trimmed,
        emoji,
        category,
        quantity: Math.max(0, quantity),
        minStock: Math.max(0, minStock),
        unit,
        expiryDate,
        unitType,
        compartmentId,
        preferredRole: resolvedRole,
        photoDataUrl,
        notes: notes.trim() || undefined,
      });
    } else {
      addItem({
        name: trimmed,
        emoji,
        category,
        quantity: Math.max(0, quantity),
        minStock: Math.max(0, minStock),
        unit,
        expiryDate,
        unitType,
        compartmentId,
        preferredRole: resolvedRole,
        prices: buildDefaultQuotesForNewItem(safePrice),
        photoDataUrl,
        notes: notes.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border shadow-2xl sm:rounded-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <h2 className="text-base font-extrabold" style={{ color: 'var(--ink-primary)' }}>
            {editingItem ? '编辑物品信息' : '极速入库 · 放入 3D 冰箱/橱柜'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-stone-100"
            aria-label="关闭表单"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Quick Entry Modes: Camera Scan + Voice + Common Presets */}
          {!editingItem && (
            <div className="space-y-3 rounded-2xl border p-3.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border bg-white px-3 py-2.5 text-xs font-extrabold text-gray-800 shadow-xs hover:bg-gray-50"
                  style={{ borderColor: 'var(--border-strong)' }}
                >
                  <Camera className="h-4 w-4 text-teal-700" />
                  <span>拍照 / 扫码录入</span>
                </button>

                <button
                  type="button"
                  onClick={handleVoiceFill}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border bg-white px-3 py-2.5 text-xs font-extrabold text-gray-800 shadow-xs hover:bg-gray-50"
                  style={{ borderColor: 'var(--border-strong)' }}
                >
                  <Mic className={`h-4 w-4 ${voiceListening ? 'animate-pulse text-red-600' : 'text-blue-600'}`} />
                  <span>{voiceListening ? '正在听您说…' : '语音说出名称'}</span>
                </button>
              </div>

              {photoDataUrl && (
                <div className="flex items-center gap-3 rounded-xl bg-white p-2">
                  <img
                    src={photoDataUrl}
                    alt="已拍摄商品"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="text-xs font-medium text-teal-800">
                    {scanHint ?? '已关联商品照片'}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-gray-600">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>点一下常见食材（自动填图标、推荐位置与保质期）：</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_INGREDIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyQuickPreset(preset)}
                      className="rounded-full border bg-white px-2.5 py-1 text-xs font-bold text-gray-800 transition-colors hover:border-teal-600 hover:bg-teal-50"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      {preset.emoji} {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              物品名称 *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：鲜牛奶、鸡胸肉、生抽酱油"
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2"
              style={{ borderColor: 'var(--border-strong)' }}
            />
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              物品图标 Emoji
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_PRESETS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition-transform ${
                    emoji === em
                      ? 'scale-105 border-teal-700 bg-teal-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Qty, Unit, MinStock */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">数量</label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-strong)' }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">单位</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ItemUnit)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">低库存提醒</label>
              <input
                type="number"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-strong)' }}
              />
            </div>
          </div>

          {/* Category & Expiry */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                过期日期 *
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-strong)' }}
              />
            </div>
          </div>

          {/* Storage Unit & Dynamic Compartment */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                存放设备
              </label>
              <select
                value={unitType}
                onChange={(e) =>
                  handleUnitTypeChange(e.target.value as StorageUnitType)
                }
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                <option value="fridge">我的 3D 冰箱</option>
                <option value="cabinet">3D 厨房橱柜</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                具体隔层
              </label>
              <select
                value={compartmentId}
                onChange={(e) => {
                  const id = e.target.value;
                  setCompartmentId(id);
                  const m = getCompartmentMeta(id);
                  if (m) setPreferredRole(m.role);
                }}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                {compartments.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference Price */}
          {!editingItem && (
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                参考市场价（RM，自动生成 99 Speedmart / Lotus&apos;s / AEON / Shopee 比价）
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={refPrice}
                onChange={(e) => setRefPrice(e.target.value)}
                className="font-price w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border-strong)' }}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">备注</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：开封后请 3 天内喝完"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border-strong)' }}
            />
          </div>

          <div className="safe-bottom flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2.5 text-sm font-bold"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-xl px-5 py-2.5 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {editingItem ? '保存修改' : '确认放入 3D 空间'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
