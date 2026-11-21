'use client';

import { useState } from 'react';
import {
  CheckSquare,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  Share2,
  Check,
} from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import { getItemHealthStatus } from '@/lib/inventoryUtils';
import {
  calculateRestockSavings,
  formatFamilyShareList,
  formatRM,
} from '@/lib/priceUtils';

interface ManagerStatsBarProps {
  onOpenRestockDrawer: () => void;
}

export function ManagerStatsBar({ onOpenRestockDrawer }: ManagerStatsBarProps) {
  const {
    items,
    restockList,
    batchEditMode,
    batchSelectedIds,
    toggleBatchEditMode,
    batchAdjustQuantity,
    batchDeleteItems,
    addAllLowStockToRestock,
    resetDemoData,
  } = usePantryStore();

  const [copied, setCopied] = useState(false);

  const totalSkus = items.length;
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  const expiringCount = items.filter((i) => getItemHealthStatus(i).isExpiringSoon).length;
  const expiredCount = items.filter((i) => getItemHealthStatus(i).isExpired).length;
  const lowStockCount = items.filter((i) => getItemHealthStatus(i).isLowStock).length;

  const savings = calculateRestockSavings(restockList, items);

  const handleCopyShare = async () => {
    const text = formatFamilyShareList(restockList, items);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback for non-HTTPS mobile preview
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <section className="pantry-surface p-3.5 sm:p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-r pr-3 last:border-r-0" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            总库存 SKU / 件数
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-price text-2xl font-extrabold text-gray-900">
              {totalSkus}
            </span>
            <span className="text-xs font-medium text-gray-500">
              种 · {totalUnits} 件
            </span>
          </div>
        </div>

        <div className="sm:border-r sm:pr-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            临期 / 过期预警
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-price text-2xl font-extrabold text-amber-600">
              {expiringCount}
            </span>
            <span className="text-xs text-gray-500">临期</span>
            <span className="font-price text-lg font-extrabold text-red-600">
              {expiredCount}
            </span>
            <span className="text-xs font-semibold text-red-600">已过期</span>
          </div>
        </div>

        <div className="border-r pr-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            待补货低库存
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-price text-2xl font-extrabold text-red-600">
              {lowStockCount}
            </span>
            <span className="text-xs text-gray-500">项需补货</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            比价清单预计节省
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-price text-2xl font-extrabold text-teal-700">
              {formatRM(savings.savedVsHighest)}
            </span>
            <span className="text-xs text-gray-500">
              ({restockList.length}项)
            </span>
          </div>
        </div>
      </div>

      {/* Manager Power Actions */}
      <div
        className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleBatchEditMode}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors"
            style={
              batchEditMode
                ? {
                    backgroundColor: '#0f766e',
                    borderColor: '#0f766e',
                    color: '#ffffff',
                  }
                : {
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }
            }
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>{batchEditMode ? '退出批量入库/编辑' : '多选批量入库'}</span>
          </button>

          {batchEditMode && batchSelectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs">
              <span className="font-bold text-gray-700">
                已选 {batchSelectedIds.length}：
              </span>
              <button
                type="button"
                onClick={() => batchAdjustQuantity(batchSelectedIds, 1)}
                className="inline-flex items-center gap-0.5 rounded bg-teal-700 px-2 py-0.5 font-bold text-white hover:bg-teal-800"
              >
                <Plus className="h-3 w-3" /> 批量入库 +1
              </button>
              <button
                type="button"
                onClick={() => batchAdjustQuantity(batchSelectedIds, -1)}
                className="inline-flex items-center gap-0.5 rounded bg-white px-2 py-0.5 font-bold text-gray-800 shadow-xs hover:bg-gray-50"
              >
                <Minus className="h-3 w-3" /> 消耗 -1
              </button>
              <button
                type="button"
                onClick={() => batchDeleteItems(batchSelectedIds)}
                className="inline-flex items-center gap-0.5 rounded bg-red-600 px-2 py-0.5 font-bold text-white hover:bg-red-700"
              >
                <Trash2 className="h-3 w-3" /> 删除
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyShare}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>已复制！去粘贴到家庭群</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>复制清单发家庭群</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              addAllLowStockToRestock();
              onOpenRestockDrawer();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-teal-800"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>低库存一键补货</span>
          </button>

          <button
            type="button"
            onClick={resetDemoData}
            title="重置为初始演示数据"
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
