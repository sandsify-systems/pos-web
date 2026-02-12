
import apiClient from '../lib/api';
import { SaleRequest, SaleResponse } from '../types/pos';

export const SalesService = {
  createSale: async (data: SaleRequest): Promise<SaleResponse> => {
    const res = await apiClient.post('/sales', data);
    return res.data;
  },

  getSalesHistory: async (): Promise<any[]> => {
    const res = await apiClient.get('/sales');
    return res.data;
  },

  getSaleById: async (id: number): Promise<any> => {
    const res = await apiClient.get(`/sales/${id}`);
    return res.data;
  },

  updatePreparationStatus: async (saleId: number | string, status: string): Promise<any> => {
    const res = await apiClient.patch(`/sales/${saleId}/preparation`, { status });
    return res.data;
  },

  updateItemPreparationStatus: async (saleId: number | string, itemId: number | string, status: string): Promise<any> => {
    const res = await apiClient.patch(`/sales/${saleId}/items/${itemId}/preparation`, { status });
    return res.data;
  },

  voidSale: async (id: number, reason: string): Promise<any> => {
    const res = await apiClient.post(`/sales/${id}/void`, { reason });
    return res.data;
  },

  getActivities: async (): Promise<any[]> => {
    const res = await apiClient.get('/activities');
    return res.data;
  }
};
