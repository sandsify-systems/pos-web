'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  Building2, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Store, 
  ChevronLeft, 
  MapPin, 
  Globe, 
  Coins,
  ShieldCheck,
  Gift,
  Zap,
  ChevronDown,
  ChevronUp,
  Package,
  Check,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AuthService } from '@/services/auth.service';
import { SubscriptionService } from '@/services/subscription.service';

const BUSINESS_TYPE_MODULES: Record<string, { recommended: string[], visible: string[] }> = {
  RESTAURANT: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE', 'DIGITAL_MENU_QR'],
    visible: ['RECIPE_MANAGEMENT', 'KITCHEN_DISPLAY'],
  },
  BAR: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE', 'DIGITAL_MENU_QR', 'TABLE_MANAGEMENT', 'SAVE_DRAFTS'],
    visible: ['RECIPE_MANAGEMENT'],
  },
  LOUNGE: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE', 'DIGITAL_MENU_QR', 'TABLE_MANAGEMENT', 'SAVE_DRAFTS'],
    visible: ['RECIPE_MANAGEMENT', 'KITCHEN_DISPLAY'],
  },
  SUPERMARKET: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE'],
    visible: ['WHATSAPP_ALERTS'],
  },
  RETAIL: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE'],
    visible: ['WHATSAPP_ALERTS'],
  },
  BOUTIQUE: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE'],
    visible: ['WHATSAPP_ALERTS'],
  },
  PHARMACY: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE'],
    visible: ['WHATSAPP_ALERTS'],
  },
  CLINIC: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE'],
    visible: ['WHATSAPP_ALERTS'],
  },
  BAKERY: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE', 'RECIPE_MANAGEMENT'],
    visible: ['KITCHEN_DISPLAY'],
  },
  HOTEL: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE', 'TABLE_MANAGEMENT', 'SAVE_DRAFTS', 'DIGITAL_MENU_QR'],
    visible: ['KITCHEN_DISPLAY', 'RECIPE_MANAGEMENT'],
  },
  FUEL_STATION: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE', 'BULK_STOCK_MANAGEMENT'],
    visible: ['WHATSAPP_ALERTS'],
  },
  LPG_STATION: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE', 'BULK_STOCK_MANAGEMENT'],
    visible: ['WHATSAPP_ALERTS'],
  },
  OTHER: {
    recommended: ['ADVANCED_INVENTORY', 'AUTOMATED_COMPLIANCE'],
    visible: ['WHATSAPP_ALERTS', 'SAVE_DRAFTS'],
  }
};

