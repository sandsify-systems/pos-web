
import apiClient from '../lib/api';

export interface Shift {
  id: number;
  business_id: number;
  user_id: number;
  start_time: string;
  end_time: string | null;
  start_cash: number;
  end_cash: number | null;
  status: "open" | "closed";
  terminal_id?: number;
  total_sales: number;
  transaction_count: number;
  total_cash_sales: number;
  total_card_sales: number;
  total_transfer_sales: number;
  total_external_terminal_sales: number;
  total_credit_sales: number;
  expected_cash: number;
  cash_variance: number;
  user_name?: string;
  closed_by_name?: string;
  notes?: string;
}

export interface ShiftSummary {
  expected_cash: number;
  total_sales: number;
  transaction_count: number;
  cash_variance: number;
}

export const ShiftService = {
  startShift: async (startCash: number, terminalId?: number): Promise<Shift> => {
    const response = await apiClient.post("/shifts/start", {
      start_cash: startCash,
      terminal_id: terminalId
    });
    return response.data.data;
  },

  endShift: async (shiftId: number, endCash: number, notes?: string): Promise<Shift> => {
    const response = await apiClient.post(`/shifts/${shiftId}/end`, {
      end_cash: endCash,
      notes: notes
    });
    return response.data.data;
  },

  getActiveShift: async (): Promise<Shift | null> => {
    try {
      const response = await apiClient.get("/shifts/active");
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  getShiftSummary: async (shiftId: number): Promise<ShiftSummary> => {
    const response = await apiClient.get(`/shifts/${shiftId}/summary`);
    return response.data.data;
  },

  listShifts: async (): Promise<Shift[]> => {
    const response = await apiClient.get("/shifts");
    return response.data.data;
  }
};
