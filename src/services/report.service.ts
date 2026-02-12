
import apiClient from '../lib/api';

export interface DailyReport {
  date: string;
  total_sales: number;
  total_transactions: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
  average_sale: number;
}

export interface SalesReport {
  total_sales: number;
  total_transactions: number;
  cash_sales: number;
  card_sales: number;
  transfer_sales: number;
  mobile_money_sales: number;
  average_sale: number;
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

  getSales: async (params: { from: string; to: string; status?: string }): Promise<any[]> => {
    let url = `/sales?from=${params.from}&to=${params.to}`;
    if (params.status) url += `&status=${params.status}`;
    const res = await apiClient.get(url);
    // Check structure - backend usually returns { sales: [...] } or just [...]
    return res.data.sales || res.data; 
  }
};
