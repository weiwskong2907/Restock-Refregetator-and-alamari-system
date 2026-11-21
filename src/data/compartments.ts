import { FRIDGE_MODEL_MAP, FRIDGE_MODELS } from './fridgeModels';
import type {
  CompartmentId,
  CompartmentMeta,
  FridgeModelType,
  StorageUnitType,
} from '@/types/pantry';

export const CABINET_COMPARTMENTS: CompartmentMeta[] = [
  {
    id: 'cabinet-top',
    unit: 'cabinet',
    role: 'cabinet-top',
    label: '橱柜 · 上层(零食速食)',
    shortLabel: '上层',
    position: [0, 1.08, -0.04],
    size: [2.32, 0.82, 1.12],
    cameraTarget: [0, 1.05, 0],
    cameraPosition: [2.8, 1.6, 3.7],
    attachment: 'body',
  },
  {
    id: 'cabinet-middle',
    unit: 'cabinet',
    role: 'cabinet-middle',
    label: '橱柜 · 中层(调味酱料)',
    shortLabel: '中层',
    position: [0, 0.16, -0.04],
    size: [2.32, 0.82, 1.12],
    cameraTarget: [0, 0.16, 0],
    cameraPosition: [2.7, 0.6, 3.6],
    attachment: 'body',
  },
  {
    id: 'cabinet-bottom',
    unit: 'cabinet',
    role: 'cabinet-bottom',
    label: '橱柜 · 下层(粮油干货)',
    shortLabel: '下层',
    position: [0, -0.76, -0.04],
    size: [2.32, 0.82, 1.12],
    cameraTarget: [0, -0.72, 0],
    cameraPosition: [2.7, -0.2, 3.7],
    attachment: 'body',
  },
  {
    id: 'cabinet-drawer',
    unit: 'cabinet',
    role: 'cabinet-drawer',
    label: '橱柜 · 底部抽屉',
    shortLabel: '抽屉',
    position: [0, -1.42, 0.34],
    size: [2.24, 0.42, 1.08],
    cameraTarget: [0, -1.35, 0.25],
    cameraPosition: [2.5, -0.5, 3.6],
    attachment: 'drawer-1',
  },
];

const ALL_COMPARTMENTS_BY_ID: Record<CompartmentId, CompartmentMeta> = (() => {
  const map: Record<CompartmentId, CompartmentMeta> = {};
  for (const model of FRIDGE_MODELS) {
    for (const comp of model.compartments) {
      map[comp.id] = comp;
    }
  }
  for (const comp of CABINET_COMPARTMENTS) {
    map[comp.id] = comp;
  }
  return map;
})();

export function getCompartmentMeta(id: CompartmentId): CompartmentMeta | undefined {
  return ALL_COMPARTMENTS_BY_ID[id];
}

export function getCompartmentsForUnit(
  unit: StorageUnitType,
  fridgeModel: FridgeModelType,
): CompartmentMeta[] {
  if (unit === 'cabinet') {
    return CABINET_COMPARTMENTS;
  }
  return FRIDGE_MODEL_MAP[fridgeModel].compartments;
}

export const CATEGORY_LABELS: Record<string, string> = {
  dairy: '乳品蛋类',
  produce: '新鲜蔬果',
  meat_frozen: '肉类冷冻',
  seasoning: '调味酱料',
  instant: '速食干粮',
  beverage: '饮品冲调',
  snack: '休闲零食',
};
