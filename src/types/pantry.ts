// ==================== 1. 冰箱型号与 3D 结构模型 ====================

export type FridgeModelType =
  | 'top-freezer'    // 1. 双门上冷冻（Panasonic / Sharp 经典款）
  | 'bottom-freezer' // 2. 双门下冷冻（Samsung / LG 现代款）
  | 'side-by-side'   // 3. 对开门（左冷冻 / 右冷藏）
  | 'french-door'    // 4. 法式多门（上双开门宽大冷藏 + 下双层大冷冻抽屉）
  | 'mini-fridge';   // 5. 迷你单门（学生宿舍 / 独居紧凑款）

export type StorageUnitType = 'fridge' | 'cabinet';

export type SemanticZoneRole =
  | 'freezer-main'
  | 'freezer-drawer'
  | 'fridge-upper'
  | 'fridge-middle'
  | 'fridge-lower'
  | 'fridge-door'
  | 'cabinet-top'
  | 'cabinet-middle'
  | 'cabinet-bottom'
  | 'cabinet-drawer';

export type CompartmentId = string;

export type DoorMode = 'closed' | 'open' | 'transparent';

export interface CompartmentMeta {
  id: CompartmentId;
  unit: StorageUnitType;
  role: SemanticZoneRole;
  label: string;
  shortLabel: string;
  position: [number, number, number];
  size: [number, number, number];
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  attachment?: 'body' | 'door-right' | 'door-left' | 'drawer-1' | 'drawer-2';
}

export interface FridgeModelPreset {
  id: FridgeModelType;
  name: string;
  subtitle: string;
  description: string;
  recommendedFor: string;
  dimensions: [number, number, number];
  shellColor: string;
  compartments: CompartmentMeta[];
}

export type FridgeFinishId =
  | 'silver'
  | 'obsidian'
  | 'cream'
  | 'mist-blue'
  | 'champagne'
  | 'mint';

export interface FridgeFinishPreset {
  id: FridgeFinishId;
  name: string;
  shellColor: string;
  doorColor: string;
  handleColor: string;
  swatchHex: string;
}

export interface BrandFridgeCatalogItem {
  id: string;
  brand: string;
  modelCode: string;
  displayName: string;
  structure: FridgeModelType;
  finishId: FridgeFinishId;
  capacityLabel: string;
  popularTag?: string;
}

export interface CustomFridgeProfile {
  brand: string;
  modelCode: string;
  finishId: FridgeFinishId;
  customZoneLabels: Record<string, string>;
}

// ==================== 2. 物品与保质期状态 ====================

export type ItemCategory =
  | 'dairy'
  | 'produce'
  | 'meat_frozen'
  | 'seasoning'
  | 'instant'
  | 'beverage'
  | 'snack';

export type ItemUnit = '盒' | '瓶' | '袋' | '个' | '颗' | '罐' | '包' | '支' | '把';

export type HealthStatus = 'fresh' | 'expiring' | 'expired' | 'low_stock';
export type StatusColor = 'green' | 'yellow' | 'red';

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  category: ItemCategory;
  quantity: number;
  minStock: number;
  unit: ItemUnit;
  expiryDate: string; // YYYY-MM-DD
  unitType: StorageUnitType;
  compartmentId: CompartmentId;
  preferredRole: SemanticZoneRole;
  prices: PriceComparison[];
  photoDataUrl?: string;
  notes?: string;
  updatedAt: string;
}

export interface QuickIngredientPreset {
  id: string;
  name: string;
  emoji: string;
  category: ItemCategory;
  defaultUnit: ItemUnit;
  defaultQty: number;
  defaultShelfLifeDays: number;
  unitType: StorageUnitType;
  preferredRole: SemanticZoneRole;
  refPriceRM: number;
}

// ==================== 3. 市面比价与补货清单 ====================

export type RetailerId = 'speedmart99' | 'lotuss' | 'aeon' | 'shopee';

