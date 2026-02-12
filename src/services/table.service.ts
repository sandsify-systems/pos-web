
import apiClient from '../lib/api';

export interface Table {
  id: number;
  business_id: number;
  table_number: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  current_order_id?: number;
}

export const TableService = {
  listTables: async (): Promise<Table[]> => {
    const response = await apiClient.get('/tables');
    return response.data.data;
  },

  createTable: async (data: Partial<Table>): Promise<Table> => {
    const response = await apiClient.post('/tables', data);
    return response.data.data;
  },

  updateTable: async (id: number, data: Partial<Table>): Promise<Table> => {
    const response = await apiClient.put(`/tables/${id}`, data);
    return response.data.data;
  },

  deleteTable: async (id: number): Promise<void> => {
    await apiClient.delete(`/tables/${id}`);
  }
};
