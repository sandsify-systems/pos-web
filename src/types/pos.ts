
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
  description?: string;
  stock: number;
  category_id: number;
  image_url?: string;
  sku?: string;
  min_stock?: number;
  cost?: number;
  track_by_round?: boolean;
  unit_of_measure?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface PaymentInfo {
  method: string;
  amount: number;
  terminal_provider?: string | null;
}

export interface SaleRequest {
  items: {
    product_id: number;
    quantity: number;
  }[];
  payments: PaymentInfo[];
  tax: number;
  discount: number;
  table_number?: string;
  shift_id?: number;
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
