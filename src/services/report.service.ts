
import apiClient from '../lib/api';

export interface DailyReport {
  date: string;
  total_sales: number;
  total_cost: number;
  total_profit: number;
  total_transactions: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
  total_expenses: number;
  net_profit: number;
  average_sale: number;
  // Bulk Inventory (LPG)
  opening_stock?: number;
  closing_stock?: number;
  stock_purchased?: number;
  stock_sold?: number;
  stock_variance?: number;
}

export interface SalesReport {
  total_sales: number;
  total_cost: number;
  total_profit: number;
  total_transactions: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
  mobile_money_sales: number;
  total_expenses: number;
  net_profit: number;
  average_sale: number;
  // Bulk Inventory (LPG)
  opening_stock?: number;
  closing_stock?: number;
  stock_purchased?: number;
  stock_sold?: number;
  stock_variance?: number;
}

export interface ProductProfitStat {
  product_id: number;
  product_name: string;
  total_qty: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface MonthlySummaryItem {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

export const ReportService = {
  getDailyReport: async (date?: string): Promise<DailyReport> => {
    const url = date ? `/sales/reports/daily?date=${date}` : '/sales/reports/daily';
    const res = await apiClient.get(url);
    return res.data;
  },

  getSalesReport: async (startDate: string, endDate: string): Promise<SalesReport> => {
    const res = await apiClient.get(`/sales/reports/range?start_date=${startDate}&end_date=${endDate}`);
    return res.data;
  },

  getProductProfitReport: async (from?: string, to?: string): Promise<ProductProfitStat[]> => {
    let url = '/sales/reports/products';
    const params = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const res = await apiClient.get(url);
    return res.data || [];
  },

  getMonthlyReport: async (months: number = 6): Promise<MonthlySummaryItem[]> => {
    const res = await apiClient.get(`/sales/reports/monthly?months=${months}`);
    return res.data || [];
  },

  getSales: async (params: { from: string; to: string; status?: string }): Promise<any[]> => {
    let url = `/sales?from=${params.from}&to=${params.to}`;
    if (params.status) url += `&status=${params.status}`;
    const res = await apiClient.get(url);
    // Check structure - backend usually returns { sales: [...] } or just [...]
    return res.data.sales || res.data || []; 
  }
};
