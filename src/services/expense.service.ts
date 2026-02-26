
import apiClient from '../lib/api';

export interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export const ExpenseService = {
  getExpenses: async (from?: string, to?: string): Promise<Expense[]> => {
    let url = '/expenses';
    const params = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const res = await apiClient.get(url);
    return res.data;
  },

  createExpense: async (data: { amount: number; category: string; description: string; date: string }): Promise<Expense> => {
    const res = await apiClient.post('/expenses', data);
    return res.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  }
};
