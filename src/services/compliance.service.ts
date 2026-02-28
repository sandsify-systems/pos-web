
import apiClient from '../lib/api';

export interface AuditLogEntry {
  id: number;
  sale_id: number;
  business_id: number;
  action_type: string;
  performed_by: number;
  details: string;
  created_at: string;
  user_name: string;
}

export const ComplianceService = {
  // Download tax report as CSV
  downloadTaxReport: async (startDate: string, endDate: string): Promise<Blob> => {
    const res = await apiClient.get(
      `/compliance/tax-report?start_date=${startDate}&end_date=${endDate}`,
      { responseType: 'blob' }
    );
    return res.data;
  },

  // Get audit trail logs for a date range
  getAuditTrail: async (startDate?: string, endDate?: string, actionType?: string): Promise<AuditLogEntry[]> => {
    const res = await apiClient.get('/compliance/audit-trail', {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        action_type: actionType 
      }
    });
    return res.data;
  },
};
