
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

  // Get audit trail logs for a date
  getAuditTrail: async (date?: string, actionType?: string): Promise<AuditLogEntry[]> => {
    let url = '/compliance/audit-trail?';
    if (date) url += `date=${date}&`;
    if (actionType) url += `action_type=${actionType}`;
    const res = await apiClient.get(url);
    return res.data;
  },
};
