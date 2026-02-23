'use client';

import React, { useEffect, useState } from 'react';
import { 
  Lock, 
  CreditCard, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  ShieldAlert,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '../../lib/utils';
import { ReportService, type DailyReport } from '../../services/report.service';
import { PriceDisplay } from '../../components/ui/PriceDisplay';
import Link from 'next/link';

export default function LockedPage() {
  const { business, logout } = useAuth();
  const { subscription, isSubscribed } = useSubscription();
  const [reportData, setReportData] = useState<DailyReport | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isSubscribed) {
      router.push('/dashboard');
    }
    fetchTrialStats();
  }, [isSubscribed]);

  const fetchTrialStats = async () => {
    try {
      // In a real scenario, we might want a "Trial Summary" endpoint
      // For now, we fetch the daily report which usually contains lifetime/period stats in some implementations
      const data = await ReportService.getDailyReport();
      setReportData(data);
    } catch (e) {
      console.error("Failed to fetch trial stats", e);
    }
  };

  const daysUsed = 14; // Default for 14-day trial if expired
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-50/50 via-slate-50 to-slate-100">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="w-20 h-20 bg-teal-500/20 text-teal-400 rounded-3xl flex items-center justify-center mx-auto border border-teal-500/30 backdrop-blur-sm shadow-xl shadow-teal-500/10">
              <Lock size={40} className="animate-bounce-subtle" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tight">Trial Period Ended</h1>
              <p className="text-slate-400 font-medium">Your 14-day access to AB-POS has temporarily expired.</p>
            </div>
          </div>
          {/* Abstract background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full translate-x-20 -translate-y-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full -translate-x-20 translate-y-20 blur-3xl" />
        </div>

        <div className="p-10 space-y-10">
          {/* Trial Stats Summary */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 bg-white text-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                <TrendingUp size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales Recorded</p>
              <h4 className="text-xl font-black text-slate-900">
                <PriceDisplay amount={reportData?.total_sales || 0} currency={business?.currency} />
              </h4>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days Logged In</p>
              <h4 className="text-xl font-black text-slate-900">{daysUsed} Days</h4>
            </div>
          </div>

          {/* Action List */}
          <div className="space-y-4">
             <Link 
              href="/subscription/checkout"
              className="w-full flex items-center justify-between p-6 bg-teal-600 hover:bg-teal-700 text-white rounded-3xl transition-all shadow-xl shadow-teal-600/20 group active:scale-[0.98]"
             >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Choose Your Plan</h4>
                    <p className="text-teal-100/80 text-sm font-medium">Unlimited sales, stock management & reports</p>
                  </div>
                </div>
                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
             </Link>

             <button 
              onClick={() => window.open('https://wa.me/your-number', '_blank')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-3xl transition-all group active:scale-[0.98]"
             >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Contact Support</h4>
                    <p className="text-slate-500 text-sm font-medium">Need more time? Talk to our sales team</p>
                  </div>
                </div>
                <ChevronRight size={24} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>

          {/* Data Security Note */}
          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
             <div className="p-2 bg-white text-amber-600 rounded-xl shadow-sm shrink-0">
               <ShieldAlert size={20} />
             </div>
             <div className="space-y-1">
               <h5 className="text-amber-900 font-bold text-sm">Your data is safe and secured</h5>
               <p className="text-amber-800/70 text-[11px] font-medium leading-relaxed italic">
                 All your products, sales history, and staff records are preserved for 90 days. Upgrade now to regain full access instantly without any data loss.
               </p>
             </div>
          </div>

          <div className="flex items-center justify-center gap-8 pt-4">
             <button 
              onClick={logout}
              className="text-slate-400 hover:text-rose-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
             >
               Logout & Switch Account
             </button>
             <div className="w-px h-4 bg-slate-200" />
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
               <Download size={14} />
               Export Trial Data
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
