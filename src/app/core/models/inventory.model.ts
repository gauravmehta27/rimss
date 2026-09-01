export type StockStatus = 'healthy' | 'low' | 'out-of-stock';

export interface InventoryRow {
  sku: string;
  productId: string;
  productName: string;
  categoryName: string;
  color: string;
  size: string;
  quantity: number;
  reorderLevel: number;
  price: number;
  status: StockStatus;
}

export interface StockMovement {
  id: string;
  sku: string;
  productName: string;
  previous: number;
  next: number;
  at: string;
}

export interface InventorySummary {
  skuCount: number;
  productCount: number;
  totalUnits: number;
  lowStock: number;
  outOfStock: number;
  stockValue: number;
  movements: StockMovement[];
}

export interface InventoryQuery {
  search?: string;
  status?: StockStatus | 'all';
  page?: number;
  pageSize?: number;
}
