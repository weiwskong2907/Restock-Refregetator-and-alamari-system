import type {
  EvaluatedPriceComparison,
  InventoryItem,
  PriceComparison,
  RestockItem,
  RetailerId,
  SavingsSummary,
} from '@/types/pantry';

export function formatRM(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

function computeUnitPrice(quote: PriceComparison): {
  unitPrice: number;
  unitPriceLabel: string;
} {
  const { price, packSize, packUnit } = quote;
  if (packSize <= 0) {
    return { unitPrice: price, unitPriceLabel: formatRM(price) };
  }

  if (packUnit === 'ml' || packUnit === 'g') {
    const per100 = (price / packSize) * 100;
    return {
      unitPrice: per100,
      unitPriceLabel: `RM ${per100.toFixed(2)} / 100${packUnit}`,
    };
  }

  const perUnit = price / packSize;
  return {
    unitPrice: perUnit,
    unitPriceLabel: `RM ${perUnit.toFixed(2)} / ${packUnit}`,
  };
}

export function evaluatePrices(
  prices: PriceComparison[],
): EvaluatedPriceComparison[] {
  if (!prices || prices.length === 0) return [];

  const inStockPrices = prices.filter((p) => p.inStock);
  const candidates = inStockPrices.length > 0 ? inStockPrices : prices;
  const minPrice = Math.min(...candidates.map((p) => p.price));

  return [...prices]
    .map((quote) => {
      const { unitPrice, unitPriceLabel } = computeUnitPrice(quote);
      return {
        ...quote,
        unitPrice,
        unitPriceLabel,
        isLowest: quote.inStock && quote.price === minPrice,
      };
    })
    .sort((a, b) => a.price - b.price);
}

export function getLowestPriceQuote(
  prices: PriceComparison[],
): EvaluatedPriceComparison | null {
  const evaluated = evaluatePrices(prices);
  return evaluated.find((p) => p.isLowest) ?? evaluated[0] ?? null;
}

export function getHighestPriceQuote(
  prices: PriceComparison[],
): EvaluatedPriceComparison | null {
  const evaluated = evaluatePrices(prices);
  if (evaluated.length === 0) return null;
  return evaluated[evaluated.length - 1];
}

export function getItemSavingsPotential(item: InventoryItem): number {
  const lowest = getLowestPriceQuote(item.prices);
  const highest = getHighestPriceQuote(item.prices);
  if (!lowest || !highest) return 0;
  return Math.max(0, highest.price - lowest.price);
}

export function calculateRestockSavings(
  restockList: RestockItem[],
  items: InventoryItem[],
): SavingsSummary {
  let totalAtLowest = 0;
  let totalAtAverage = 0;
  let totalAtHighest = 0;

  for (const r of restockList) {
    const item = items.find((i) => i.id === r.itemId);
    if (!item || item.prices.length === 0) continue;

    const evaluated = evaluatePrices(item.prices);
    const lowest = evaluated.find((p) => p.isLowest) ?? evaluated[0];
    const highest = evaluated[evaluated.length - 1];
    const avg =
      evaluated.reduce((sum, quote) => sum + quote.price, 0) / evaluated.length;

    const qty = Math.max(1, r.desiredQty);
    totalAtLowest += lowest.price * qty;
    totalAtAverage += avg * qty;
    totalAtHighest += highest.price * qty;
  }

  return {
    totalAtLowest,
    totalAtAverage,
    totalAtHighest,
    savedVsHighest: Math.max(0, totalAtHighest - totalAtLowest),
    savedVsAverage: Math.max(0, totalAtAverage - totalAtLowest),
  };
}

export function buildDefaultQuotesForNewItem(basePrice = 8.9): PriceComparison[] {
  const p1 = Number((basePrice * 0.94).toFixed(2));
  const p2 = Number((basePrice * 1.08).toFixed(2));
  const p3 = Number((basePrice * 0.89).toFixed(2));
  const p4 = Number((basePrice * 0.97).toFixed(2));

  return [
    { retailerId: 'speedmart99', retailerName: '99 Speedmart', price: p3, packSize: 1, packUnit: '份', inStock: true, promoTag: '平价优选' },
    { retailerId: 'lotuss', retailerName: "Lotus's", price: p1, packSize: 1, packUnit: '份', inStock: true },
    { retailerId: 'shopee', retailerName: 'Shopee', price: p4, packSize: 1, packUnit: '份', inStock: true },
    { retailerId: 'aeon', retailerName: 'AEON', price: p2, packSize: 1, packUnit: '份', inStock: true },
  ];
}

export function formatFamilyShareList(
  restockList: RestockItem[],
  items: InventoryItem[],
): string {
  const pending = restockList.filter((r) => !r.checked);
  const savings = calculateRestockSavings(pending, items);
  if (pending.length === 0) {
    return '🛒 【SmartPantry 3D 家庭采购清单】目前暂无待采购物品！';
  }

  const lines = pending.map((entry, idx) => {
    const item = items.find((i) => i.id === entry.itemId);
    const lowest = item ? getLowestPriceQuote(item.prices) : null;
    const priceHint = lowest
      ? `（推荐 ${lowest.retailerName} ${formatRM(lowest.price)}）`
      : '';
    return `${idx + 1}. ${entry.emoji} ${entry.itemName} × ${entry.desiredQty}${entry.unit} ${priceHint}`;
  });

  return [
    '🛒 【SmartPantry 3D 家庭补货清单】',
    ...lines,
    '----------------------------',
    `💰 按全网最低价预计总计：${formatRM(savings.totalAtLowest)}`,
    `✨ 对比高价渠道总共可省：${formatRM(savings.savedVsHighest)}`,
  ].join('\n');
}

export const RETAILER_COLORS: Record<RetailerId, string> = {
  speedmart99: '#d97706',
  lotuss: '#00857c',
  aeon: '#a21caf',
  shopee: '#ea580c',
};
