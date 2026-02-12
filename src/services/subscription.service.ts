
import apiClient from '../lib/api';

export interface SubscriptionPlan {
  type: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  name: string;
  duration_days: number;
  price: number;
  currency: string;
  user_limit: number;
  product_limit: number;
}

export interface ModulePlan {
  type: string;
  name: string;
  price: number;
  description: string;
}

export interface ModuleBundle {
  code: string;
  name: string;
  price: number;
  modules: string[];
  description: string;
}

export interface BusinessModule {
  id: number;
  business_id: number;
  module: string;
  is_active: boolean;
  expiry_date?: string;
}

export interface Subscription {
  id: number;
  business_id: number;
  plan_type: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "GRACE_PERIOD" | "PENDING_PAYMENT";
  start_date: string;
  end_date: string;
  amount_paid: number;
  payment_method?: string;
  transaction_reference: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionStatusResponse {
  subscription?: Subscription;
  modules?: BusinessModule[];
}

export const SubscriptionService = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get('/subscription/plans');
    return response.data;
  },

  getPricing: async (): Promise<{ plans: SubscriptionPlan[], modules: ModulePlan[], bundles: ModuleBundle[] }> => {
    const response = await apiClient.get('/subscription/pricing');
    return response.data;
  },

  getStatus: async (): Promise<Subscription | { status: "NONE" }> => {
    const response = await apiClient.get('/subscription/status');
    return response.data;
  },

  subscribe: async (planType: string, reference: string, modules?: string[], bundleCode?: string, promoCode?: string): Promise<Subscription> => {
    let url = '/subscription/subscribe';
    if (promoCode) {
      url += `?promo_code=${promoCode}`;
    }
    const response = await apiClient.post(url, {
      plan_type: planType,
      reference,
      modules: modules || [],
      bundle_code: bundleCode,
    });
    return response.data;
  },

  validatePromoCode: async (code: string): Promise<{ success: boolean; discount_percentage: number }> => {
    const response = await apiClient.get(`/subscription/promo/validate?code=${code}`);
    return response.data;
  },

  // Admin
  getAllSubscriptions: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/subscriptions');
    return response.data;
  },

  getAllCommissions: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/commissions');
    return response.data;
  },

  updateCommissionStatus: async (id: number, status: string): Promise<any> => {
    const response = await apiClient.patch(`/admin/commissions/${id}/status`, { status });
    return response.data;
  },

  getCommissionSettings: async (): Promise<any> => {
    const response = await apiClient.get('/admin/commissions/settings');
    return response.data;
  },

  updateCommissionSettings: async (settings: any): Promise<any> => {
    const response = await apiClient.put('/admin/commissions/settings', settings);
    return response.data;
  },

  // Training Resources
  getTrainingResources: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/training-resources');
    return response.data;
  },

  createTrainingResource: async (data: any): Promise<any> => {
    const response = await apiClient.post('/admin/training-resources', data);
    return response.data;
  },

  updateTrainingResource: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/admin/training-resources/${id}`, data);
    return response.data;
  },

  deleteTrainingResource: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/admin/training-resources/${id}`);
    return response.data;
  },
};
