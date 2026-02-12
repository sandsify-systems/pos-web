
'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { SubscriptionService, type Subscription, type SubscriptionPlan, type BusinessModule, type ModuleBundle } from "../services/subscription.service";
import { useAuth } from "./AuthContext";

interface SubscriptionContextType {
  subscription: Subscription | null;
  plans: SubscriptionPlan[];
  modules: BusinessModule[];
  loading: boolean;
  isSubscribed: boolean;
  isExpired: boolean;
  isGracePeriod: boolean;
  daysRemaining: number;
  availableModules: any[]; // pricing info
  availableBundles: ModuleBundle[];
  hasModule: (module: string) => boolean;
  refreshStatus: () => Promise<void>;
  processSubscription: (planType: string, reference: string, modules?: string[], bundleCode?: string, promoCode?: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('subscription_data');
      try {
        return cached ? JSON.parse(cached) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [availableBundles, setAvailableBundles] = useState<ModuleBundle[]>([]);
  const [modules, setModules] = useState<BusinessModule[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    // If auth is still loading, keep subscription loading too
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    // Super admins bypass subscription checks
    if (user.role === 'super_admin') {
      const mockSub: Subscription = {
        id: 0,
        business_id: 0,
        plan_type: 'ADMIN' as any,
        status: 'ACTIVE',
        start_date: new Date().toISOString(),
        end_date: new Date(2099, 11, 31).toISOString(),
        amount_paid: 0,
        payment_method: 'ADMIN',
        transaction_reference: 'SUPER_ADMIN_ACCESS',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSubscription(mockSub);
      setModules([]);
      setPlans([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [status, pricing] = await Promise.all([
        SubscriptionService.getStatus(),
        SubscriptionService.getPricing(),
      ]);
      
      if ("status" in status && status.status === "NONE") {
        setSubscription(null);
        setModules([]);
        localStorage.removeItem('subscription_data');
      } else {
        const statusData = status as any;
        const subData = statusData.subscription || statusData;
        const modulesData = statusData.modules || [];
        setSubscription(subData);
        setModules(modulesData);
        localStorage.setItem('subscription_data', JSON.stringify(subData));
      }
      setPlans(pricing.plans);
      setAvailableModules(pricing.modules);
      setAvailableBundles(pricing.bundles || []);
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Initial mount effect - only run once or when auth state changes meaningfully
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const processSubscription = async (planType: string, reference: string, modules?: string[], bundleCode?: string, promoCode?: string) => {
    try {
      setLoading(true);
      await SubscriptionService.subscribe(planType, reference, modules, bundleCode, promoCode);
      await refreshStatus();
    } catch (error) {
      console.error("Subscription failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isSubscribed = subscription?.status === "ACTIVE";
  const isExpired = subscription?.status === "EXPIRED" || subscription?.status === "PENDING_PAYMENT" || subscription?.status === "GRACE_PERIOD";
  const isGracePeriod = subscription?.status === "GRACE_PERIOD";
  
  const daysRemaining = subscription?.end_date 
    ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const hasModule = (module: string): boolean => {
    return modules.some(m => m.module === module && m.is_active);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        plans,
        modules,
        loading,
        isSubscribed,
        isExpired,
        isGracePeriod,
        daysRemaining,
        availableModules,
        availableBundles,
        hasModule,
        refreshStatus,
        processSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
