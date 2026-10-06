export const ITEM_CATEGORIES = [
  "raw_material",
  "finished_goods",
  "packaging",
  "spare_part",
  "consumable",
  "equipment",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ITEM_UNITS = [
  "pcs",
  "kg",
  "gr",
  "ltr",
  "box",
  "carton",
  "pallet",
] as const;

export type ItemUnit = (typeof ITEM_UNITS)[number];

export interface Item {
  id: string;
  sku: string;
  name: string;
  category: ItemCategory;
  unit: ItemUnit;
  created_at: string;
  deleted_at: string | null;
}

export interface ItemInput {
  sku: string;
  name: string;
  category: ItemCategory;
  unit: ItemUnit;
}

export interface ListItemsParams {
  search?: string;
  category?: ItemCategory;
  page?: number;
  limit?: number;
}
