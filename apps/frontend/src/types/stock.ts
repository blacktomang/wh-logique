export interface Stock {
  id: string;
  item_id: string;
  location_id: string;
  qty: number;
  updated_at: string;
}

export interface StockLog {
  id: string;
  item_id: string;
  location_id: string;
  qty: number;
  created_at: string;
}

export interface ReceiveStockLine {
  item_id: string;
  location_id: string;
  qty: number;
}

export interface ReceiveStockInput {
  lines: ReceiveStockLine[];
}
