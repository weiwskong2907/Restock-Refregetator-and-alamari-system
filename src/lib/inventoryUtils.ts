import type { HealthStatus, InventoryItem, StatusColor } from '@/types/pantry';

export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 999;
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getItemHealthStatus(item: InventoryItem): {
  status: HealthStatus;
  color: StatusColor;
  daysLeft: number;
  label: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isLowStock: boolean;
} {
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  const isExpired = daysLeft < 0;
  const isExpiringSoon = daysLeft >= 0 && daysLeft <= 3;
  const isLowStock = item.quantity <= item.minStock;

  if (isExpired) {
    return {
      status: 'expired',
      color: 'red',
      daysLeft,
      label: `已过期 ${Math.abs(daysLeft)} 天`,
      isExpired,
      isExpiringSoon,
      isLowStock,
    };
  }

  if (isLowStock) {
    return {
      status: 'low_stock',
      color: 'red',
      daysLeft,
      label: item.quantity === 0 ? '已缺货' : '库存不足',
      isExpired,
      isExpiringSoon,
      isLowStock,
    };
  }

  if (isExpiringSoon) {
    return {
      status: 'expiring',
      color: 'yellow',
      daysLeft,
      label: daysLeft === 0 ? '今天到期' : `${daysLeft} 天内临期`,
      isExpired,
      isExpiringSoon,
      isLowStock,
    };
  }

  return {
    status: 'fresh',
    color: 'green',
    daysLeft,
    label: `新鲜 · 剩 ${daysLeft} 天`,
    isExpired,
    isExpiringSoon,
    isLowStock,
  };
}

export function getStatusHex(color: StatusColor): string {
  switch (color) {
    case 'red':
      return '#dc2626';
    case 'yellow':
      return '#eab308';
    case 'green':
    default:
      return '#16a34a';
  }
}

export function getCompartmentWorstColor(items: InventoryItem[]): StatusColor | 'empty' {
  if (items.length === 0) return 'empty';
  let worst: StatusColor = 'green';
  for (const item of items) {
    const { color } = getItemHealthStatus(item);
    if (color === 'red') return 'red';
    if (color === 'yellow') worst = 'yellow';
  }
  return worst;
}
