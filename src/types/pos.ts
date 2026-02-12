
export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  category_id: number;
  image_url?: string;
  sku?: string;
  min_stock_level?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface SaleRequest {
  items: {
    product_id: number;
    quantity: number;
  }[];
  payment_method: string;
  amount_paid: number;
  tax: number;
  discount: number;
  table_number?: string;
}

export interface SaleResponse {
  sale: Sale;
  items: any[];
}

export type PrepStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';

export interface Sale {
  id: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  paymentMethod?: string; 
  status: string;
  user_id: string; 
  userId?: string;
  preparation_status?: PrepStatus;
  table_number?: string;
  customer_name?: string;
  created_at: string;
  createdAt?: string;
  items?: any[];
}
