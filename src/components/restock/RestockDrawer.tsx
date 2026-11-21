'use client';

import { useState } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Check,
  Award,
  Share2,
} from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import {
  calculateRestockSavings,
  evaluatePrices,
  formatFamilyShareList,
  formatRM,
} from '@/lib/priceUtils';

interface RestockDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function RestockDrawer({ open, onClose }: RestockDrawerProps) {
  const {
    items,
    restockList,
    addAllLowStockToRestock,
    updateRestockQty,
    selectRestockRetailer,
    toggleRestockChecked,
    removeFromRestock,
    clearCheckedRestock,
  } = usePantryStore();

  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const savings = calculateRestockSavings(restockList, items);
  const checkedCount = restockList.filter((r) => r.checked).length;

  const handleCopyList = async () => {
    const text = formatFamilyShareList(restockList, items);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]">
      <div
        className="flex h-[100dvh] w-full max-w-xl flex-col shadow-2xl"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Header */}
        <div
          className="safe-top flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            <div>
              <h2 className="text-base font-extrabold" style={{ color: 'var(--ink-primary)' }}>
                智能补货清单与本地比价
              </h2>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                99 Speedmart · Lotus&apos;s · AEON · Shopee 实时比价
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-stone-100"
            aria-label="关闭补货清单"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Savings Summary Banner */}
        <div className="border-b bg-emerald-50/90 px-5 py-4" style={{ borderColor: '#bbf7d0' }}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[11px] font-semibold text-emerald-900/70">
                按最低价总计
              </div>
              <div className="font-price mt-0.5 text-xl font-black text-emerald-800">
                {formatRM(savings.totalAtLowest)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-stone-500">
                高价渠道对比
              </div>
              <div className="font-price mt-0.5 text-base font-bold text-stone-500 line-through">
                {formatRM(savings.totalAtHighest)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-emerald-900">
                总共节省
              </div>
              <div className="font-price mt-0.5 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-sm font-extrabold text-white">
                <Sparkles className="h-3.5 w-3.5" />
                {formatRM(savings.savedVsHighest)}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addAllLowStockToRestock}
              className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
            >
              + 一键导入低库存 / 过期
            </button>
            <button
              type="button"
              onClick={handleCopyList}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-400 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? '已复制到剪贴板' : '复制发家庭群'}</span>
            </button>
            {checkedCount > 0 && (
              <button
                type="button"
                onClick={clearCheckedRestock}
                className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600"
              >
                清除已买 ({checkedCount})
              </button>
            )}
          </div>
        </div>

        {/* Restock List Items */}
        <div className="safe-bottom flex-1 space-y-3 overflow-y-auto p-5">
          {restockList.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <div className="text-3xl">🛒</div>
              <p className="mt-2 text-sm font-bold text-stone-700">
                补货清单还是空的
              </p>
              <p className="mt-1 text-xs text-stone-500">
                点上方“一键导入低库存”或在物品卡片中加入补货清单。
              </p>
            </div>
          ) : (
            restockList.map((entry) => {
              const sourceItem = items.find((i) => i.id === entry.itemId);
              const evaluated = sourceItem ? evaluatePrices(sourceItem.prices) : [];
              const lowest = evaluated.find((q) => q.isLowest) ?? evaluated[0];
              const highest = evaluated[evaluated.length - 1];
              const itemSaved =
                lowest && highest
                  ? Math.max(0, (highest.price - lowest.price) * entry.desiredQty)
                  : 0;

              return (
                <div
                  key={entry.itemId}
                  className={`rounded-2xl border p-3.5 transition-opacity ${
                    entry.checked ? 'opacity-55' : ''
                  }`}
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleRestockChecked(entry.itemId)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          entry.checked
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                        aria-label="勾选已买"
                      >
                        {entry.checked && <Check className="h-3.5 w-3.5" />}
                      </button>

                      <div>
                        <div
                          className={`text-sm font-bold ${
                            entry.checked ? 'line-through text-stone-400' : ''
                          }`}
                          style={
                            entry.checked ? undefined : { color: 'var(--ink-primary)' }
                          }
                        >
                          <span className="mr-1.5">{entry.emoji}</span>
                          {entry.itemName}
                        </div>
                        {lowest && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              <Award className="h-3 w-3" />
                              全网最低价：{lowest.retailerName}{' '}
                              <span className="font-price">{formatRM(lowest.price)}</span>
                            </span>
                            {itemSaved > 0 && (
                              <span className="font-price text-[11px] font-bold text-emerald-700">
                                省 {formatRM(itemSaved)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div
                        className="flex items-center rounded-lg border"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateRestockQty(entry.itemId, entry.desiredQty - 1)
                          }
                          className="p-1.5 hover:bg-stone-100"
                          aria-label="减少数量"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-price min-w-[2.4rem] text-center text-xs font-bold">
                          {entry.desiredQty}
                          {entry.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateRestockQty(entry.itemId, entry.desiredQty + 1)
                          }
                          className="p-1.5 hover:bg-stone-100"
                          aria-label="增加数量"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromRestock(entry.itemId)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {evaluated.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {evaluated.map((q) => {
                        const selected = entry.selectedRetailerId === q.retailerId;
                        return (
                          <button
                            key={q.retailerId}
                            type="button"
                            disabled={!q.inStock}
                            onClick={() =>
                              selectRestockRetailer(entry.itemId, q.retailerId)
                            }
                            className={`rounded-xl border px-2 py-1.5 text-left transition-colors ${
                              !q.inStock ? 'cursor-not-allowed opacity-45' : ''
                            }`}
                            style={{
                              backgroundColor: q.isLowest
                                ? '#f0fdf4'
                                : selected
                                  ? 'var(--accent-soft)'
                                  : 'transparent',
                              borderColor: q.isLowest
                                ? '#16a34a'
                                : selected
                                  ? 'var(--accent)'
                                  : 'var(--border-subtle)',
                            }}
                          >
                            <div className="truncate text-[10px] font-bold text-stone-700">
                              {q.retailerName}
                            </div>
                            <div
                              className={`font-price text-xs font-extrabold ${
                                q.isLowest ? 'text-emerald-700' : 'text-stone-900'
                              }`}
                            >
                              {formatRM(q.price)}
                            </div>
                            <div className="truncate text-[9px] text-stone-500">
                              {q.unitPriceLabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
