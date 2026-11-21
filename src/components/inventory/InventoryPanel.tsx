'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Search,
  MapPin,
  Plus,
  Minus,
  ShoppingCart,
  Tag,
  X,
  Edit3,
  Check,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import { CATEGORY_LABELS, getCompartmentMeta } from '@/data/compartments';
import { getItemHealthStatus } from '@/lib/inventoryUtils';
import { formatRM, getLowestPriceQuote } from '@/lib/priceUtils';
import type { InventoryItem, ItemCategory } from '@/types/pantry';

interface InventoryPanelProps {
  externalSearch: string;
  onExternalSearchChange: (value: string) => void;
  onOpenDetail: (itemId: string) => void;
  onOpenKidsCheckIn: (itemId: string) => void;
  onEditItem: (item: InventoryItem) => void;
  onFocusIn3D?: () => void;
}

type StatusFilter = 'all' | 'alert' | 'expiring' | 'fresh';

function SwipeableStudentRow({
  children,
  onSwipeConsume,
}: {
  children: React.ReactNode;
  onSwipeConsume: () => void;
}) {
  const startXRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const [offsetX, setOffsetX] = useState(0);

  const begin = (clientX: number) => {
    startXRef.current = clientX;
    draggingRef.current = true;
  };

  const move = (clientX: number) => {
    if (!draggingRef.current || startXRef.current === null) return;
    const dx = clientX - startXRef.current;
    if (dx < -8) {
      setOffsetX(Math.max(-96, dx));
    }
  };

  const end = () => {
    if (offsetX <= -60) {
      onSwipeConsume();
    }
    setOffsetX(0);
    startXRef.current = null;
    draggingRef.current = false;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Revealed swipe action background */}
      <div className="absolute inset-y-0 right-0 flex w-28 items-center justify-end bg-indigo-600 pr-4 text-xs font-extrabold text-white">
        松开消耗 -1
      </div>
      <div
        onTouchStart={(e) => begin(e.touches[0]?.clientX ?? 0)}
        onTouchMove={(e) => move(e.touches[0]?.clientX ?? 0)}
        onTouchEnd={end}
        onMouseDown={(e) => begin(e.clientX)}
        onMouseMove={(e) => move(e.clientX)}
        onMouseUp={end}
        onMouseLeave={end}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: offsetX === 0 ? 'transform 0.2s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function InventoryPanel({
  externalSearch,
  onExternalSearchChange,
  onOpenDetail,
  onOpenKidsCheckIn,
  onEditItem,
  onFocusIn3D,
}: InventoryPanelProps) {
  const {
    userMode,
    items,
    selectedCompartmentId,
    selectedItemId,
    batchEditMode,
    batchSelectedIds,
    selectCompartmentFrom3D,
    focusItemFromList,
    adjustQuantity,
    deleteItem,
    addToRestock,
    toggleBatchSelectItem,
  } = usePantryStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'all'>('all');
  const [elderlyConfirmDelete, setElderlyConfirmDelete] =
    useState<InventoryItem | null>(null);

  const isElderly = userMode === 'elderly';
  const isKids = userMode === 'kids';
  const isStudent = userMode === 'student';
  const isManager = userMode === 'manager';

  const filteredItems = useMemo(() => {
    const q = externalSearch.trim().toLowerCase();
    return items
      .filter((item) => {
        if (selectedCompartmentId && item.compartmentId !== selectedCompartmentId) {
          return false;
        }
        if (categoryFilter !== 'all' && item.category !== categoryFilter) {
          return false;
        }
        if (q) {
          const compLabel = getCompartmentMeta(item.compartmentId)?.label ?? '';
          const matchText = `${item.name} ${compLabel} ${item.notes ?? ''}`.toLowerCase();
          if (!matchText.includes(q)) return false;
        }
        const health = getItemHealthStatus(item);
        if (statusFilter === 'alert') return health.color === 'red';
        if (statusFilter === 'expiring') return health.color === 'yellow';
        if (statusFilter === 'fresh') return health.color === 'green';
        return true;
      })
      .sort((a, b) => {
        const order = { red: 0, yellow: 1, green: 2 };
        return (
          order[getItemHealthStatus(a).color] - order[getItemHealthStatus(b).color]
        );
      });
  }, [items, selectedCompartmentId, externalSearch, statusFilter, categoryFilter]);

  const activeCompartmentMeta = selectedCompartmentId
    ? getCompartmentMeta(selectedCompartmentId)
    : undefined;

  return (
    <section className="pantry-surface flex flex-col overflow-hidden">
      {/* Header & Search */}
      <div
        className="space-y-3 border-b p-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              className={`font-extrabold ${isElderly ? 'text-2xl' : 'text-base'}`}
              style={{ color: 'var(--ink-primary)' }}
            >
              {activeCompartmentMeta
                ? activeCompartmentMeta.label
                : isKids
                  ? '🧺 点大图标打卡拿取/放回'
                  : '家庭库存清单'}
            </h2>
            <p
              className={isElderly ? 'mt-0.5 text-base font-semibold' : 'text-xs'}
              style={{ color: 'var(--ink-muted)' }}
            >
              {isStudent
                ? '点击高亮 3D 位置 · 手机端列表向左滑动可快速消耗 (-1)'
                : '点击任意物品，3D 冰箱/橱柜会自动平滑聚焦并闪烁对应隔层'}
            </p>
          </div>

          {activeCompartmentMeta && (
            <button
              type="button"
              onClick={() => selectCompartmentFrom3D(null)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-bold hover:opacity-80 ${
                isElderly ? 'min-h-[48px] text-base' : 'text-xs'
              }`}
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--accent)',
                color: 'var(--ink-primary)',
              }}
            >
              <span>筛选：{activeCompartmentMeta.shortLabel}</span>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--ink-muted)' }}
          />
          <input
            type="text"
            value={externalSearch}
            onChange={(e) => onExternalSearchChange(e.target.value)}
            placeholder={
              isElderly
                ? '输入要找的食物名称（例如：酱油、牛奶）'
                : '搜索物品、隔层位置或备注…'
            }
            className={`w-full rounded-xl border py-2.5 pl-10 pr-9 outline-none transition-colors focus:ring-2 ${
              isElderly ? 'min-h-[56px] text-xl font-bold' : 'text-sm'
            }`}
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--ink-primary)',
            }}
          />
          {externalSearch && (
            <button
              type="button"
              onClick={() => onExternalSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 hover:bg-stone-200"
              aria-label="清空搜索"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        {!isKids && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `全部 (${items.length})` },
                { id: 'alert', label: '🔴 过期 / 缺货' },
                { id: 'expiring', label: '🟡 3天内临期' },
                { id: 'fresh', label: '🟢 新鲜充足' },
              ] as { id: StatusFilter; label: string }[]
            ).map((pill) => {
              const active = statusFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id)}
                  className={`rounded-xl border px-3 py-1.5 font-bold transition-colors ${
                    isElderly ? 'min-h-[52px] text-base' : 'text-xs'
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--accent)',
                          borderColor: 'var(--accent)',
                          color: 'var(--accent-ink)',
                        }
                      : {
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-secondary)',
                        }
                  }
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Manager Category Filter Pills */}
        {isManager && (
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                categoryFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部分类
            </button>
            {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategoryFilter(catKey as ItemCategory)}
                className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  categoryFilter === catKey
                    ? 'bg-teal-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {catLabel}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Item List Body */}
      <div
        className={`flex-1 overflow-y-auto p-3.5 sm:p-4 lg:max-h-[600px] ${
          isKids
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-2'
            : 'space-y-2.5'
        }`}
      >
        {filteredItems.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center">
            <div className="text-3xl">📦</div>
            <p className="mt-2 text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
              当前没有符合条件的物品
            </p>
            <button
              type="button"
              onClick={() => {
                selectCompartmentFrom3D(null);
                onExternalSearchChange('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="mt-3 rounded-xl border px-4 py-2 text-sm font-bold"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              查看全部库存
            </button>
          </div>
        ) : isKids ? (
          /* ================= KIDS MODE: Big Tactile Emoji Cards ================= */
          filteredItems.map((item) => {
            const loc = getCompartmentMeta(item.compartmentId);
            const isSelected = selectedItemId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  focusItemFromList(item.id);
                  onOpenKidsCheckIn(item.id);
                }}
                className="kids-btn-3d flex min-h-[144px] flex-col items-center justify-center rounded-3xl border-2 p-4 text-center"
                style={{
                  backgroundColor: isSelected ? '#e0f2fe' : '#ffffff',
                  borderColor: isSelected ? '#38bdf8' : '#fde047',
                }}
              >
                <span className="text-5xl leading-none">{item.emoji}</span>
                <span className="mt-2.5 line-clamp-1 text-base font-black text-indigo-950">
                  {item.name}
                </span>
                <span className="mt-1 rounded-full bg-yellow-100 px-3 py-0.5 text-xs font-extrabold text-amber-900">
                  还有 {item.quantity} {item.unit}
                </span>
                <span className="mt-1 text-[11px] font-bold text-sky-700">
                  {loc?.shortLabel ?? '储物格'}
                </span>
              </button>
            );
          })
        ) : (
          /* ================= ELDERLY / STUDENT / MANAGER CARDS ================= */
          filteredItems.map((item) => {
            const health = getItemHealthStatus(item);
            const lowest = getLowestPriceQuote(item.prices);
            const loc = getCompartmentMeta(item.compartmentId);
            const isSelected = selectedItemId === item.id;
            const isBatchChecked = batchSelectedIds.includes(item.id);

            const badgeClass =
              health.color === 'red'
                ? 'bg-red-100 text-red-800 border-red-300'
                : health.color === 'yellow'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300';

            const cardContent = (
              <article
                onClick={() => {
                  focusItemFromList(item.id);
                  onFocusIn3D?.();
                }}
                className={`cursor-pointer rounded-2xl border transition-all ${
                  isElderly ? 'p-4' : 'p-3'
                }`}
                style={{
                  backgroundColor: isSelected
                    ? 'var(--accent-soft)'
                    : 'var(--bg-surface)',
                  borderColor: isSelected
                    ? 'var(--accent)'
                    : 'var(--border-subtle)',
                  borderWidth: isSelected || isElderly ? '2px' : '1px',
                }}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex min-w-0 items-start gap-3">
                    {batchEditMode && isManager && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBatchSelectItem(item.id);
                        }}
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          isBatchChecked
                            ? 'border-teal-700 bg-teal-700 text-white'
                            : 'border-gray-400 bg-white'
                        }`}
                        aria-label="勾选批量编辑"
                      >
                        {isBatchChecked && <Check className="h-3.5 w-3.5" />}
                      </button>
                    )}

                    <div
                      className={`flex shrink-0 items-center justify-center rounded-2xl ${
                        isElderly
                          ? 'h-14 w-14 bg-blue-50 text-4xl'
                          : 'h-10 w-10 bg-gray-100 text-2xl'
                      }`}
                    >
                      {item.emoji}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3
                          className={`truncate font-extrabold ${
                            isElderly ? 'text-xl' : 'text-sm'
                          }`}
                          style={{ color: 'var(--ink-primary)' }}
                        >
                          {item.name}
                        </h3>
                        <span
                          suppressHydrationWarning
                          className={`rounded-md border px-2 py-0.5 font-bold ${
                            isElderly ? 'text-sm' : 'text-[10px]'
                          } ${badgeClass}`}
                        >
                          {health.label}
                        </span>
                      </div>

                      <div
                        className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 ${
                          isElderly ? 'text-lg font-bold' : 'text-xs'
                        }`}
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {loc?.label ?? item.compartmentId}
                        </span>
                        <span className="tabular-nums">
                          剩{' '}
                          <strong style={{ color: 'var(--ink-primary)' }}>
                            {item.quantity} {item.unit}
                          </strong>
                        </span>
                        {lowest && (
                          <span className="font-price inline-flex items-center gap-1 font-bold text-emerald-700">
                            <Tag className="h-3 w-3" />
                            {lowest.retailerName} {formatRM(lowest.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div
                    className="flex shrink-0 items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenDetail(item.id)}
                      className={`rounded-xl border font-bold transition-colors hover:opacity-85 ${
                        isElderly
                          ? 'min-h-[56px] px-4 text-lg'
                          : 'px-2.5 py-1.5 text-xs'
                      }`}
                      style={{
                        borderColor: 'var(--border-strong)',
                        color: 'var(--ink-primary)',
                        backgroundColor: 'var(--bg-surface)',
                      }}
                    >
                      比价
                    </button>
                    {!isElderly && (
                      <button
                        type="button"
                        onClick={() => onEditItem(item)}
                        title="编辑物品"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Quantity + Restock / Delete Controls */}
                <div
                  className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2.5"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustQuantity(item.id, -1)}
                      className={`inline-flex items-center justify-center rounded-xl border-2 font-black hover:bg-gray-100 active:scale-95 ${
                        isElderly ? 'min-h-[64px] min-w-[64px] text-2xl' : 'h-8 w-8 text-xs'
                      }`}
                      style={{ borderColor: 'var(--border-strong)' }}
                      aria-label="减少库存"
                    >
                      <Minus className={isElderly ? 'h-6 w-6' : 'h-3.5 w-3.5'} />
                    </button>
                    <span
                      className={`font-price min-w-[3.2rem] text-center font-extrabold ${
                        isElderly ? 'text-xl' : 'text-xs'
                      }`}
                    >
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustQuantity(item.id, 1)}
                      className={`inline-flex items-center justify-center rounded-xl border-2 font-black hover:bg-gray-100 active:scale-95 ${
                        isElderly ? 'min-h-[64px] min-w-[64px] text-2xl' : 'h-8 w-8 text-xs'
                      }`}
                      style={{ borderColor: 'var(--border-strong)' }}
                      aria-label="增加库存"
                    >
                      <Plus className={isElderly ? 'h-6 w-6' : 'h-3.5 w-3.5'} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-price ${
                        isElderly ? 'text-base font-bold' : 'text-[11px]'
                      }`}
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      {item.expiryDate}
                    </span>

                    <button
                      type="button"
                      onClick={() => addToRestock(item.id, 2)}
                      className={`inline-flex items-center gap-1 rounded-xl font-bold transition-opacity hover:opacity-90 ${
                        isElderly
                          ? 'min-h-[64px] px-4 text-lg'
                          : 'px-2.5 py-1.5 text-xs'
                      }`}
                      style={{
                        backgroundColor:
                          health.isLowStock || health.isExpired
                            ? '#10b981'
                            : 'var(--bg-subtle)',
                        color:
                          health.isLowStock || health.isExpired
                            ? '#ffffff'
                            : 'var(--ink-primary)',
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>补货</span>
                    </button>

                    {isElderly && (
                      <button
                        type="button"
                        onClick={() => setElderlyConfirmDelete(item)}
                        className="inline-flex min-h-[64px] items-center gap-1 rounded-xl border-2 border-red-700 bg-red-50 px-4 text-lg font-extrabold text-red-800"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span>删除</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );

            if (isStudent) {
              return (
                <SwipeableStudentRow
                  key={item.id}
                  onSwipeConsume={() => adjustQuantity(item.id, -1)}
                >
                  {cardContent}
                </SwipeableStudentRow>
              );
            }

            return <div key={item.id}>{cardContent}</div>;
          })
        )}
      </div>

      {/* ================= ELDERLY TWO-STEP DELETE CONFIRMATION ================= */}
      {elderlyConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border-4 border-gray-900 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="h-9 w-9 shrink-0" />
              <h3 className="text-2xl font-black">确认要删除吗？</h3>
            </div>
            <p className="mt-3 text-xl font-bold leading-relaxed text-gray-900">
              您正准备删除「{elderlyConfirmDelete.emoji} {elderlyConfirmDelete.name}」。删错也可以在 3 秒内点撤销恢复。
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setElderlyConfirmDelete(null)}
                className="min-h-[68px] rounded-2xl border-2 border-gray-900 bg-gray-100 text-xl font-black text-gray-900"
              >
                不删了，返回
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteItem(elderlyConfirmDelete.id);
                  setElderlyConfirmDelete(null);
                }}
                className="min-h-[68px] rounded-2xl border-2 border-gray-900 bg-red-700 text-xl font-black text-white"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
