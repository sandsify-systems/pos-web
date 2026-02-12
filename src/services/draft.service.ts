
import apiClient from '../lib/api';
import { CartItem } from '../types/pos';

export const DraftService = {
  createDraft: async (items: CartItem[], tableNumber?: string, customerName?: string) => {
    const payload = {
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      table_number: tableNumber || "",
      customer_name: customerName || "",
    };
    const response = await apiClient.post("/sales/draft", payload);
    return response.data;
  },

  listDrafts: async () => {
    const response = await apiClient.get("/sales/drafts");
    return response.data.data || [];
  },

  deleteDraft: async(id: number) => {
    const response = await apiClient.delete(`/sales/draft/${id}`);
    return response.data;
  },

  resumeDraft: async (id: number) => {
     // This endpoint typically validates if the draft can be resumed
     const response = await apiClient.post(`/sales/draft/${id}/resume`);
     return response.data;
  }
};
