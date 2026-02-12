import apiClient from '../lib/api';

export interface BusinessModule {
  id: number;
  business_id: number;
  module: string;
  is_active: boolean;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  business_name?: string;
}

export interface PromoCode {
  id: number;
  code: string;
  discount_percentage: number;
  max_uses: number;
  used_count: number;
  expiry_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionWithBusiness {
  id: number;
  business_id: number;
  plan_type: string;
  status: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
  transaction_reference: string;
  business_name: string;
}

export const AdminService = {
  // Subscriptions
  getAllSubscriptions: async (): Promise<SubscriptionWithBusiness[]> => {
    const response = await apiClient.get('/admin/subscriptions');
    return response.data;
  },

  // Modules
  getAllModules: async (): Promise<BusinessModule[]> => {
    const response = await apiClient.get('/admin/modules');
    return response.data;
  },

  createModule: async (data: {
    business_id: number;
    module: string;
    is_active: boolean;
    expiry_date?: string;
  }): Promise<BusinessModule> => {
    const response = await apiClient.post('/admin/modules', data);
    return response.data;
  },

  updateModule: async (id: number, data: {
    is_active?: boolean;
    expiry_date?: string;
  }): Promise<BusinessModule> => {
    const response = await apiClient.put(`/admin/modules/${id}`, data);
    return response.data;
  },

  deleteModule: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/modules/${id}`);
  },

  // Promo Codes
  getAllPromoCodes: async (): Promise<PromoCode[]> => {
    const response = await apiClient.get('/admin/promo-codes');
    return response.data;
  },

  createPromoCode: async (data: {
    code: string;
    discount_percentage: number;
    max_uses: number;
    expiry_date: string;
    active: boolean;
  }): Promise<PromoCode> => {
    const response = await apiClient.post('/admin/promo-codes', data);
    return response.data;
  },

  updatePromoCode: async (id: number, data: {
    discount_percentage?: number;
    max_uses?: number;
    expiry_date?: string;
    active?: boolean;
  }): Promise<PromoCode> => {
    const response = await apiClient.put(`/admin/promo-codes/${id}`, data);
    return response.data;
  },

  deletePromoCode: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/promo-codes/${id}`);
  },

  // Businesses
  getAllBusinesses: async (): Promise<Business[]> => {
    const response = await apiClient.get('/admin/businesses');
    return response.data;
  },

  createBusiness: async (data: {
    tenant_id: string;
    name: string;
    type: string;
    address?: string;
    city?: string;
    currency?: string;
  }): Promise<Business> => {
    const response = await apiClient.post('/admin/businesses', data);
    return response.data;
  },

  updateBusiness: async (id: number, data: Partial<Business>): Promise<Business> => {
    const response = await apiClient.put(`/admin/businesses/${id}`, data);
    return response.data;
  },

  deleteBusiness: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/businesses/${id}`);
  },

  // Subscriptions Actions
  renewSubscription: async (data: {
    business_id: number;
    plan_type: string;
    duration_days: number;
    amount: number;
  }): Promise<any> => {
    const response = await apiClient.post('/admin/subscriptions/renew', data);
    return response.data;
  },
};

export interface Business {
  id: number;
  tenant_id: string;
  name: string;
  type: string;
  address?: string;
  city?: string;
  currency: string;
  subscription_status: string;
  installer_id?: number;
  created_at: string;
}
