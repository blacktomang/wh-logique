import type {
  Item,
  ItemInput,
  ListItemsParams,
  SKUAvailability,
} from "../types/item";
import type { Envelope } from "../types/api";
import { request } from "./client";

export function listItems(
  params: ListItemsParams = {},
  signal?: AbortSignal,
): Promise<Envelope<Item[]>> {
  const search = new URLSearchParams();
  if (params.search) search.set("q", params.search);
  if (params.category) search.set("category", params.category);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const query = search.toString();
  return request<Item[]>(
    `/items${query ? `?${query}` : ""}`,
    signal ? { signal } : {},
  );
}

export function checkSKUAvailability(
  sku: string,
  excludeId?: string,
  signal?: AbortSignal,
): Promise<Envelope<SKUAvailability>> {
  const search = new URLSearchParams({ sku });
  if (excludeId) search.set("exclude_id", excludeId);
  return request<SKUAvailability>(
    `/items/sku-availability?${search}`,
    signal ? { signal } : {},
  );
}

export function getItem(id: string, signal?: AbortSignal): Promise<Envelope<Item>> {
  return request<Item>(`/items/${id}`, signal ? { signal } : {});
}

export function createItem(input: ItemInput): Promise<Envelope<Item>> {
  return request<Item>("/items", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateItem(id: string, input: ItemInput): Promise<Envelope<Item>> {
  return request<Item>(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteItem(id: string): Promise<Envelope<null>> {
  return request<null>(`/items/${id}`, { method: "DELETE" });
}
