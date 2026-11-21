'use client';

import { Award, CheckCircle2, XCircle } from 'lucide-react';
import { evaluatePrices, formatRM, RETAILER_COLORS } from '@/lib/priceUtils';
import type { PriceComparison, RetailerId } from '@/types/pantry';

interface PriceCompareGridProps {
  prices: PriceComparison[];
  selectedRetailerId?: RetailerId;
  onSelectRetailer?: (retailerId: RetailerId) => void;
  compact?: boolean;
}

export function PriceCompareGrid({
  prices,
  selectedRetailerId,
  onSelectRetailer,
  compact = false,
}: PriceCompareGridProps) {
  const evaluated = evaluatePrices(prices);

  if (evaluated.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-center text-xs text-stone-500">
        暂无渠道比价数据
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {evaluated.map((quote) => {
        const isSelected = selectedRetailerId === quote.retailerId;
        const brandColor = RETAILER_COLORS[quote.retailerId] ?? '#0f766e';

        return (
          <div
            key={quote.retailerId}
            onClick={() =>
              quote.inStock && onSelectRetailer?.(quote.retailerId)
            }
            className={`relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
              onSelectRetailer && quote.inStock ? 'cursor-pointer hover:shadow-xs' : ''
            } ${!quote.inStock ? 'opacity-60' : ''}`}
            style={{
              backgroundColor: quote.isLowest
                ? '#f0fdf4'
                : 'var(--bg-surface)',
              borderColor: quote.isLowest
                ? '#10b981'
                : isSelected
                  ? 'var(--accent)'
                  : 'var(--border-subtle)',
              borderWidth: quote.isLowest || isSelected ? '2px' : '1px',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: brandColor }}
                />
                <span className="text-sm font-bold text-stone-900">
                  {quote.retailerName}
                </span>
              </div>

              {quote.isLowest ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  <Award className="h-3 w-3" />
                  全网最低价
                </span>
              ) : quote.promoTag ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  {quote.promoTag}
                </span>
              ) : null}
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span
                className={`font-price font-extrabold ${
                  compact ? 'text-lg' : 'text-xl'
                } ${quote.isLowest ? 'text-emerald-700' : 'text-stone-900'}`}
              >
                {formatRM(quote.price)}
              </span>
              <span className="font-price text-xs font-medium text-stone-600">
                {quote.unitPriceLabel}
              </span>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
              <span>
                规格：{quote.packSize} {quote.packUnit}
              </span>
              {quote.inStock ? (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> 有货
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-stone-400">
                  <XCircle className="h-3 w-3" /> 暂时缺货
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
