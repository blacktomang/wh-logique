import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createItem, deleteItem, getItem, listItems, updateItem } from "../api/items";
import { itemKeys } from "../api/queryKeys";
import type { ItemInput, ListItemsParams } from "../types/item";

export function useItems(params: ListItemsParams = {}) {
  return useQuery({
    queryKey: itemKeys.list(params),
    queryFn: () => listItems(params),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => getItem(id),
    enabled: Boolean(id),
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
