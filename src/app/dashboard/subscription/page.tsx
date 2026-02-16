
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  Check, 
  AlertCircle, 
  CreditCard, 
  Zap, 
  ShieldCheck, 
  Users, 
  Package,
  ArrowRight,
  ArrowLeft,
  Globe,
  Sparkles,
  Lock,
  Loader2,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Script from 'next/script';

export default function SubscriptionPage() {
  const router = useRouter();
  const { plans, availableModules, availableBundles, isSubscribed, subscription, modules: activeModules, daysRemaining, processSubscription, loading: subLoading } = useSubscription();
  const { business, user } = useAuth();
  
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isBasicMode, setIsBasicMode] = useState(false);

  // Initialize from current subscription
  useEffect(() => {
    if (activeModules.length > 0) {
        setSelectedModules(activeModules.map(m => m.module));
    }
    if (subscription) {
       const planType = subscription.plan_type;
       if (planType.includes('ANNUAL')) setBillingCycle('ANNUAL');
       else if (planType.includes('QUARTERLY')) setBillingCycle('QUARTERLY');
       else setBillingCycle('MONTHLY');
       
       if (planType.includes('SERVICE')) setIsBasicMode(true);
    }
  }, [activeModules, subscription]);

  const toggleModule = (moduleType: string) => {
    setSelectedModules(prev => {
      const next = prev.includes(moduleType) 
        ? prev.filter(m => m !== moduleType) 
        : [...prev, moduleType];
      
      return next;
    });
  };

  const { finalTotal, originalTotal, savings, discountPercent, currentBasePlan } = useMemo(() => {
    const basePlanMonthly = plans.find(p => p.type === (isBasicMode ? 'SERVICE_MONTHLY' : 'MONTHLY'));
    const currentBasePlan = plans.find(p => p.type === (isBasicMode ? `SERVICE_${billingCycle}` : billingCycle));
    
    const monthMultiplier = billingCycle === 'ANNUAL' ? 12 : billingCycle === 'QUARTERLY' ? 3 : 1;
    const cycleDiscount = billingCycle === 'ANNUAL' ? 0.85 : billingCycle === 'QUARTERLY' ? 0.9 : 1;
    
    // Calculate Original Total (Pure monthly rates, no discounts)
    let originalModulesTotal = 0;
    selectedModules.forEach(modType => {
        const mod = availableModules.find(m => m.type === modType);
        if (mod) originalModulesTotal += mod.price * monthMultiplier;
    });
    const originalTotal = (basePlanMonthly?.price || 0) * monthMultiplier + originalModulesTotal;

    // Calculate Final Total
    let finalModulesTotal = 0;
    
    selectedModules.forEach(modType => {
        const mod = availableModules.find(m => m.type === modType);
        if (mod) finalModulesTotal += mod.price * monthMultiplier * cycleDiscount;
    });

    const finalTotal = (currentBasePlan?.price || 0) + finalModulesTotal;
    const savings = originalTotal - finalTotal;

    return {
        finalTotal,
        originalTotal,
        savings,
        discountPercent: Math.round((savings / originalTotal) * 100) || 0,
        currentBasePlan
    };
  }, [billingCycle, selectedModules, plans, availableModules, isBasicMode]);

  const handlePay = () => {
    if (!user || !business) {
      toast.error('Session expired. Please login again.');
      return;
    }

    if (!(window as any).PaystackPop) {
      toast.error('Payment gateway not loaded yet. Please wait a moment.');
      return;
    }

    setProcessing(true);
    
    const handler = (window as any).PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_c4d6b6735388bf536ab1cc72ad8961397078eb08', 
      email: user.email,
      amount: Math.round(finalTotal * 100), // Kobo
      currency: 'NGN',
      metadata: {
        custom_fields: [
          {
            display_name: "Business ID",
            variable_name: "business_id",
            value: business.id
          }
        ]
      },
      callback: function(response: any) {
        onPaymentSuccess(response);
      },
      onClose: () => {
        setProcessing(false);
        toast('Payment cancelled', { icon: '⚠️' });
      }
    });

    handler.openIframe();
  };

  const onPaymentSuccess = async (response: any) => {
    try {
      toast.loading('Activating your plan...', { id: 'activation' });
      const planType = isBasicMode ? `SERVICE_${billingCycle}` : billingCycle;
      
      await processSubscription(
        planType, 
        response.reference, 
        selectedModules
      );
      
      toast.success('Subscription updated successfully!', { id: 'activation' });
    } catch (error) {
      toast.error('Update failed. Please contact support.', { id: 'activation' });
    } finally {
      setProcessing(false);
    }
  };

  if (subLoading && !subscription) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Loading Subscription details...</p>
      </div>
    );
  }

  return (
    <form className="p-8 max-w-7xl mx-auto space-y-12" onSubmit={(e) => e.preventDefault()}>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-bold transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-widest">Back to Dashboard</span>
          </button>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Manage Subscription</h1>
            <p className="text-slate-500 font-medium">Upgrade or renew your business terminal features.</p>
          </div>
        </div>
        
        {/* Current Status Badge */}
        <div className={cn(
          "px-6 py-4 rounded-[2rem] border-2 flex items-center gap-4 transition-all shadow-sm",
          isSubscribed 
            ? "bg-emerald-50 border-emerald-100/50 text-emerald-900" 
            : "bg-rose-50 border-rose-100/50 text-rose-900"
        )}>
           <div className={cn(
             "w-10 h-10 rounded-full flex items-center justify-center shadow-inner",
             isSubscribed ? "bg-emerald-200 text-emerald-700" : "bg-rose-200 text-rose-700"
           )}>
             {isSubscribed ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Status</p>
              <h4 className="font-black text-sm uppercase leading-none">
                {isSubscribed ? 'Active Account' : 'Payment Required'}
              </h4>
           </div>
           {isSubscribed && (
             <div className="ml-4 pl-4 border-l border-emerald-200/50">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Days Left</p>
                <h4 className="font-black text-sm leading-none">{daysRemaining} Days</h4>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
            
            {/* 1. Cycle & Base Plan */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-lg">1</div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight lowercase">Choose your plan</h2>
                </div>

                {/* Plan Toggle */}
                <div className="bg-slate-100 p-1.5 rounded-2xl flex relative mb-8">
                   <button
                    type="button"
                    onClick={() => setIsBasicMode(false)}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all relative z-10",
                      !isBasicMode ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                   >
                    Growing Business
                   </button>
                   <button
                    type="button"
                    onClick={() => {
                        setIsBasicMode(true);
                        setSelectedModules([]); // Clear modules
                    }}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all relative z-10",
                      isBasicMode ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                   >
                    Starter / Basic
                   </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'MONTHLY', label: 'Monthly', discount: 'Normal Rate', icon: Calendar },
                    { id: 'QUARTERLY', label: 'Quarterly', discount: isBasicMode ? '+1 User Bonus' : 'Save 10%', icon: Package },
                    { id: 'ANNUAL', label: 'Annual', discount: isBasicMode ? '+3 Users Bonus' : 'Save 15%', icon: Sparkles }
                  ].map((cycle) => (
                    <div 
                      key={cycle.id}
                      onClick={() => setBillingCycle(cycle.id as any)}
                      className={cn(
                        "p-5 rounded-3xl border-2 cursor-pointer transition-all relative overflow-hidden group",
                        billingCycle === cycle.id 
                          ? "border-teal-500 bg-white shadow-xl shadow-teal-500/5 ring-4 ring-teal-500/10" 
                          : "border-slate-100 bg-white hover:border-slate-200"
                      )}
                    >
                       <cycle.icon className={cn("mb-3 transition-colors", billingCycle === cycle.id ? "text-teal-600" : "text-slate-300")} size={24} />
                       <p className={cn("text-sm font-black transition-colors", billingCycle === cycle.id ? "text-teal-600" : "text-slate-700")}>{cycle.label}</p>
                       <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{cycle.discount}</p>
                       {billingCycle === cycle.id && <div className="absolute top-4 right-4 w-2 h-2 bg-teal-500 rounded-full" />}
                    </div>
                  ))}
                </div>
            </section>



            {/* 2. Detailed Customization */}
            <section className="space-y-6 pb-12">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-lg">2</div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight lowercase">
                        {isBasicMode ? 'Included Features' : 'Customize Features'}
                    </h2>
                </div>

                {isBasicMode ? (
                    <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-teal-100/50 flex items-center justify-center mb-4 text-teal-600">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">Basic Sales Mode</h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                            Perfect for small shops & kiosks. Includes sales tracking, receipt printing, and a catalog of up to 25 items.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Essential Features Only</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableModules.map((mod) => {
                         const isSelected = selectedModules.includes(mod.type);
                         return (
                           <div 
                              key={mod.type}
                              onClick={() => toggleModule(mod.type)}
                              className={cn(
                                  "p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                                  isSelected 
                                      ? "border-teal-500 bg-teal-50/20 shadow-lg shadow-teal-500/5" 
                                      : "border-slate-100 bg-white hover:border-slate-200"
                              )}
                           >
                              <div className="flex items-center gap-4">
                                  <div className={cn(
                                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                      isSelected ? "bg-teal-500 border-teal-500 text-white" : "border-slate-200 bg-slate-50"
                                  )}>
                                      {isSelected && <Check size={14} strokeWidth={4} />}
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-sm text-slate-800">{mod.name}</h4>
                                      <p className="text-[10px] text-slate-400 font-medium">{formatCurrency(mod.price)} / month</p>
                                  </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                 <ArrowRight size={14} className="text-teal-400" />
                              </div>
                           </div>
                         );
                    })}
                </div>
                )}
            </section>
        </div>

        {/* Sidebar Summary Area */}
        <div className="lg:col-span-4 sticky top-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-8">
              <div className="pb-6 border-b border-slate-100">
                 <h3 className="font-black text-2xl text-slate-900 tracking-tighter">Order Summary</h3>
                 <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">Upgrade your experience</p>
              </div>

              <div className="space-y-6">
                 {/* Base Plan */}
                 <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Base Terminal</p>
                        <p className="text-sm font-bold text-slate-800">{currentBasePlan?.name || 'Base Plan'}</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                        {formatCurrency(plans.find(p => p.type === (isBasicMode ? `SERVICE_${billingCycle}` : billingCycle))?.price || 0)}
                    </p>
                 </div>

                 {/* Modules */}
                 {selectedModules.length > 0 && (
                     <div className="space-y-3 pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Premium Add-ons</p>
                        {selectedModules.map(modType => {
                            const mod = availableModules.find(m => m.type === modType);
                            if (!mod) return null;
                            const monthMultiplier = billingCycle === 'ANNUAL' ? 12 : billingCycle === 'QUARTERLY' ? 3 : 1;
                            const discount = billingCycle === 'ANNUAL' ? 0.85 : billingCycle === 'QUARTERLY' ? 0.9 : 1;
                            return (
                                <div key={modType} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                    <span className="text-xs font-bold text-slate-600 truncate max-w-[140px]">{mod.name}</span>
                                    <span className="text-xs font-black text-slate-900">{formatCurrency(mod.price * monthMultiplier * discount)}</span>
                                </div>
                            );
                        })}
                     </div>
                 )}
              </div>

              {/* Total Calculation */}
              <div className="pt-8 border-t-2 border-dashed border-slate-100">
                 <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Final Total</p>
                        <p className="text-[9px] text-teal-600 font-bold uppercase">{billingCycle} Billing</p>
                    </div>
                    <div className="text-right">
                        {savings > 0 && (
                            <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-300 line-through">{formatCurrency(originalTotal)}</span>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-100">-{discountPercent}% OFF</span>
                            </div>
                        )}
                        <h2 className="text-4xl font-black text-teal-600 tracking-tighter leading-none">
                            {formatCurrency(finalTotal)}
                        </h2>
                    </div>
                 </div>

                 <button 
                  type="button"
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full py-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[2rem] font-black text-base transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                    {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Secure Payment
                            <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
              </div>

              {/* Trust badges */}
              <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        <Lock size={12} className="text-teal-500/50" />
                        256-bit Encrypted
                    </div>
                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                        <ShieldCheck size={12} className="text-teal-500/50" />
                        Buyer Protected
                    </div>
                  </div>
                  <div className="flex justify-center flex-col items-center gap-2 opacity-30 grayscale group-hover:grayscale-0 transition-all">
                      <img src="https://paystack.com/assets/img/login/paystack-logo.png" alt="Paystack" className="h-4" />
                  </div>
              </div>
            </div>
            
            {/* Feature Highlights beneath summary */}
            <div className="mt-8 p-6 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
                 <Zap className="absolute right-[-20%] bottom-[-20%] w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                 <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Users size={16} className="text-teal-400" />
                        </div>
                        <h4 className="font-black text-lg tracking-tight">Plan Benefits</h4>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                            <div>
                                <p className="text-xs font-bold text-white">
                                    {currentBasePlan ? (currentBasePlan as any).UserLimit || 1 : 1} User Accounts
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                    {isBasicMode && billingCycle === 'MONTHLY' ? 'Upgrade to Quarterly for +1 User' : 
                                     isBasicMode && billingCycle === 'QUARTERLY' ? 'Includes 1 Bonus User' :
                                     isBasicMode && billingCycle === 'ANNUAL' ? 'Includes 3 Bonus Users' : 'Standard Access'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                            <div>
                                <p className="text-xs font-bold text-white">
                                    {isBasicMode ? '25 Product Limit' : 'Unlimited Products'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                    {isBasicMode ? 'Perfect for kiosks & small shops' : 'Full inventory management'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 mt-4">
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                            Upgrade anytime. Your new features are activated instantly across all your business terminals.
                        </p>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </form>
  );
}