const FALLBACK_PRICING = {
  plans: [
    { type: 'ESSENTIAL_MONTHLY', name: 'Essential Monthly', price: 12500, duration_days: 30, description: 'Optimized for 2 staff and 300 products.' },
    { type: 'ESSENTIAL_ANNUAL', name: 'Essential Annual', price: 100000, duration_days: 365, description: 'Optimized for 2 staff and 300 products.' },
    { type: 'GROWTH_MONTHLY', name: 'Growth Monthly', price: 25000, duration_days: 30, description: 'Optimized for 10 staff and 2500 products.', popular: true },
    { type: 'GROWTH_ANNUAL', name: 'Growth Annual', price: 200000, duration_days: 365, description: 'Optimized for 10 staff and 2500 products.', popular: true },
    { type: 'SCALE_MONTHLY', name: 'Scale Monthly', price: 55000, duration_days: 30, description: 'Optimized for 50 staff and 15000 products.' },
    { type: 'SCALE_ANNUAL', name: 'Scale Annual', price: 440000, duration_days: 365, description: 'Optimized for 50 staff and 15000 products.' }
  ],
  modules: [
    { type: 'KITCHEN_DISPLAY', name: 'Kitchen Display System (KDS)', price: 4000, description: 'Real-time kitchen order monitor for chefs' },
    { type: 'TABLE_MANAGEMENT', name: 'Table Management', price: 4000, description: 'Track floor layouts and table status' },
    { type: 'SAVE_DRAFTS', name: 'Save Drafts', price: 3000, description: 'Save and resume incomplete orders' },
    { type: 'ADVANCED_INVENTORY', name: 'Advanced Inventory Control', price: 15000, description: 'Batch tracking, shrinkage alerts, and stock history' },
    { type: 'RECIPE_MANAGEMENT', name: 'Recipe & Cost Control (BOM)', price: 12000, description: 'Ingredient-level cost tracking per item sold' },
    { type: 'WHATSAPP_ALERTS', name: 'Security & Owner WhatsApp Alerts', price: 5000, description: 'Instant alerts for voids, overrides, refunds, and logins' },
    { type: 'AUTOMATED_COMPLIANCE', name: 'Automated Compliance & Audit Replay', price: 12000, description: 'Tax-ready reports, audit trail, and activity playback' },
    { type: 'DIGITAL_MENU_QR', name: 'QR Digital Menu', price: 5000, description: 'Public QR-based digital menu with live product updates' },
    { type: 'BULK_STOCK_MANAGEMENT', name: 'Bulk Stock & Round Tracking', price: 10000, description: 'Specialized tracking for fuel, gas, and bulk commodities.' }
  ]
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [referralToken, setReferralToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'RETAIL',
    address: '',
    city: '',
    currency: 'NGN',
    selected_modules: [] as string[],
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    use_sample_data: true,
    base_plan_type: 'TRIAL',
    skip_trial: false,
    billing_cycle: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
  });

  const [availableModules, setAvailableModules] = useState<any[]>(FALLBACK_PRICING.modules);
  const [availablePlans, setAvailablePlans] = useState<any[]>(FALLBACK_PRICING.plans);
  const [activePromotion, setActivePromotion] = useState<any>(null);
  const [showAdvancedModules, setShowAdvancedModules] = useState(false);

  useEffect(() => {
    // Fetch public pricing
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://betadaypos.onrender.com/api/v1';
        const cleanBaseUrl = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
        
        const [priceRes, promoRes] = await Promise.all([
          fetch(`${cleanBaseUrl}/pricing`),
          fetch(`${cleanBaseUrl}/active-promotion`)
        ]);

        if (priceRes.ok) {
           const data = await priceRes.json();
           setAvailableModules(data.modules || []);
           setAvailablePlans(data.plans || []);
        }

        if (promoRes.ok) {
           const promo = await promoRes.json();
           setActivePromotion(promo);
        }
      } catch (e) {
        console.error('Failed to fetch public data', e);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralToken(ref);
      toast.success('Referral code applied!');
    }
  }, [searchParams]);

  // Auto-select modules based on business type
  useEffect(() => {
    if (formData.base_plan_type === 'TRIAL') {
      const config = BUSINESS_TYPE_MODULES[formData.business_type] || BUSINESS_TYPE_MODULES.OTHER;
      setFormData(prev => ({ ...prev, selected_modules: config.recommended }));
    } else {
      setFormData(prev => ({ ...prev, selected_modules: [] }));
    }
  }, [formData.business_type, formData.base_plan_type]);

  const nextStep = () => {
    if (step === 1 && (!formData.business_name || !formData.business_type)) {
      toast.error('Please fill in business details');
      return;
    }
    if (step === 2 && (!formData.address || !formData.city)) {
      toast.error('Please fill in location details');
      return;
    }
    if (step === 4) {
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
        toast.error('Please fill in account details');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        toast.error('Passwords do not match');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await AuthService.register({
        business: {
          name: formData.business_name,
          type: formData.business_type,
          address: formData.address,
          city: formData.city,
          currency: formData.currency,
        },
        user: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
        },
        modules: formData.selected_modules,
        use_sample_data: formData.use_sample_data,
        skip_trial: formData.skip_trial,
        billing_cycle: formData.skip_trial ? formData.billing_cycle : undefined,
        referral_token: referralToken || undefined
      });
      
      toast.success('Registration successful! Please verify your email.');
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "block w-full pl-10 pr-3 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium";

  const calculateTotal = () => {
    let total = 0;
    
    // Add Base Plan Price
    let planType = formData.base_plan_type;
    if (planType === 'TRIAL') {
        planType = 'MONTHLY'; // The standard plan
    }
    
    const plan = availablePlans.find(p => p.type === planType);
    if (plan) {
        total += plan.price;
    }

    formData.selected_modules.forEach(modType => {
      const mod = availableModules.find(m => m.type === modType);
      if (mod) total += mod.price;
    });
    return total;
  };

  const calculateTotalForCycle = (cycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL') => {
    let total = 0;
    
    // Convert current base_plan_type (which might be TRIAL or GROWTH_MONTHLY) to target tier
    let currentTier = formData.base_plan_type.split('_')[0];
    if (currentTier === 'TRIAL') currentTier = 'GROWTH';

    // 1. Base Plan Price
    const cycleSuffix = cycle === 'ANNUAL' ? '_ANNUAL' : '_MONTHLY';
    const finalPlanId = `${currentTier}${cycleSuffix}`;

    const plan = availablePlans.find(p => p.type === finalPlanId);
    if (plan) {
      total += plan.price;
    } else {
      // Fallback: If ANNUAL plan not found in availablePlans, use monthly * multiplier
      const baseMonthly = availablePlans.find(p => p.type === `${currentTier}_MONTHLY`);
      if (baseMonthly) {
          const multiplier = cycle === 'ANNUAL' ? 8 : cycle === 'QUARTERLY' ? 2.5 : 1;
          total += (baseMonthly.price * multiplier);
      }
    }

    // 2. Modules (Modules also follow the same cycle discount)
    const modMultiplier = cycle === 'ANNUAL' ? 12 : cycle === 'QUARTERLY' ? 3 : 1;
    // 33% off for modules in annual (pay for 8 months)
    let modDiscount = cycle === 'ANNUAL' ? 0.66 : 1; 
    
    formData.selected_modules.forEach(modType => {
      const mod = availableModules.find(m => m.type === modType);
      if (mod) total += (mod.price * modMultiplier * modDiscount);
    });

    return Math.round(total);
  };

  const calculateBillingTotal = () => {
    return calculateTotalForCycle(formData.billing_cycle);
  };

  const calculateSavings = (cycle: 'QUARTERLY' | 'ANNUAL') => {
    const multiplier = cycle === 'ANNUAL' ? 12 : cycle === 'QUARTERLY' ? 3 : 1;
    
    let currentTier = formData.base_plan_type.split('_')[0];
    if (currentTier === 'TRIAL') currentTier = 'GROWTH';
    
    const monthlyRate = availablePlans.find(p => p.type === `${currentTier}_MONTHLY`)?.price || 0;
    
    const original = (monthlyRate * multiplier);
    const current = calculateTotalForCycle(cycle); // Modules are included here
    
    if (original === 0) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 md:p-6 lg:p-10">
      <div className={cn("w-full transition-all duration-500", step === 3 ? "max-w-5xl" : "max-w-xl")}>
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-14 space-y-8 relative overflow-hidden border border-white">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100/50">
            <div 
              className="h-full bg-teal-600 transition-all duration-700 ease-out" 
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          {/* Active Promo Banner */}
          {activePromotion && (
            <div className="bg-teal-600 -mx-8 md:-mx-14 -mt-8 md:-mt-14 mb-8 p-4 md:p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                     <Zap size={20} className="fill-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">{activePromotion.name}</h3>
                    <p className="text-xs text-teal-100 font-medium">{activePromotion.description}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
                  <div className="text-center">
                    <p className="text-[10px] font-black opacity-60">QUARTERLY</p>
                    <p className="text-sm font-black">-{activePromotion.quarterly_discount}%</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-center">
                    <p className="text-[10px] font-black opacity-60">ANNUAL</p>
                    <p className="text-sm font-black">-{activePromotion.annual_discount}%</p>
                  </div>
               </div>
            </div>
          )}

          <div className="text-center space-y-3">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-black uppercase tracking-widest mb-2 animate-bounce">
                {referralToken ? (
                  <>
                    <ShieldCheck size={14} />
                    Beta Partner Invite Applied
                  </>
                ) : (
                  'Step ' + step + ' of 5'
                )}
             </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {step === 1 ? 'Business Identity' : step === 2 ? 'Location & Data' : step === 3 ? 'Business Power-Ups' : step === 4 ? 'Owner Profile' : 'Starter Samples'}
            </h1>
            <p className="text-slate-500 text-lg">
              {step === 1 ? 'Start your journey with BETADAY' : step === 2 ? 'Configure your regional settings' : step === 3 ? 'Choose your business package' : step === 4 ? 'The final step to autonomy' : 'Populate your new workspace'}
            </p>
          </div>

          <form onSubmit={step === 5 ? handleRegister : (e) => e.preventDefault()} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6 animate-zoom-in">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Business Legal Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                      <Store size={20} />
                    </div>
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Metro Supermarket"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Industry Type</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                      <Building2 size={20} />
                    </div>
                    <select
                      value={formData.business_type}
                      onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                      className="block w-full pl-10 pr-3 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none font-bold cursor-pointer"
                      required
                    >
                      

                      <option value="RESTAURANT">Restaurant / Cafe</option>
                      <option value="BAR">Bar</option>
                      <option value="SUPERMARKET">Supermarket</option>
                      <option value="LOUNGE">Lounge</option>
                      <option value="FUEL_STATION">Fuel Station</option>
                      <option value="RETAIL">Retail Store</option>
                      <option value="HOTEL">Hotel</option>
                      <option value="PHARMACY">Pharmacy</option>
                      <option value="CLINIC">Clinic</option>
                      <option value="LPG_STATION">LPG Station</option>
                      <option value="BOUTIQUE">Boutique</option>
                      <option value="OTHER">Other Industry</option>


                  
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full flex items-center justify-center gap-2 py-5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-teal-500/20 active:scale-[0.98] group text-lg"
                >
                  Continue to Location
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-zoom-in">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Physical Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                        <MapPin size={20} />
                      </div>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className={inputClass}
                        placeholder="Street name, landmark..."
                        required
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">City</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                          <Globe size={18} />
                        </div>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className={inputClass}
                          placeholder="Lagos"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 ml-1">Currency</label>
                       <div className="relative group">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                           <Coins size={18} />
                         </div>
                         <select
                           value={formData.currency}
                           onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                           className="block w-full pl-10 pr-3 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all appearance-none font-bold cursor-pointer"
                           required
                         >
                           <option value="NGN">Naira (₦)</option>
                           <option value="USD">USD ($)</option>
                           <option value="GBP">GBP (£)</option>
                         </select>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-[3] flex items-center justify-center gap-2 py-5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-teal-500/20 group text-lg"
                    >
                      Identity setup
                      <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </div>
            )}

             {step === 3 && (
              <div className="space-y-6 animate-zoom-in">
                <div className="flex flex-col md:flex-row gap-4 mb-4 p-1 bg-slate-100 rounded-2xl mx-auto w-full">
                   {[
                     { id: 'ESSENTIAL_MONTHLY', label: 'Essential', icon: Store },
                     { id: 'GROWTH_MONTHLY', label: 'Growth', icon: Zap },
                     { id: 'SCALE_MONTHLY', label: 'Scale', icon: ShieldCheck }
                   ].map((item) => (
                     <button
                       key={item.id}
                       type="button"
                       onClick={() => setFormData({ ...formData, base_plan_type: item.id })}
                       className={cn(
                         "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
                         formData.base_plan_type === item.id || (formData.base_plan_type === 'TRIAL' && item.id === 'GROWTH_MONTHLY')
                           ? "bg-white text-teal-600 shadow-sm border border-slate-200" 
                           : "text-slate-500 hover:bg-slate-50"
                       )}
                     >
                       <item.icon size={14} />
                       {item.label}
                     </button>
                   ))}
                </div>


                <div className="flex flex-col lg:flex-row gap-8">
                  {formData.base_plan_type === 'TRIAL' ? (
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Premium Features</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                           {availableModules.filter((mod: any) => {
                              const config = BUSINESS_TYPE_MODULES[formData.business_type] || BUSINESS_TYPE_MODULES.OTHER;
                              return config.recommended.includes(mod.type) || config.visible.includes(mod.type);
                           }).map((mod) => {
                             const config = BUSINESS_TYPE_MODULES[formData.business_type] || BUSINESS_TYPE_MODULES.OTHER;
                             const isRecommended = config.recommended.includes(mod.type);
                             const isSelected = formData.selected_modules.includes(mod.type);
                             return (
                               <div 
                                 key={mod.type}
                                 onClick={() => {
                                   const current = formData.selected_modules;
                                   if (isSelected) {
                                     setFormData({ ...formData, selected_modules: current.filter(m => m !== mod.type) });
                                   } else {
                                     setFormData({ ...formData, selected_modules: [...current, mod.type] });
                                   }
                                 }}
                                 className={cn(
                                   "p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden",
                                   isSelected ? "border-teal-500 bg-teal-50/30 shadow-md" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                                 )}
                               >
                                 {isRecommended && !isSelected && (
                                   <div className="absolute top-0 right-0 px-2 py-0.5 bg-teal-50 text-[8px] font-black text-teal-600 rounded-bl-xl border-l border-b border-teal-100 shadow-sm z-10">
                                      RECOMMENDED
                                   </div>
                                 )}
                                 <div className="flex items-start justify-between mb-3">
                                   <div className={cn(
                                     "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                     isSelected ? "bg-teal-600 text-white" : "bg-white text-slate-400"
                                   )}>
                                     <Package size={20} />
                                   </div>
                                   <div className={cn(
                                     "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                     isSelected ? "bg-teal-600 border-teal-600" : "bg-white border-slate-300"
                                   )}>
                                     {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                                   </div>
                                 </div>
                                 <h4 className="font-bold text-slate-900 text-sm mb-1">{mod.name}</h4>
                                 <p className="text-xs text-slate-500 mb-3 line-clamp-2">{mod.description}</p>
                                 <p className="text-sm font-black text-slate-900">₦{mod.price.toLocaleString()}<span className="text-xs text-slate-400 font-medium"> / mo</span></p>
                               </div>
                             );
                           })}
                        </div>
                      </div>
                  ) : (
                    <div className="flex-1 w-full p-12 text-center space-y-6 bg-slate-50 rounded-[3.5rem] border-2 border-dashed border-slate-200 animate-fade-in my-4">
                       <div className="w-24 h-24 bg-teal-50 rounded-3xl flex items-center justify-center mx-auto text-teal-600 shadow-2xl shadow-teal-500/10 rotate-3">
                          <Store size={48} />
                       </div>
                       <div className="space-y-3 max-w-sm mx-auto">
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Basic Sales Mode</h3>
                          <p className="text-slate-500 leading-relaxed font-medium">
                            Perfect for small shops & kiosks. Track sales, print receipts, and manage a small catalog.
                          </p>
                       </div>
                       <div className="inline-flex items-center gap-3 px-8 py-4 bg-teal-100/50 text-teal-700 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] border border-teal-200">
                          <ShieldCheck size={16} />
                          Essential Features Only
                       </div>
                    </div>
                  )}
                </div>

                {/* Pricing Summary Bar */}
                <div className="p-10 bg-slate-900 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-teal-500/20 transition-all duration-1000" />
                   
                   {/* Immediate Payment Selector */}
                   <div className="flex items-center justify-center gap-4 mb-8 relative z-10 bg-white/5 p-1 rounded-2xl w-fit mx-auto md:ml-0">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, skip_trial: false, billing_cycle: 'MONTHLY'})}
                        className={cn("px-6 py-2 rounded-xl text-[10px] font-black transition-all", !formData.skip_trial ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                      >
                         START 14-DAY TRIAL
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, skip_trial: true})}
                        className={cn("px-6 py-2 rounded-xl text-[10px] font-black transition-all", formData.skip_trial ? "bg-amber-600 text-white shadow-lg" : "text-slate-400 hover:text-white")}
                      >
                         PAY IMMEDIATELY
                      </button>
                   </div>

                   {/* Billing Cycle Selector - shown only when Pay Immediately is selected */}
                   {formData.skip_trial && (
                     <div className="mb-8 relative z-10">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center md:text-left">Select Billing Cycle</p>
                       <div className="grid grid-cols-3 gap-3">
                         {[
                           { id: 'MONTHLY' as const, label: 'Monthly', price: calculateTotalForCycle('MONTHLY'), discount: null },
                           { id: 'QUARTERLY' as const, label: 'Quarterly', price: calculateTotalForCycle('QUARTERLY'), discount: `${calculateSavings('QUARTERLY')}% OFF` },
                           { id: 'ANNUAL' as const, label: 'Annual', price: calculateTotalForCycle('ANNUAL'), discount: `${calculateSavings('ANNUAL')}% OFF` },
                         ].map((cycle) => (
                           <div
                             key={cycle.id}
                             onClick={() => setFormData({...formData, billing_cycle: cycle.id})}
                             className={cn(
                               "p-4 rounded-2xl border-2 cursor-pointer transition-all text-center relative",
                               formData.billing_cycle === cycle.id
                                 ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                                 : "border-white/10 bg-white/5 hover:bg-white/10"
                             )}
                           >
                             {/* Tick indicator */}
                             <div className={cn(
                               "absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                               formData.billing_cycle === cycle.id ? "bg-amber-500 border-amber-500" : "border-white/30 bg-transparent"
                             )}>
                               {formData.billing_cycle === cycle.id && <Check size={12} className="text-white" strokeWidth={3} />}
                             </div>
                             <p className={cn("text-[10px] font-black uppercase mb-2 tracking-widest", formData.billing_cycle === cycle.id ? "text-amber-400" : "text-slate-500")}>{cycle.label}</p>
                             <p className="text-lg font-black tracking-tight text-white">₦{cycle.price.toLocaleString()}</p>
                             {cycle.discount && (
                               <p className="text-[9px] text-teal-400 font-black mt-2 bg-teal-400/10 py-1 rounded-lg">{cycle.discount}</p>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   <div className="flex flex-col xl:flex-row justify-between items-center gap-10 relative z-10">
                      <div className="text-center md:text-left flex-1">
                         <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                            <span className={cn("w-2 h-2 rounded-full animate-pulse", formData.skip_trial ? "bg-amber-400" : "bg-teal-400")} />
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", formData.skip_trial ? "text-amber-400" : "text-teal-400")}>
                              {formData.skip_trial ? `${formData.billing_cycle} Settlement Due` : 'Total Post-Trial Billing'}
                            </p>
                         </div>
                         <h3 className="text-5xl font-black tracking-tighter">
                           {formData.skip_trial 
                             ? <>₦{calculateBillingTotal().toLocaleString()} <span className="text-lg text-slate-500 font-bold ml-1">/ {formData.billing_cycle === 'ANNUAL' ? 'yr' : formData.billing_cycle === 'QUARTERLY' ? 'qtr' : 'mo'}</span></>
                             : <>₦{calculateTotal().toLocaleString()} <span className="text-lg text-slate-500 font-bold ml-1">/ mo</span></>
                           }
                         </h3>
                         <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest leading-loose">
                           {formData.skip_trial 
                            ? "Commit now and get your specialized business keys instantly." 
                            : `Trial ends on ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}`
                           }
                         </p>
                         <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-[11px] font-black text-teal-400 uppercase tracking-widest mb-1">Access Anywhere</p>
                            <p className="text-[10px] text-white font-bold leading-relaxed">
                               One license. Use on any device — mobile, desktop, or web.
                            </p>
                            <p className="text-[9px] text-slate-500 mt-1 italic">User limits apply.</p>
                         </div>
                      </div>

                      {/* Show pricing comparison only when NOT in pay immediately mode */}
                       {!formData.skip_trial && (
                         <div className="flex flex-wrap justify-center gap-4">
                            <div className="bg-white/5 border border-white/10 p-5 rounded-[2rem] text-center min-w-[140px] hover:bg-white/10 transition-all cursor-help group/card">
                               <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Quarterly</p>
                               <p className="text-lg font-black tracking-tight">₦{calculateTotalForCycle('QUARTERLY').toLocaleString()}</p>
                               <p className="text-[9px] text-teal-400 font-black mt-2 bg-teal-400/10 py-1 rounded-lg">SAVE {calculateSavings('QUARTERLY')}%</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-5 rounded-[2rem] text-center min-w-[140px] hover:bg-white/10 transition-all cursor-help group/card">
                               <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Annual</p>
                               <p className="text-lg font-black tracking-tight">₦{calculateTotalForCycle('ANNUAL').toLocaleString()}</p>
                               <p className="text-[9px] text-teal-400 font-black mt-2 bg-teal-400/10 py-1 rounded-lg">SAVE {calculateSavings('ANNUAL')}%</p>
                            </div>
                         </div>
                       )}

                      <div className="text-center md:text-right flex flex-col items-center md:items-end gap-3 xl:border-l xl:border-white/10 xl:pl-10">
                         <div className={cn("px-6 py-3 rounded-2xl text-[10px] font-black shadow-xl uppercase tracking-widest", formData.skip_trial ? "bg-amber-600 text-white" : "bg-teal-600 text-white")}>
                            {formData.skip_trial ? 'PRIORITY SETUP' : '14-DAY FREE PASS'}
                         </div>
                         <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed italic font-medium">
                            {formData.skip_trial 
                             ? "Bypass verification delays with immediate account activation." 
                             : "Explore every feature with zero financial commitment for 2 weeks."}
                         </p>
                      </div>
                   </div>
                </div>

                {/* Software License Disclaimer */}
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-[2rem] flex items-start gap-3">
                  <Info size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-600">Software License Only</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      All prices shown are for the BETADAY software license only and <strong>do not include the cost of hardware</strong> (POS terminals, printers, barcode scanners, etc.). Hardware pricing varies by configuration — please contact your installer or sales representative for a quote.
                    </p>
                  </div>
                </div>

                {!formData.skip_trial && (
                  <div className="p-4 bg-teal-600 text-white rounded-[2rem] text-center">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80">Trial Experience</p>
                    <p className="text-sm font-medium mt-1">All selected modules will be free for the first 14 days!</p>
                  </div>
                )}

                <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-[3] flex items-center justify-center gap-2 py-5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-teal-500/20 group text-lg"
                    >
                      Security setup
                      <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                 </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-zoom-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-bold"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-bold"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputClass}
                      placeholder="business@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                     <div className="relative group">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                         <Lock size={18} />
                       </div>
                       <input
                         type="password"
                         value={formData.password}
                         onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                         className={inputClass}
                         placeholder="••••••••"
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-slate-700 ml-1">Retry</label>
                     <div className="relative group">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600">
                         <Lock size={18} />
                       </div>
                       <input
                         type="password"
                         value={formData.confirm_password}
                         onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                         className={inputClass}
                         placeholder="••••••••"
                         required
                       />
                     </div>
                   </div>
                </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-[3] flex items-center justify-center gap-3 py-5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-teal-500/20 active:scale-[0.98] text-lg"
                    >
                      Finalize Setup
                      <ArrowRight size={22} />
                    </button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8 animate-zoom-in">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                      <Gift size={40} />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-xl font-black text-slate-900">Want some demo data?</h3>
                       <p className="text-slate-500 text-sm px-6">
                         We can pre-populate your catalog with products and categories relevant to <strong>{formData.business_type.toLowerCase()}</strong> stores so you can start testing immediately.
                       </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div 
                      onClick={() => setFormData({ ...formData, use_sample_data: true })}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                        formData.use_sample_data === true ? "border-teal-500 bg-teal-50/50" : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.use_sample_data === true ? "bg-teal-600 border-teal-600" : "border-slate-300"
                      }`}>
                        {formData.use_sample_data === true && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-slate-900">Yes, seed sample data</p>
                        <p className="text-xs text-slate-500">Includes demo products, categories and stock</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setFormData({ ...formData, use_sample_data: false })}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                        formData.use_sample_data === false ? "border-teal-500 bg-teal-50/50" : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.use_sample_data === false ? "bg-teal-600 border-teal-600" : "border-slate-300"
                      }`}>
                        {formData.use_sample_data === false && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-slate-900">No, start empty</p>
                        <p className="text-xs text-slate-500">I'll add my own data from scratch</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[3] flex items-center justify-center gap-3 py-5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-teal-500/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none text-lg"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Launch Business
                          <ArrowRight size={22} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
          </form>

          <p className="text-center text-slate-400 font-bold text-sm">
            Already registered?{' '}
            <Link href="/auth/login" className="text-teal-600 hover:teal-700 ml-1 underline underline-offset-4 decoration-2">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
