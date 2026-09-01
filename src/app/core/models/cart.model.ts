export interface CartLine {
  productId: string;
  sku: string;
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  imageSeed: number;
  categoryId?: string;
}

export interface CartTotals {
  itemCount: number;
  subTotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
}

export interface OrderLine {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  placedAt: string;
  status: string;
  lines: OrderLine[];
  total: number;
}
