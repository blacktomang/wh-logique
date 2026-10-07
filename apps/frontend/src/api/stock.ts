import type { Envelope } from "../types/api";
import type { ReceiveStockInput, Stock, StockLog } from "../types/stock";
import { request } from "./client";

export function getItemStock(itemId: string): Promise<Envelope<Stock[]>> {
  return request<Stock[]>(`/stock/${itemId}`);
}

export function receiveStock(input: ReceiveStockInput): Promise<Envelope<Stock[]>> {
  return request<Stock[]>("/stock/receive", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getItemStockLogs(itemId: string): Promise<Envelope<StockLog[]>> {
  return request<StockLog[]>(`/stock/${itemId}/logs`);
}
