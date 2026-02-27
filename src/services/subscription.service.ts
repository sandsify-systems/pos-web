
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
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionStatusResponse {
  subscription?: Subscription;
  modules?: BusinessModule[];
}

export interface PaymentMethod {
  id: number;
  business_id: number;
  email: string;
  card_category: string;
  card_type: string;
  bank: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  brand: string;
  is_default: boolean;
  created_at?: string;
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

  getHistory: async (): Promise<Subscription[]> => {
    const response = await apiClient.get('/subscription/history');
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

  getSavedCards: async (): Promise<PaymentMethod[]> => {
    const response = await apiClient.get('/subscription/cards');
    return response.data;
  },

  chargeSavedCard: async (data: { plan_type: string; modules: string[]; bundle_code?: string; card_id: number }): Promise<Subscription> => {
    const response = await apiClient.post('/subscription/charge-saved', data);
    return response.data;
  },

  deleteSavedCard: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/subscription/cards/${id}`);
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

  getTrialChecklist: async (): Promise<TrialChecklist> => {
    const response = await apiClient.get('/trial-checklist');
    return response.data;
  },

  // Affiliates/Influencers
  getAffiliates: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/affiliates');
    return response.data;
  },

  createInfluencer: async (data: any): Promise<any> => {
    const response = await apiClient.post('/admin/affiliates', data);
    return response.data;
  },

  getAffiliateStats: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/admin/affiliates/${id}/stats`);
    return response.data;
  },

  updateAffiliate: async (id: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/admin/affiliates/${id}`, data);
    return response.data;
  },

  deleteAffiliate: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/admin/affiliates/${id}`);
    return response.data;
  },
};

export interface TrialChecklist {
  id: number;
  business_id: number;
  business_info_completed: boolean;
  device_connected: boolean;
  products_added_count: number;
  payment_configured: boolean;
  receipt_tested: boolean;
  cashier_created: boolean;
  login_tested: boolean;
  first_sale_recorded: boolean;
  report_viewed: boolean;
}

