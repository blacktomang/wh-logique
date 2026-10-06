import { listItems } from "../api/items";

export const itemKeys = {
  all: ["items"] as const,
  lists: () => [...itemKeys.all, "list"] as const,
  list: (params: { category?: string; page?: number; limit?: number }) =>
    [...itemKeys.lists(), params] as const,
  details: () => [...itemKeys.all, "detail"] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};

// Re-exported to keep query keys and fetchers co-located with their feature.
export { listItems };
