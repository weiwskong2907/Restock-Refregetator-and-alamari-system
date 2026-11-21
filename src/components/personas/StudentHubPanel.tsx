'use client';

import { useState } from 'react';
import {
  Clock,
  Flame,
  PiggyBank,
  ChefHat,
  ChevronDown,
  ChevronUp,
  TrendingDown,
} from 'lucide-react';
import { usePantryStore } from '@/store/usePantryStore';
import { QUICK_RECIPES } from '@/data/seedInventory';
import { getItemHealthStatus } from '@/lib/inventoryUtils';
import {
  calculateRestockSavings,
  formatRM,
  getItemSavingsPotential,
  getLowestPriceQuote,
} from '@/lib/priceUtils';

interface StudentHubPanelProps {
  onFocusIn3D?: () => void;
}

export function StudentHubPanel({ onFocusIn3D }: StudentHubPanelProps) {
  const { items, restockList, monthlySavedRM, focusItemFromList, addToRestock } =
    usePantryStore();
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(
    QUICK_RECIPES[0]?.id ?? null,
  );

  const restockSavings = calculateRestockSavings(restockList, items);
  const totalMonthSaved = monthlySavedRM + restockSavings.savedVsHighest;

  const urgentItems = items
    .map((item) => ({ item, health: getItemHealthStatus(item) }))
    .filter(({ health }) => health.isExpired || health.isExpiringSoon)
    .sort((a, b) => a.health.daysLeft - b.health.daysLeft);

  const topSavings = [...items]
    .map((item) => ({
      item,
      saving: getItemSavingsPotential(item),
      lowest: getLowestPriceQuote(item.prices),
    }))
    .filter((entry) => entry.saving > 0 && entry.lowest)
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 3);

  const inStockNames = items
    .filter((i) => i.quantity > 0 && !getItemHealthStatus(i).isExpired)
    .map((i) => i.name);

  const matchedRecipes = QUICK_RECIPES.map((recipe) => {
    const matched = recipe.requiredKeywords.filter((kw) =>
      inStockNames.some((name) => name.includes(kw)),
    );
    return {
      recipe,
      matched,
      ratio: matched.length / recipe.requiredKeywords.length,
    };
  }).sort((a, b) => b.ratio - a.ratio);

  return (
    <section className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
      {/* Bento 1: 本月比价已省 + 省钱排行 (4 cols) */}
      <div className="pantry-surface flex flex-col justify-between p-4 md:col-span-4">
        <div className="rounded-xl bg-indigo-600 p-3.5 text-white">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-100">
            <span className="inline-flex items-center gap-1.5">
              <PiggyBank className="h-4 w-4 text-emerald-300" />
              本月比价已省金额
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              <TrendingDown className="h-3 w-3" /> 省钱模式
            </span>
          </div>
          <div className="font-price mt-1.5 text-3xl font-extrabold tracking-tight text-emerald-300">
            {formatRM(totalMonthSaved)}
          </div>
          <div className="mt-1 text-[11px] text-indigo-200">
            含当前补货清单可省{' '}
            <span className="font-price font-bold text-white">
              {formatRM(restockSavings.savedVsHighest)}
            </span>{' '}
            · 列表左滑可一键消耗 (-1)
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            差价最大省钱单品
          </div>
          {topSavings.map(({ item, saving, lowest }) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-slate-900">
                  {item.emoji} {item.name}
                </div>
                <div className="font-price text-[11px] font-semibold text-emerald-600">
                  {lowest?.retailerName} {lowest ? formatRM(lowest.price) : '-'}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="font-price rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  -{formatRM(saving)}
                </span>
                <button
                  type="button"
                  onClick={() => addToRestock(item.id, 1)}
                  className="rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white"
                >
                  +买
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bento 2: 临期食材优先消耗 (4 cols) */}
      <div className="pantry-surface flex flex-col p-4 md:col-span-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-extrabold text-slate-900">
              临期食材急救箱
            </h2>
          </div>
          <span className="font-price rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
            {urgentItems.length} 项
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          优先消耗临期食材，拒绝宿舍浪费
        </p>

        <div className="mt-3 flex flex-1 flex-col gap-2">
          {urgentItems.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
              太赞了，目前没有临期食物！
            </div>
          ) : (
            urgentItems.slice(0, 4).map(({ item, health }) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  focusItemFromList(item.id);
                  onFocusIn3D?.();
                }}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50/40"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-slate-900">
                      {item.name}
                    </div>
                    <div className="font-price text-[11px] text-slate-500">
                      余 {item.quantity} {item.unit} · {item.expiryDate}
                    </div>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                    health.isExpired
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {health.label}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Bento 3: 现有临期食材推荐快手菜 (4 cols) */}
      <div className="pantry-surface flex flex-col p-4 md:col-span-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              临期食材快手菜
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600">
            ≤10 分钟
          </span>
        </div>

        <div className="mt-3 flex flex-1 flex-col gap-2">
          {matchedRecipes.slice(0, 3).map(({ recipe, matched }) => {
            const expanded = expandedRecipeId === recipe.id;
            return (
              <div
                key={recipe.id}
                className="rounded-xl border border-slate-200 p-2.5"
              >
                <button
                  type="button"
                  onClick={() => setExpandedRecipeId(expanded ? null : recipe.id)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span>{recipe.emoji}</span>
                      <span className="truncate text-xs font-bold text-slate-900">
                        {recipe.title}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {recipe.prepMinutes}m
                      </span>
                      <span className="font-price font-bold text-emerald-600">
                        {formatRM(recipe.estimatedCostRM)}
                      </span>
                      <span className="rounded bg-indigo-50 px-1.5 text-[10px] font-bold text-indigo-700">
                        齐备 {matched.length}/{recipe.requiredKeywords.length}
                      </span>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                </button>

                {expanded && (
                  <div className="mt-2 border-t border-slate-100 pt-2 text-[11px]">
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {recipe.requiredKeywords.map((kw) => {
                        const hasIt = matched.includes(kw);
                        return (
                          <span
                            key={kw}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              hasIt
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {hasIt ? '✓ ' : ''}
                            {kw}
                          </span>
                        );
                      })}
                    </div>
                    <ol className="list-decimal space-y-1 pl-4 text-slate-600">
                      {recipe.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
