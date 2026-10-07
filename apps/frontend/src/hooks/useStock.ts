import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getItemStock, getItemStockLogs, receiveStock } from "../api/stock";
import type { ReceiveStockInput } from "../types/stock";

const stockKeys = {
  all: ["stock"] as const,
  item: (itemId: string) => [...stockKeys.all, itemId] as const,
  logs: (itemId: string) => [...stockKeys.item(itemId), "logs"] as const,
};

export function useItemStock(itemId: string) {
  return useQuery({
    queryKey: stockKeys.item(itemId),
    queryFn: () => getItemStock(itemId),
    enabled: Boolean(itemId),
  });
}

export function useItemStockLogs(itemId: string) {
  return useQuery({
    queryKey: stockKeys.logs(itemId),
    queryFn: () => getItemStockLogs(itemId),
    enabled: Boolean(itemId),
  });
}

export function useReceiveStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReceiveStockInput) => receiveStock(input),
    onSuccess: (_response, input) => {
      const itemIds = new Set(input.lines.map((line) => line.item_id));
      itemIds.forEach((itemId) => {
        queryClient.invalidateQueries({ queryKey: stockKeys.item(itemId) });
      });
    },
  });
}
