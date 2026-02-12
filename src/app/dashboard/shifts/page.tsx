'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ShiftService, Shift } from '@/services/shift.service';
import { formatCurrency } from '@/lib/utils';
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  ArrowLeft,
  Loader2,
  AlertTriangle,
  History,
  TrendingDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ShiftHistoryPage() {
  const router = useRouter();
  const { business } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const data = await ShiftService.listShifts();
      // Sort by date desc
      const sorted = (data || []).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      setShifts(sorted);
    } catch (e) {
      toast.error('Failed to load shift history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return 'Active';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = (e - s) / 1000 / 60; // minutes
    const hrs = Math.floor(diff / 60);
    const mins = Math.floor(diff % 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
       <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shift History</h1>
          <p className="text-slate-500">Track proper opening and closing of registers</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           {shifts.length === 0 ? (
             <div className="p-12 text-center flex flex-col items-center text-slate-400">
               <History size={48} className="mb-4 opacity-30" />
               <p>No shift records found.</p>
             </div>
           ) : (
                <div className="divide-y divide-slate-100">
                {shifts.map((shift) => (
                    <div key={shift.id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            
                            {/* Left: Time & Status */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-md border ${
                                        shift.status === 'open' 
                                          ? 'bg-green-50 text-green-700 border-green-200' 
                                          : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}>
                                        {shift.status}
                                    </span>
                                    <span className="text-sm text-slate-500 font-medium flex items-center gap-1">
                                        <Calendar size={14} />
                                        {formatDate(shift.start_time)}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-1">
                                   {formatTime(shift.start_time)}
                                   <span className="text-slate-300">→</span>
                                   {shift.end_time ? formatTime(shift.end_time) : 'Now'}
                                </h3>
                                 <p className="text-xs text-slate-400 font-medium">
                                     Duration: {getDuration(shift.start_time, shift.end_time)}
                                 </p>
                                 <div className="flex gap-4 mt-1">
                                     <div className="flex flex-col">
                                         <span className="text-[10px] text-slate-400 uppercase font-bold">Opened By</span>
                                         <span className="text-xs text-slate-600 font-semibold">{shift.user_name || 'System'}</span>
                                     </div>
                                     {shift.status === 'closed' && (
                                         <div className="flex flex-col border-l border-slate-200 pl-4">
                                             <span className="text-[10px] text-slate-400 uppercase font-bold">Closed By</span>
                                             <span className="text-xs text-slate-600 font-semibold">{shift.closed_by_name || shift.user_name || 'System'}</span>
                                         </div>
                                     )}
                                 </div>
                            </div>

                            {/* Middle: Metrics */}
                            <div className="flex gap-6 sm:gap-10">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">Start Cash</span>
                                    <span className="font-mono text-slate-900 font-medium">
                                        {formatCurrency(shift.start_cash, business?.currency)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">Expected</span>
                                    <span className="font-mono text-slate-900 font-medium">
                                        {shift.status === 'closed' ? formatCurrency(shift.expected_cash, business?.currency) : '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">End Cash</span>
                                    <span className="font-mono text-slate-900 font-medium">
                                        {shift.end_cash !== null ? formatCurrency(shift.end_cash, business?.currency) : '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">Variance</span>
                                    <span className={`font-mono font-bold ${
                                        shift.status === 'open' 
                                            ? 'text-slate-400' 
                                            : shift.cash_variance === 0 
                                                ? 'text-green-600' 
                                                : shift.cash_variance < 0 
                                                    ? 'text-red-600' 
                                                    : 'text-amber-600'
                                    }`}>
                                        {shift.status === 'closed' ? (
                                            <>
                                                {shift.cash_variance > 0 ? '+' : ''}
                                                {formatCurrency(shift.cash_variance, business?.currency)}
                                            </>
                                        ) : '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">Sales</span>
                                    <span className="font-mono text-teal-700 font-bold">
                                        {formatCurrency(shift.total_sales, business?.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
           )}
        </div>
      )}
    </div>
  );
}
