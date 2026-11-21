'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FRIDGE_MODEL_MAP, remapCompartmentForModel } from '@/data/fridgeModels';
import { createSeedInventory } from '@/data/seedInventory';
import { getItemHealthStatus } from '@/lib/inventoryUtils';
import { getLowestPriceQuote } from '@/lib/priceUtils';
import type {
  BrandFridgeCatalogItem,
  CompartmentId,
  CustomFridgeProfile,
  DoorMode,
  FridgeModelType,
  InventoryItem,
  KidsCheckInLog,
  RestockItem,
  RetailerId,
  SmartPantryState,
  StorageUnitType,
  UserMode,
} from '@/types/pantry';

function createInitialRestock(items: InventoryItem[]): RestockItem[] {
  const starterIds = ['item-milk', 'item-eggs', 'item-soysauce'];
  return starterIds
    .map((id) => items.find((i) => i.id === id))
    .filter((item): item is InventoryItem => Boolean(item))
    .map((item) => {
      const lowest = getLowestPriceQuote(item.prices);
      return {
        itemId: item.id,
        itemName: item.name,
        emoji: item.emoji,
        desiredQty: 2,
        unit: item.unit,
        selectedRetailerId: lowest?.retailerId ?? 'speedmart99',
        checked: false,
      };
    });
}

const seedItems = createSeedInventory('top-freezer');

