'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionService, Subscription } from "@/services/subscription.service";
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { 
  ArrowLeft,
  Calendar,
  CreditCard,
  Loader2,
  FileText,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionHistoryPage() {
  const router = useRouter();
  const { business } = useAuth();
  const [history, setHistory] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await SubscriptionService.getHistory();
        setHistory(data);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (business) {
      fetchHistory();
    }
  }, [business]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Loading Payment History...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 border-b border-slate-100">
        <button 
          onClick={() => router.push('/dashboard/subscription')}
          className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-bold transition-colors w-fit group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs uppercase tracking-widest">Back to Subscription</span>
        </button>
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Payment History</h1>
                <p className="text-slate-500 font-medium">Review your past subscription payments and add-ons.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <FileText size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600">{history.length} Records Found</span>
            </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-slate-100">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">No Payment History</h3>
          <p className="text-slate-500">You haven't made any subscription payments yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status / Cover</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Payment Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {format(new Date(record.created_at || record.start_date), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {format(new Date(record.created_at || record.start_date), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-800 line-clamp-2">
                        {record.description || record.plan_type}
                      </p>
                      {record.description?.includes('Add-on') && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-100">
                          Prorated Add-on
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <p className="text-sm font-black text-teal-600">
                        {formatCurrency(record.amount_paid)}
                      </p>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-xs font-black text-emerald-700 uppercase tracking-wide">Paid</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Clock size={10} />
                          {format(new Date(record.start_date), 'MMM dd')} - {format(new Date(record.end_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-slate-400" />
                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {record.transaction_reference}
                        </span>
                      </div>
                      {record.payment_method === 'SAVED_CARD' && (
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-1 ml-6">Saved Card</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
