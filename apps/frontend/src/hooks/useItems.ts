import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkSKUAvailability,
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
} from "../api/items";
import { itemKeys } from "../api/queryKeys";
import type { ItemInput, ListItemsParams } from "../types/item";

export function useItems(params: ListItemsParams = {}) {
  return useQuery({
    queryKey: itemKeys.list(params),
    queryFn: ({ signal }) => listItems(params, signal),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: ({ signal }) => getItem(id, signal),
    enabled: Boolean(id),
  });
}

export function useSKUAvailability(
  sku: string,
  excludeId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: itemKeys.availability(sku, excludeId),
    queryFn: ({ signal }) => checkSKUAvailability(sku, excludeId, signal),
    enabled,
    retry: false,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ItemInput) => createItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useUpdateItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ItemInput) => updateItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });
}
