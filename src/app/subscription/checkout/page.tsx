
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  CreditCard, 
  ShieldCheck, 
  Package, 
  Check, 
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
  Globe,
  Sparkles,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Script from 'next/script';

export default function CheckoutPage() {
  const router = useRouter();
  const { business, user } = useAuth();
  const { plans, availableModules, availableBundles, subscription, modules: activeModules, isSubscribed, processSubscription, loading: subLoading } = useSubscription();
  
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  // Initialize from previous subscription if available
  useEffect(() => {
    if (activeModules.length > 0) {
        setSelectedModules(activeModules.map(m => m.module));
    }
    if (subscription) {
       // Extract cycle from plan type (e.g., "SERVICE_ANNUAL" -> "ANNUAL")
       const planType = subscription.plan_type;
       if (planType.includes('ANNUAL')) setBillingCycle('ANNUAL');
       else if (planType.includes('QUARTERLY')) setBillingCycle('QUARTERLY');
       else setBillingCycle('MONTHLY');
    }
  }, [activeModules, subscription]);

  // Redirect if fully active
  useEffect(() => {
    if (!subLoading && business && isSubscribed) {
      router.push('/dashboard');
    }
  }, [business, subLoading, router, isSubscribed]);

  const toggleModule = (moduleType: string) => {
    setSelectedModules(prev => {
      const next = prev.includes(moduleType) 
        ? prev.filter(m => m !== moduleType) 
        : [...prev, moduleType];
      
      return next;
    });
  };

  const calculateTotal = () => {
    const basePlanMonthly = plans.find(p => p.type === (business?.type === 'SERVICE' ? 'SERVICE_MONTHLY' : 'MONTHLY'));
    const currentBasePlan = plans.find(p => p.type === (business?.type === 'SERVICE' ? `SERVICE_${billingCycle}` : billingCycle));
    
    const monthMultiplier = billingCycle === 'ANNUAL' ? 12 : billingCycle === 'QUARTERLY' ? 3 : 1;
    const cycleDiscount = billingCycle === 'ANNUAL' ? 0.85 : billingCycle === 'QUARTERLY' ? 0.9 : 1;
    
    // Calculate Original Total
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
        discountPercent: Math.round((savings / originalTotal) * 100) || 0
    };
  };

  const { finalTotal, originalTotal, savings, discountPercent } = calculateTotal();

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
    
    // Log key for verification in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('Using Paystack Key:', process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_c4d6b6735388bf536ab1cc72ad8961397078eb08');
    }

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
        // Use a standard function to avoid async/scope issues with Paystack library
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
      toast.loading('Activating your account...', { id: 'activation' });
      const planType = business?.type === 'SERVICE' ? `SERVICE_${billingCycle}` : billingCycle;
      
      await processSubscription(
        planType, 
        response.reference, 
        selectedModules
      );
      
      toast.success('Account activated successfully!', { id: 'activation' });
      router.push('/dashboard');
    } catch (error) {
      toast.error('Activation failed. Please contact support.', { id: 'activation' });
    } finally {
      setProcessing(false);
    }
  };

  if (subLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Authenticating Checkout...</p>
      </div>
    );
  }

  return (
    <form className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-8 selection:bg-teal-100" onSubmit={(e) => e.preventDefault()}>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Configuration */}
        <div className="lg:col-span-7 space-y-10 py-5">
           
           {/* Header */}
           <div className="space-y-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-bold transition-colors group mb-6"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs uppercase tracking-widest text-[10px]">Back to terminal</span>
              </button>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                 <Globe size={14} />
                 Secure International Checkout
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-[1.1]">
                 Configure Your <span className="text-teal-600">Plan</span>
              </h1>

              {/* Expiry Banner */}
              {subscription && (subscription.status === 'EXPIRED' || subscription.status === 'GRACE_PERIOD') && (
                <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertCircle size={80} className="text-rose-600" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-rose-600">
                                <AlertCircle size={18} strokeWidth={3} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Attention Required</span>
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Subscription has Expired</h2>
                            <p className="text-xs text-slate-500 font-medium max-w-sm">Renew your plan to restore full access to your terminal and continue processing sales.</p>
                        </div>
                        
                        <div className="bg-white/60 backdrop-blur-sm border border-rose-200/50 rounded-2xl p-4 min-w-[200px] shadow-sm">
                            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-3">Previous Subscription</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-400">Plan:</span>
                                    <span className="text-slate-700">{subscription.plan_type}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-400">Amount:</span>
                                    <span className="text-slate-700">{formatCurrency(subscription.amount_paid)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-400">Validity:</span>
                                    <span className="text-slate-700">{new Date(subscription.start_date).toLocaleDateString()} - {new Date(subscription.end_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {activeModules.length > 0 && (
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 rounded-3xl text-white shadow-xl shadow-teal-500/20 relative overflow-hidden group">
                    <Sparkles className="absolute right-[-10px] top-[-10px] w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="bg-white/20 p-1 rounded-lg"><Check size={14} strokeWidth={4} /></div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Previous Setup Detected</p>
                        </div>
                        <h3 className="text-lg font-bold tracking-tight mb-1">Renew your favorite features</h3>
                        <p className="text-xs text-white/80 font-medium">We've pre-selected your previous modules for a seamless transition. Keep your business running without interruption.</p>
                    </div>
                </div>
               )}

              <p className="text-base text-slate-500 font-medium max-w-lg leading-relaxed">
                 Select your billing cycle and add-on features. Customize your terminal to fit your business needs.
              </p>
           </div>

           {/* 1. Cycle Selection */}
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">1. Choose Billing Cycle</label>
              <div className="grid grid-cols-3 gap-3">
                 {[
                   { id: 'MONTHLY', label: 'Monthly', discount: 'Normal Rate' },
                   { id: 'QUARTERLY', label: 'Quarterly', discount: 'Save 10%' },
                   { id: 'ANNUAL', label: 'Annual', discount: 'Save 15%' }
                 ].map((cycle) => (
                   <div 
                     key={cycle.id}
                     onClick={() => setBillingCycle(cycle.id as any)}
                     className={cn(
                       "p-4 rounded-2xl border-2 cursor-pointer transition-all text-center relative overflow-hidden group",
                       billingCycle === cycle.id 
                         ? "border-teal-500 bg-white shadow-lg shadow-teal-500/5 ring-4 ring-teal-500/10" 
                         : "border-slate-100 bg-slate-50 hover:border-slate-300"
                     )}
                   >
                      <p className={cn("text-xs font-black transition-colors", billingCycle === cycle.id ? "text-teal-600" : "text-slate-500")}>{cycle.label}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{cycle.discount}</p>
                      {billingCycle === cycle.id && <div className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full" />}
                   </div>
                 ))}
              </div>
           </div>



           {/* 2. Module Customization */}
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">2. Customize Features</label>
              <div className="grid grid-cols-1 gap-3">
                 {availableModules.map((mod) => {
                   const isSelected = selectedModules.includes(mod.type);
                   return (
                     <div 
                        key={mod.type}
                        onClick={() => toggleModule(mod.type)}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                            isSelected 
                                ? "border-teal-500 bg-teal-50/30" 
                                : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                     >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                                isSelected ? "bg-teal-500 border-teal-500" : "border-slate-300 bg-slate-50"
                            )}>
                                {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800">{mod.name}</h4>
                                <p className="text-xs text-slate-500">{mod.description}</p>
                            </div>
                        </div>
                        <p className="text-xs font-black text-slate-700">{formatCurrency(mod.price)}</p>
                     </div>
                   );
                 })}
              </div>
           </div>

        </div>

        {/* Right: Summary & Pay */}
        <div className="lg:col-span-5 flex flex-col pt-10 lg:sticky lg:top-10 h-fit">
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-8">
              
              <div className="border-b border-slate-100 pb-6">
                 <h3 className="font-black text-2xl text-slate-900 tracking-tight">Order Summary</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase mt-1">Review your plan details</p>
              </div>

              <div className="space-y-4">
                 {/* Base Plan Line Item */}
                 <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-bold text-slate-800">Base Subscription</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{billingCycle}</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                        {formatCurrency(plans.find(p => p.type === (business?.type === 'SERVICE' ? `SERVICE_${billingCycle}` : billingCycle))?.price || 0)}
                    </p>
                 </div>

                 {/* Selected Modules Line Items */}
                 {selectedModules.length > 0 && (
                     <div className="space-y-2 pt-2 border-t border-slate-50">
                        {selectedModules.map(modType => {
                            const mod = availableModules.find(m => m.type === modType);
                            if (!mod) return null;
                            const monthMultiplier = billingCycle === 'ANNUAL' ? 12 : billingCycle === 'QUARTERLY' ? 3 : 1;
                            const discount = billingCycle === 'ANNUAL' ? 0.85 : billingCycle === 'QUARTERLY' ? 0.9 : 1;
                            return (
                                <div key={modType} className="flex justify-between items-start pl-2 border-l-2 border-slate-100">
                                    <p className="text-xs font-medium text-slate-600 truncate max-w-[180px]">{mod.name}</p>
                                    <p className="text-xs font-bold text-slate-700">{formatCurrency(mod.price * monthMultiplier * discount)}</p>
                                </div>
                            );
                        })}
                     </div>
                 )}
              </div>

              <div className="pt-6 border-t-2 border-dashed border-slate-100">
                 <div className="flex justify-between items-end">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                    <div className="text-right">
                        {savings > 0 && (
                            <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="text-[10px] font-bold text-slate-300 line-through">{formatCurrency(originalTotal)}</span>
                                <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-emerald-100">-{discountPercent}%</span>
                            </div>
                        )}
                        <h2 className="text-3xl font-black text-teal-600 tracking-tighter">
                            {formatCurrency(finalTotal)}
                        </h2>
                    </div>
                 </div>
              </div>

                <button 
                  type="button"
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full py-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black text-base transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Secure Checkout
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
                <div className="flex justify-center flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Lock size={10} />
                        256-bit SSL Secure
                    </div>
                     <img src="https://paystack.com/assets/img/login/paystack-logo.png" alt="Paystack" className="h-4 opacity-20 grayscale" />
                </div>
           </div>
        </div>

      </div>
    </form>
  );
}