export const usePantryStore = create<SmartPantryState>()(
  persist(
    (set, get) => ({
      userMode: 'manager',
      fridgeModel: 'top-freezer',
      fridgeProfile: {
        brand: 'Panasonic',
        modelCode: 'NR-BL300',
        finishId: 'silver',
        customZoneLabels: {},
      },
      customGlbUrl: null,
      customGlbName: null,
      hasChosenFridgeModel: false,
      activeUnit: 'fridge',
      doorMode: 'open',

      selectedCompartmentId: null,
      selectedItemId: null,
      highlightedCompartmentId: null,

      items: seedItems,
      restockList: createInitialRestock(seedItems),
      monthlySavedRM: 46.8,
      kidsPoints: 35,
      kidsLogs: [
        {
          id: 'log-seed-1',
          itemId: 'item-apple',
          itemName: '红富士脆甜苹果',
          emoji: '🍎',
          action: 'return',
          pointsEarned: 10,
          timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        },
      ],

      batchEditMode: false,
      batchSelectedIds: [],

      undoSnapshot: null,
      remapNotice: null,

      setUserMode: (userMode: UserMode) =>
        set((state) => ({
          userMode,
          batchEditMode: userMode === 'manager' ? state.batchEditMode : false,
          batchSelectedIds: userMode === 'manager' ? state.batchSelectedIds : [],
        })),

      setFridgeModel: (fridgeModel: FridgeModelType) =>
        set((state) => {
          const preset = FRIDGE_MODEL_MAP[fridgeModel];
          let remappedCount = 0;

          const updatedItems = state.items.map((item) => {
            if (item.unitType !== 'fridge') return item;
            const nextComp = remapCompartmentForModel(
              item.preferredRole,
              fridgeModel,
            );
            if (nextComp !== item.compartmentId) remappedCount += 1;
            return {
              ...item,
              compartmentId: nextComp,
              updatedAt: new Date().toISOString(),
            };
          });

          return {
            fridgeModel,
            customGlbUrl: null,
            customGlbName: null,
            hasChosenFridgeModel: true,
            activeUnit: 'fridge',
            items: updatedItems,
            selectedCompartmentId: null,
            highlightedCompartmentId: null,
            selectedItemId: null,
            remapNotice:
              remappedCount > 0
                ? `已切换为「${preset.name}」，并自动将 ${remappedCount} 件冰箱物品映射到新隔层，可随时编辑微调。`
                : `已切换为「${preset.name}」3D 模型。`,
          };
        }),

      updateFridgeProfile: (patch: Partial<CustomFridgeProfile>) =>
        set((state) => ({
          hasChosenFridgeModel: true,
          fridgeProfile: {
            ...state.fridgeProfile,
            ...patch,
            customZoneLabels: patch.customZoneLabels
              ? { ...state.fridgeProfile.customZoneLabels, ...patch.customZoneLabels }
              : state.fridgeProfile.customZoneLabels,
          },
        })),

      applyBrandFridgePreset: (catalogItem: BrandFridgeCatalogItem) => {
        get().setFridgeModel(catalogItem.structure);
        set((state) => ({
          hasChosenFridgeModel: true,
          customGlbUrl: null,
          customGlbName: null,
          fridgeProfile: {
            ...state.fridgeProfile,
            brand: catalogItem.brand,
            modelCode: catalogItem.modelCode,
            finishId: catalogItem.finishId,
          },
          remapNotice: `已套用「${catalogItem.displayName}」3D 模型与配色，原有冰箱物品已自动归位。`,
        }));
      },

      setCustomGlbModel: (url: string, fileName: string) =>
        set((state) => {
          if (state.customGlbUrl && state.customGlbUrl.startsWith('blob:')) {
            URL.revokeObjectURL(state.customGlbUrl);
          }
          return {
            customGlbUrl: url,
            customGlbName: fileName,
            hasChosenFridgeModel: true,
            activeUnit: 'fridge',
            remapNotice: `已加载您的专属 3D 模型「${fileName}」！可自由旋转缩放，随时可切回内置交互式隔层模型。`,
          };
        }),

      clearCustomGlbModel: () =>
        set((state) => {
          if (state.customGlbUrl && state.customGlbUrl.startsWith('blob:')) {
            URL.revokeObjectURL(state.customGlbUrl);
          }
          return {
            customGlbUrl: null,
            customGlbName: null,
          };
        }),

      dismissRemapNotice: () => set({ remapNotice: null }),

      setActiveUnit: (activeUnit: StorageUnitType) =>
        set({
          activeUnit,
          selectedCompartmentId: null,
          highlightedCompartmentId: null,
        }),

      setDoorMode: (doorMode: DoorMode) => set({ doorMode }),

      selectCompartmentFrom3D: (compartmentId: CompartmentId | null) =>
        set((state) => {
          const isSame = state.selectedCompartmentId === compartmentId;
          const next = isSame ? null : compartmentId;
          return {
            selectedCompartmentId: next,
            highlightedCompartmentId: next,
            selectedItemId: null,
          };
        }),

      focusItemFromList: (itemId: string) => {
        const item = get().items.find((i) => i.id === itemId);
        if (!item) return;
        set((state) => ({
          activeUnit: item.unitType,
          selectedItemId: item.id,
          highlightedCompartmentId: item.compartmentId,
          doorMode: state.doorMode === 'closed' ? 'open' : state.doorMode,
        }));
      },

      clearSelection: () =>
        set({
          selectedCompartmentId: null,
          selectedItemId: null,
          highlightedCompartmentId: null,
        }),

      addItem: (newItem) => {
        const id = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const created: InventoryItem = {
          ...newItem,
          id,
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          items: [created, ...state.items],
          activeUnit: created.unitType,
          highlightedCompartmentId: created.compartmentId,
          selectedItemId: created.id,
        }));
      },

      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, ...patch, updatedAt: new Date().toISOString() }
              : item,
          ),
        })),

      deleteItem: (id) => {
        const state = get();
        const target = state.items.find((i) => i.id === id);
        if (!target) return;

        set({
          undoSnapshot: {
            id: `undo-${Date.now()}`,
            message: `已删除「${target.emoji} ${target.name}」`,
            previousItems: state.items,
            previousRestockList: state.restockList,
            expiresAt: Date.now() + 3400,
          },
          items: state.items.filter((item) => item.id !== id),
          restockList: state.restockList.filter((r) => r.itemId !== id),
          batchSelectedIds: state.batchSelectedIds.filter((bid) => bid !== id),
          selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
        });
      },

      adjustQuantity: (id, delta, trackKidsCheckIn = false) => {
        const state = get();
        const target = state.items.find((i) => i.id === id);
        if (!target) return;
        const nextQty = Math.max(0, target.quantity + delta);
        if (nextQty === target.quantity) return;

        const isKids = trackKidsCheckIn || state.userMode === 'kids';
        const action: 'take' | 'return' = delta < 0 ? 'take' : 'return';
        const pointsEarned = action === 'return' ? 10 : 5;

        const newLog: KidsCheckInLog | null = isKids
          ? {
              id: `log-${Date.now()}`,
              itemId: target.id,
              itemName: target.name,
              emoji: target.emoji,
              action,
              pointsEarned,
              timestamp: new Date().toISOString(),
            }
          : null;

        // Provide 3-second Undo when consuming items (-1) outside kids mode
        const nextUndo =
          delta < 0 && !isKids
            ? {
                id: `undo-${Date.now()}`,
                message: `已消耗 ${Math.abs(delta)} ${target.unit}「${target.name}」`,
                previousItems: state.items,
                previousRestockList: state.restockList,
                expiresAt: Date.now() + 3400,
              }
            : state.undoSnapshot;

        set({
          undoSnapshot: nextUndo,
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, quantity: nextQty, updatedAt: new Date().toISOString() }
              : item,
          ),
          kidsPoints: newLog ? state.kidsPoints + pointsEarned : state.kidsPoints,
          kidsLogs: newLog ? [newLog, ...state.kidsLogs].slice(0, 12) : state.kidsLogs,
        });
      },

      triggerUndo: () =>
        set((state) => {
          if (!state.undoSnapshot) return state;
          return {
            items: state.undoSnapshot.previousItems,
            restockList: state.undoSnapshot.previousRestockList,
            undoSnapshot: null,
          };
        }),

      dismissUndo: () => set({ undoSnapshot: null }),

      toggleBatchEditMode: () =>
        set((state) => ({
          batchEditMode: !state.batchEditMode,
          batchSelectedIds: state.batchEditMode ? [] : state.batchSelectedIds,
        })),

      toggleBatchSelectItem: (id) =>
        set((state) => {
          const exists = state.batchSelectedIds.includes(id);
          return {
            batchSelectedIds: exists
              ? state.batchSelectedIds.filter((x) => x !== id)
              : [...state.batchSelectedIds, id],
          };
        }),

      clearBatchSelection: () => set({ batchSelectedIds: [] }),

      batchDeleteItems: (ids) => {
        const state = get();
        if (ids.length === 0) return;
        set({
          undoSnapshot: {
            id: `undo-${Date.now()}`,
            message: `已批量删除 ${ids.length} 项物品`,
            previousItems: state.items,
            previousRestockList: state.restockList,
            expiresAt: Date.now() + 3400,
          },
          items: state.items.filter((i) => !ids.includes(i.id)),
          restockList: state.restockList.filter((r) => !ids.includes(r.itemId)),
          batchSelectedIds: [],
          selectedItemId:
            state.selectedItemId && ids.includes(state.selectedItemId)
              ? null
              : state.selectedItemId,
        });
      },

      batchAdjustQuantity: (ids, delta) =>
        set((state) => ({
          items: state.items.map((item) =>
            ids.includes(item.id)
              ? {
                  ...item,
                  quantity: Math.max(0, item.quantity + delta),
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        })),

      addToRestock: (itemId, qty = 2) => {
        const item = get().items.find((i) => i.id === itemId);
        if (!item) return;
        const lowest = getLowestPriceQuote(item.prices);
        set((state) => {
          const existing = state.restockList.find((r) => r.itemId === itemId);
          if (existing) {
            return {
              restockList: state.restockList.map((r) =>
                r.itemId === itemId
                  ? { ...r, desiredQty: r.desiredQty + 1, checked: false }
                  : r,
              ),
            };
          }
          return {
            restockList: [
              {
                itemId: item.id,
                itemName: item.name,
                emoji: item.emoji,
                desiredQty: Math.max(1, qty),
                unit: item.unit,
                selectedRetailerId: lowest?.retailerId ?? 'speedmart99',
                checked: false,
              },
              ...state.restockList,
            ],
          };
        });
      },

      addAllLowStockToRestock: () => {
        const { items, restockList } = get();
        const existingIds = new Set(restockList.map((r) => r.itemId));
        const additions: RestockItem[] = [];

        for (const item of items) {
          const health = getItemHealthStatus(item);
          if ((health.isLowStock || health.isExpired) && !existingIds.has(item.id)) {
            const lowest = getLowestPriceQuote(item.prices);
            additions.push({
              itemId: item.id,
              itemName: item.name,
              emoji: item.emoji,
              desiredQty: Math.max(1, item.minStock - item.quantity + 2),
              unit: item.unit,
              selectedRetailerId: lowest?.retailerId ?? 'speedmart99',
              checked: false,
            });
          }
        }

        if (additions.length === 0) return;
        set((state) => ({
          restockList: [...additions, ...state.restockList],
        }));
      },

      updateRestockQty: (itemId, qty) =>
        set((state) => ({
          restockList: state.restockList.map((r) =>
            r.itemId === itemId ? { ...r, desiredQty: Math.max(1, qty) } : r,
          ),
        })),

      selectRestockRetailer: (itemId, retailerId: RetailerId) =>
        set((state) => ({
          restockList: state.restockList.map((r) =>
            r.itemId === itemId ? { ...r, selectedRetailerId: retailerId } : r,
          ),
        })),

      toggleRestockChecked: (itemId) =>
        set((state) => ({
          restockList: state.restockList.map((r) =>
            r.itemId === itemId ? { ...r, checked: !r.checked } : r,
          ),
        })),

      removeFromRestock: (itemId) =>
        set((state) => ({
          restockList: state.restockList.filter((r) => r.itemId !== itemId),
        })),

      clearCheckedRestock: () =>
        set((state) => ({
          restockList: state.restockList.filter((r) => !r.checked),
        })),

      resetDemoData: () => {
        const model = get().fridgeModel;
        const fresh = createSeedInventory(model);
        set({
          items: fresh,
          restockList: createInitialRestock(fresh),
          selectedCompartmentId: null,
          selectedItemId: null,
          highlightedCompartmentId: null,
          batchSelectedIds: [],
          undoSnapshot: null,
          kidsPoints: 35,
        });
      },
    }),
    {
      name: 'smartpantry-3d-v2-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        userMode: state.userMode,
        fridgeModel: state.fridgeModel,
        fridgeProfile: state.fridgeProfile,
        hasChosenFridgeModel: state.hasChosenFridgeModel,
        activeUnit: state.activeUnit,
        items: state.items,
        restockList: state.restockList,
        monthlySavedRM: state.monthlySavedRM,
        kidsPoints: state.kidsPoints,
        kidsLogs: state.kidsLogs,
      }),
    },
  ),
);
