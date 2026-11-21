'use client';

import { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  ShoppingCart,
  Edit3,
  Trash2,
  Crosshair,
  AlertTriangle,
} from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import { CATEGORY_LABELS, getCompartmentMeta } from '@/data/compartments';
import { getItemHealthStatus } from '@/lib/inventoryUtils';
import { PriceCompareGrid } from '@/components/restock/PriceCompareGrid';
import type { InventoryItem } from '@/types/pantry';

interface ItemDetailModalProps {
  itemId: string | null;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onOpenRestock: () => void;
  onFocusIn3D?: () => void;
}

export function ItemDetailModal({
  itemId,
  onClose,
  onEdit,
  onOpenRestock,
  onFocusIn3D,
}: ItemDetailModalProps) {
  const { userMode, items, focusItemFromList, addToRestock, deleteItem } =
    usePantryStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!itemId) return null;

  const item = items.find((i) => i.id === itemId);
  if (!item) return null;

  const health = getItemHealthStatus(item);
  const loc = getCompartmentMeta(item.compartmentId);
  const isElderly = userMode === 'elderly';
  const isKids = userMode === 'kids';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border shadow-2xl sm:rounded-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 border-b p-5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3.5">
            {item.photoDataUrl ? (
              <img
                src={item.photoDataUrl}
                alt={item.name}
                className="h-14 w-14 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-3xl">
                {item.emoji}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className={`font-extrabold ${isElderly ? 'text-2xl' : 'text-lg'}`}
                  style={{ color: 'var(--ink-primary)' }}
                >
                  {item.name}
                </h2>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                    health.color === 'red'
                      ? 'bg-red-100 text-red-700'
                      : health.color === 'yellow'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {health.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {loc?.label ?? item.compartmentId}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> 保质期至 {item.expiryDate}
                </span>
                <span>{CATEGORY_LABELS[item.category] ?? item.category}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmingDelete(false);
              onClose();
            }}
            className="rounded-lg p-2 hover:bg-stone-100"
            aria-label="关闭详情"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">
          <div
            className="grid grid-cols-3 gap-3 rounded-xl p-3.5"
            style={{ backgroundColor: 'var(--bg-canvas)' }}
          >
            <div>
              <div className="text-[11px] text-stone-500">当前库存</div>
              <div className="font-price text-lg font-extrabold text-stone-900">
                {item.quantity} {item.unit}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-stone-500">预警阈值</div>
              <div className="font-price text-lg font-extrabold text-stone-700">
                ≤ {item.minStock} {item.unit}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-stone-500">备注</div>
              <div className="truncate text-xs font-medium text-stone-700">
                {item.notes || '无备注'}
              </div>
            </div>
          </div>

          {/* Hide prices in Kids mode */}
          {!isKids && (
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-sm font-extrabold" style={{ color: 'var(--ink-primary)' }}>
                  本地渠道多平台比价（按价格从低到高）
                </h3>
                <span className="text-xs font-semibold text-emerald-700">
                  自动标注单价与全网最低价
                </span>
              </div>
              <PriceCompareGrid prices={item.prices} />
            </div>
          )}

          {/* Elderly two-step delete confirmation inside modal */}
          {confirmingDelete && (
            <div className="rounded-2xl border-2 border-red-600 bg-red-50 p-4">
              <div className="flex items-center gap-2 font-extrabold text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span>确认删除「{item.name}」吗？</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="min-h-[52px] flex-1 rounded-xl border-2 border-gray-800 bg-white text-sm font-bold"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteItem(item.id);
                    setConfirmingDelete(false);
                    onClose();
                  }}
                  className="min-h-[52px] flex-1 rounded-xl bg-red-700 text-sm font-extrabold text-white"
                >
                  确认删除
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="safe-bottom flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3.5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {!isKids ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onEdit(item);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold hover:bg-stone-50"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                <Edit3 className="h-3.5 w-3.5" />
                编辑
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isElderly) {
                    setConfirmingDelete(true);
                  } else {
                    deleteItem(item.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除
              </button>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                focusItemFromList(item.id);
                onFocusIn3D?.();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold hover:bg-stone-50"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <Crosshair className="h-3.5 w-3.5" />
              3D 定位
            </button>

            {!isKids && (
              <button
                type="button"
                onClick={() => {
                  addToRestock(item.id, 2);
                  onClose();
                  onOpenRestock();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                按最低价加入补货
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