export interface PriceComparison {
  retailerId: RetailerId;
  retailerName: string;
  price: number;        // RM
  packSize: number;
  packUnit: string;
  inStock: boolean;
  promoTag?: string;
}

export interface EvaluatedPriceComparison extends PriceComparison {
  unitPrice: number;
  unitPriceLabel: string;
  isLowest: boolean;
}

export interface RestockItem {
  itemId: string;
  itemName: string;
  emoji: string;
  desiredQty: number;
  unit: ItemUnit;
  selectedRetailerId: RetailerId;
  checked: boolean;
}

export interface SavingsSummary {
  totalAtLowest: number;
  totalAtAverage: number;
  totalAtHighest: number;
  savedVsHighest: number;
  savedVsAverage: number;
}

// ==================== 4. 全龄段模式、撤销保护与移动端导航 ====================

export type UserMode = 'elderly' | 'kids' | 'student' | 'manager';

export type MobileTab = 'scene' | 'inventory' | 'restock' | 'settings';

export interface KidsCheckInLog {
  id: string;
  itemId: string;
  itemName: string;
  emoji: string;
  action: 'take' | 'return';
  pointsEarned: number;
  timestamp: string;
}

export interface QuickRecipe {
  id: string;
  title: string;
  emoji: string;
  prepMinutes: number;
  estimatedCostRM: number;
  requiredKeywords: string[];
  tag: string;
  steps: string[];
}

export interface UndoActionSnapshot {
  id: string;
  message: string;
  previousItems: InventoryItem[];
  previousRestockList: RestockItem[];
  expiresAt: number;
}

// ==================== 5. Zustand 全局状态接口 ====================

export interface SmartPantryState {
  userMode: UserMode;
  fridgeModel: FridgeModelType;
  fridgeProfile: CustomFridgeProfile;
  customGlbUrl: string | null;
  customGlbName: string | null;
  hasChosenFridgeModel: boolean;
  activeUnit: StorageUnitType;
  doorMode: DoorMode;

  selectedCompartmentId: CompartmentId | null;
  selectedItemId: string | null;
  highlightedCompartmentId: CompartmentId | null;

  items: InventoryItem[];
  restockList: RestockItem[];
  monthlySavedRM: number;
  kidsPoints: number;
  kidsLogs: KidsCheckInLog[];

  batchEditMode: boolean;
  batchSelectedIds: string[];

  undoSnapshot: UndoActionSnapshot | null;
  remapNotice: string | null;

  setUserMode: (mode: UserMode) => void;
  setFridgeModel: (model: FridgeModelType) => void;
  updateFridgeProfile: (patch: Partial<CustomFridgeProfile>) => void;
  applyBrandFridgePreset: (catalogItem: BrandFridgeCatalogItem) => void;
  setCustomGlbModel: (url: string, fileName: string) => void;
  clearCustomGlbModel: () => void;
  dismissRemapNotice: () => void;
  setActiveUnit: (unit: StorageUnitType) => void;
  setDoorMode: (mode: DoorMode) => void;
  selectCompartmentFrom3D: (compartmentId: CompartmentId | null) => void;
  focusItemFromList: (itemId: string) => void;
  clearSelection: () => void;

  addItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => void;
  updateItem: (id: string, patch: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  adjustQuantity: (id: string, delta: number, trackKidsCheckIn?: boolean) => void;
  triggerUndo: () => void;
  dismissUndo: () => void;

  toggleBatchEditMode: () => void;
  toggleBatchSelectItem: (id: string) => void;
  clearBatchSelection: () => void;
  batchDeleteItems: (ids: string[]) => void;
  batchAdjustQuantity: (ids: string[], delta: number) => void;

  addToRestock: (itemId: string, qty?: number) => void;
  addAllLowStockToRestock: () => void;
  updateRestockQty: (itemId: string, qty: number) => void;
  selectRestockRetailer: (itemId: string, retailerId: RetailerId) => void;
  toggleRestockChecked: (itemId: string) => void;
  removeFromRestock: (itemId: string) => void;
  clearCheckedRestock: () => void;
  resetDemoData: () => void;
}
