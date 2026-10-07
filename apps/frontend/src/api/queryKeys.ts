import { listItems } from "../api/items";

export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (params: { search?: string; category?: string; page?: number; limit?: number }) =>
    [...itemKeys.lists(), params] as const,
  availability: (sku: string, excludeId?: string) =>
    [...itemKeys.all, "sku-availability", sku, excludeId ?? null] as const,
  details: () => [...itemKeys.all, "detail"] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

// Re-exported to keep query keys and fetchers co-located with their feature.
export { listItems };
