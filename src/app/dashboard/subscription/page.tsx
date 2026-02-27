
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionService, PaymentMethod } from "@/services/subscription.service";
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
  Calendar,
  Info
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
  
  const [promoCode, setPromoCode] = useState("");
  const [isVerifyingPromo, setIsVerifyingPromo] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const isLPGOrFuel = business?.type === "LPG_STATION" || business?.type === "FUEL_STATION";

  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [isUsingSavedCard, setIsUsingSavedCard] = useState(false);

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
    } else if (isLPGOrFuel) {
       setIsBasicMode(true);
    }

    // Auto-apply influencer promo code if it exists
    if (business?.default_promo_code && !appliedPromo && !promoCode) {
        setPromoCode(business.default_promo_code);
        setIsVerifyingPromo(true);
        SubscriptionService.validatePromoCode(business.default_promo_code).then(res => {
            if (res.success) {
                setPromoDiscount(res.discount_percentage);
                setAppliedPromo(business.default_promo_code!);
            }
        }).catch(() => {
            console.log("Default promo code invalid or expired");
        }).finally(() => {
            setIsVerifyingPromo(false);
        });
    }
  }, [activeModules, subscription, isLPGOrFuel, business, appliedPromo, promoCode]);

  useEffect(() => {
    const fetchCards = async () => {
        setIsLoadingCards(true);
        try {
            const cards = await SubscriptionService.getSavedCards();
            setSavedCards(cards);
            if (cards.length > 0) {
                const defaultCard = cards.find(c => c.is_default) || cards[0];
                setSelectedCardId(defaultCard.id);
                setIsUsingSavedCard(true);
            }
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        } finally {
            setIsLoadingCards(false);
        }
    };
    fetchCards();
  }, []);

  const toggleModule = (moduleType: string) => {
    setSelectedModules(prev => {
      const next = prev.includes(moduleType) 
        ? prev.filter(m => m !== moduleType) 
        : [...prev, moduleType];
      
      return next;
    });
  };

  const { finalTotal, originalTotal, savings, discountPercent, currentBasePlan, isProratedAddon, newModulesCount } = useMemo(() => {
    const isWithinActivePlan = isSubscribed && subscription?.plan_type === (isBasicMode ? `SERVICE_${billingCycle}` : billingCycle);
    const currentBasePlan = plans.find(p => p.type === (isBasicMode ? `SERVICE_${billingCycle}` : billingCycle));
    const basePlanMonthly = plans.find(p => p.type === (isBasicMode ? 'SERVICE_MONTHLY' : 'MONTHLY'));
    
    const monthMultiplier = billingCycle === 'ANNUAL' ? 12 : billingCycle === 'QUARTERLY' ? 3 : 1;
    const cycleDiscount = billingCycle === 'ANNUAL' ? 0.85 : billingCycle === 'QUARTERLY' ? 0.9 : 1;

    // Check which modules are new vs already active
    const activeModTypes = activeModules.map(m => m.module);
    const newModules = selectedModules.filter(m => !activeModTypes.includes(m));

    let finalTotal = 0;
    let originalTotal = 0;
    let isProratedAddon = false;

    if (isWithinActivePlan && daysRemaining > 5) {
      // SCENARIO: MID-CYCLE ADD-ON
      isProratedAddon = true;
      
      newModules.forEach(modType => {
        const mod = availableModules.find(m => m.type === modType);
        if (mod) {
          // Prorate: (Price / 30) * daysRemaining
          const proratedPrice = (mod.price / 30) * daysRemaining;
          finalTotal += proratedPrice;
          originalTotal += proratedPrice;
        }
      });
      // Base plan and existing modules are already paid
    } else {
      // SCENARIO: FRESH START OR RENEWAL
      const basePriceWithCycle = currentBasePlan?.price || 0;
      finalTotal = basePriceWithCycle;
      originalTotal = (basePlanMonthly?.price || 0) * monthMultiplier;

      selectedModules.forEach(modType => {
        const mod = availableModules.find(m => m.type === modType);
        if (mod) {
          finalTotal += mod.price * monthMultiplier * cycleDiscount;
          originalTotal += mod.price * monthMultiplier;
        }
      });
    }

    if (promoDiscount > 0 && !isProratedAddon) {
      finalTotal = finalTotal * (1 - promoDiscount / 100);
    }

    const savings = originalTotal - finalTotal;

    return {
        finalTotal: Math.max(0, finalTotal),
        originalTotal,
        savings,
        discountPercent: isProratedAddon ? 0 : (Math.round((savings / originalTotal) * 100) || 0),
        currentBasePlan,
        isProratedAddon,
        newModulesCount: newModules.length
    };
  }, [billingCycle, selectedModules, plans, availableModules, isBasicMode, isSubscribed, subscription, daysRemaining, activeModules, promoDiscount]);

  const handlePay = () => {
    if (!user || !business) {
      toast.error('Session expired. Please login again.');
      return;
    }

    if (!(window as any).PaystackPop && !isUsingSavedCard) {
      toast.error('Payment gateway not loaded yet. Please wait a moment.');
      return;
    }

    setProcessing(true);
    const planType = isBasicMode ? `SERVICE_${billingCycle}` : billingCycle;

    if (isUsingSavedCard && selectedCardId) {
        toast.loading('Processing with saved card...', { id: 'saved-card-pay' });
        SubscriptionService.chargeSavedCard({
            plan_type: planType,
            modules: selectedModules,
            card_id: selectedCardId
        }).then(() => {
            toast.success('Subscription updated successfully!', { id: 'saved-card-pay' });
            router.refresh();
        }).catch((err: any) => {
            toast.error(err.response?.data?.error || 'Failed to process saved card payment', { id: 'saved-card-pay' });
        }).finally(() => {
            setProcessing(false);
        });
        return;
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
        selectedModules,
        undefined,
        appliedPromo || undefined
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
            <div className="bg-teal-50 border border-teal-100 p-3 rounded-2xl flex items-center gap-3 w-fit">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-xs font-black text-teal-700 tracking-tight">One license. Use on any device — mobile, desktop, or web.</p>
            </div>
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
                   {isLPGOrFuel && (
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
                   )}
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
                            Perfect for small LPG/Fuel stations. Includes sales tracking, receipt printing, a catalog of up to 25 items, and <b>Bulk Inventory Management</b> included by default.
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
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          {isProratedAddon ? 'Current Plan' : 'Base Terminal'}
                        </p>
                        <p className="text-sm font-bold text-slate-800">{currentBasePlan?.name || 'Base Plan'}</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                        {isProratedAddon ? 'Active' : formatCurrency(plans.find(p => p.type === (isBasicMode ? `SERVICE_${billingCycle}` : billingCycle))?.price || 0)}
                    </p>
                 </div>

                 {/* Modules */}
                 {newModulesCount > 0 && (
                     <div className="space-y-3 pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">
                          {isProratedAddon ? 'New Add-ons (Prorated)' : 'Premium Add-ons'}
                        </p>
                        {selectedModules.map(modType => {
                           const mod = availableModules.find(m => m.type === modType);
                           if (!mod) return null;
                           const isActive = activeModules.some(m => m.module === modType);
                           if (isProratedAddon && isActive) return null; // Don't show already active ones in breakdown if prorating

                           const monthMultiplier = billingCycle === 'ANNUAL' ? 12 : billingCycle === 'QUARTERLY' ? 3 : 1;
                           const discount = billingCycle === 'ANNUAL' ? 0.85 : billingCycle === 'QUARTERLY' ? 0.9 : 1;
                           const price = isProratedAddon ? (mod.price / 30) * daysRemaining : (mod.price * monthMultiplier * discount);
                           
                           return (
                               <div key={modType} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                   <span className="text-xs font-bold text-slate-600 truncate max-w-[140px]">{mod.name}</span>
                                   <span className="text-xs font-black text-slate-900">{formatCurrency(price)}</span>
                               </div>
                           );
                        })}
                        {isProratedAddon && (
                          <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-xl border border-teal-100">
                            <Info size={12} className="text-teal-600 flex-shrink-0" />
                            <p className="text-[10px] font-bold text-teal-700">
                              Prorated for {daysRemaining} days remaining.
                            </p>
                          </div>
                        )}
                     </div>
                 )}
              </div>

              {/* Promo Code Input */}
              <div className="pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Promo Code</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="CODE"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className={cn(
                            "flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500",
                            appliedPromo && "border-emerald-200 bg-emerald-50 text-emerald-700"
                        )}
                    />
                    <button 
                        type="button"
                        disabled={!promoCode || isVerifyingPromo}
                        onClick={async () => {
                            if (appliedPromo === promoCode) {
                                setAppliedPromo(null);
                                setPromoDiscount(0);
                                setPromoCode("");
                                return;
                            }
                            setIsVerifyingPromo(true);
                            try {
                                const res = await SubscriptionService.validatePromoCode(promoCode);
                                if (res.success) {
                                    setPromoDiscount(res.discount_percentage);
                                    setAppliedPromo(promoCode);
                                    toast.success(`Promo code applied: ${res.discount_percentage}% off!`);
                                }
                            } catch (error: any) {
                                toast.error(error.response?.data?.error || 'Invalid promo code');
                            } finally {
                                setIsVerifyingPromo(false);
                            }
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                        {isVerifyingPromo ? <Loader2 size={12} className="animate-spin" /> : appliedPromo === promoCode ? "Remove" : "Apply"}
                    </button>
                </div>
              </div>

               {/* Saved Cards */}
               {savedCards.length > 0 && (
                   <div className="pt-4 border-t border-slate-50 space-y-3">
                       <div className="flex justify-between items-center px-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Payment Method</label>
                           <button 
                               type="button"
                               onClick={() => {
                                   setIsUsingSavedCard(!isUsingSavedCard);
                                   if (!isUsingSavedCard && savedCards.length > 0) {
                                       setSelectedCardId(savedCards[0].id);
                                   }
                               }}
                               className="text-[9px] font-bold text-teal-600 uppercase hover:underline"
                           >
                               {isUsingSavedCard ? "Add New Card" : "Use Saved Card"}
                           </button>
                       </div>
                       
                       {isUsingSavedCard && (
                           <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                               {savedCards.map(card => (
                                   <div 
                                       key={card.id}
                                       onClick={() => setSelectedCardId(card.id)}
                                       className={cn(
                                           "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group",
                                           selectedCardId === card.id 
                                               ? "bg-slate-900 border-slate-900 shadow-lg shadow-slate-200" 
                                               : "bg-slate-50 border-slate-100 hover:border-slate-200"
                                       )}
                                   >
                                       <div className="flex items-center gap-3">
                                           <div className={cn(
                                               "p-1.5 rounded-lg",
                                               selectedCardId === card.id ? "bg-white/10" : "bg-white"
                                           )}>
                                               <CreditCard size={14} className={selectedCardId === card.id ? "text-white" : "text-slate-400"} />
                                           </div>
                                           <div>
                                               <p className={cn("text-xs font-bold", selectedCardId === card.id ? "text-white" : "text-slate-700")}>
                                                   {card.brand} ••• {card.last4}
                                               </p>
                                               <p className={cn("text-[9px] font-medium", selectedCardId === card.id ? "text-slate-400" : "text-slate-400")}>
                                                   Exp {card.exp_month}/{card.exp_year}
                                               </p>
                                           </div>
                                       </div>
                                       {selectedCardId === card.id && (
                                           <Check size={14} className="text-teal-400" />
                                       )}
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               )}

               {/* Total Calculation */}
              <div className="pt-8 border-t-2 border-dashed border-slate-100">
                 <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                          {isProratedAddon ? 'Add-on Total' : 'Final Total'}
                        </p>
                        <p className="text-[9px] text-teal-600 font-bold uppercase">
                          {isProratedAddon ? 'Current Cycle' : `${billingCycle} Billing`}
                        </p>
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
                  disabled={processing || (isProratedAddon && finalTotal <= 0)}
                  className="w-full py-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-[2rem] font-black text-base transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                    {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {isProratedAddon ? 'Add to Current Plan' : 'Secure Payment'}
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

                  {/* Software License Disclaimer */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3 mt-2">
                    <Info size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-500">Software License Only</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Prices are for the BETADAY software license only and <strong>do not include hardware costs</strong>. Please contact your installer for hardware pricing.
                      </p>
                    </div>
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
                                    {isBasicMode ? 'Bulk Stock Included' : 'Standard Inventory'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                    {isBasicMode ? 'Meter readings & tank dips' : 'Full inventory management'}
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
                                    {isBasicMode ? 'Perfect for small catalogs' : 'Scale without limits'}
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
