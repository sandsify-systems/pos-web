'use client';

import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  HandCoins,
  ShieldOff,
  BarChart3,
  TrendingUp,
  AlertOctagon
} from 'lucide-react';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ReconciliationDashboard() {
  const { business } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'logs' | 'insights'>('insights');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const fetchSettlement = async (date?: string) => {
    try {
      const bizId = business?.id;
      if (!bizId) return;
      const targetDate = date || new Date().toISOString().split('T')[0];
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://pos-v2-backend.onrender.com'}/api/v1/reconciliation/settlement?date=${targetDate}`);
      setSettlementData(res.data);
    } catch (err) {
      console.error('Settlement fetch error:', err);
    }
  };

  const fetchReconciliationData = async () => {
    setLoading(true);
    try {
      const bizId = business?.id;
      if (!bizId) return;

      const [pRes, lRes, sRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://pos-v2-backend.onrender.com'}/api/v1/reconciliation/payments`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://pos-v2-backend.onrender.com'}/api/v1/reconciliation/logs`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://pos-v2-backend.onrender.com'}/api/v1/reconciliation/summary`)
      ]);

      setPayments(pRes.data || []);
      setLogs(lRes.data || []);
      setSummary(sRes.data || null);
      fetchSettlement();
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliationData();
  }, [business?.id]);

  const handleManualVerify = async () => {
    if (!overrideReason.trim()) {
      toast.error('Please provide a reason for override');
      return;
    }

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'https://pos-v2-backend.onrender.com'}/api/v1/reconciliation/manual-verify`, {
        payment_id: selectedPayment.id,
        reason: overrideReason
      });
      toast.success('Payment verified manually');
      setShowOverrideModal(false);
      setOverrideReason('');
      fetchReconciliationData();
    } catch (error) {
      toast.error('Manual verification failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5"><CheckCircle2 size={12}/> RECONCILED</span>;
      case 'PENDING':
        return <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5"><Clock size={12}/> AWAITING BANK</span>;
      case 'FAILED':
        return <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5"><XCircle size={12}/> FAILED</span>;
      case 'MISMATCH':
        return <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5"><AlertTriangle size={12}/> OVERPAYMENT</span>;
      case 'PARTIAL':
        return <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5"><History size={12}/> UNDERPAYMENT</span>;
      default:
        return <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Payment Reconciliation
            <span className="bg-teal-600 text-[10px] text-white px-2 py-0.5 rounded uppercase tracking-widest font-black">Secure</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Monitor external POS terminal bank alerts and fraud flags.</p>
        </div>
        <button 
          onClick={fetchReconciliationData}
          className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
        >
          <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          Sync Activity
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Reconciled', value: summary?.status_counts?.SUCCESS || 0, color: 'emerald', icon: CheckCircle2 },
          { label: 'Commissions', value: `${business?.currency || '₦'}${summary?.total_commission?.toLocaleString() || '0'}`, color: 'amber', icon: HandCoins },
          { label: 'Net Settlements', value: `${business?.currency || '₦'}${summary?.total_net?.toLocaleString() || '0'}`, color: 'teal', icon: ShieldCheck },
          { label: 'Security Alerts', value: summary?.recent_alerts || 0, color: 'rose', icon: ShieldOff },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm shadow-slate-900/5 group hover:border-teal-200 transition-all">
            <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon size={24} />
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm shadow-slate-900/5 flex flex-col h-[600px]">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 p-2 gap-2 bg-slate-50/50">
          <button 
            onClick={() => setActiveTab('payments')}
            className={cn(
              "px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all",
              activeTab === 'payments' ? "bg-white text-teal-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Terminal Sales
          </button>
          <button 
            onClick={() => setActiveTab('insights')}
            className={cn(
              "px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all",
              activeTab === 'insights' ? "bg-white text-teal-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Security Insights
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={cn(
              "px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all",
              activeTab === 'logs' ? "bg-white text-teal-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Raw Webhooks
          </button>
        </div>

        {/* Dynamic Area */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'insights' ? (
             <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                   <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                        <BarChart3 size={20} className="text-teal-600" />
                        Provider Performance
                      </h3>
                      <p className="text-xs text-slate-500 italic mt-1 font-medium">Breakdown of terminal usage (Last 30 Days)</p>
                   </div>
                   <div className="h-[300px] w-full bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={Object.entries(summary?.provider_stats || {}).map(([name, count]) => ({ name: name.toUpperCase(), count }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                          <ReTooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {Object.entries(summary?.provider_stats || {}).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#14b8a6' : '#0d9488'} />
                            ))}
                          </Bar>
                        </ReBarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="space-y-6">
                   <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                        <AlertOctagon size={20} className="text-rose-600" />
                        Fraud & Alert Center
                      </h3>
                   </div>
                   <div className="space-y-4">
                      {summary?.recent_alerts > 0 ? (
                        payments.filter(p => ['MISMATCH', 'PARTIAL'].includes(p.status)).slice(0, 3).map(alert => (
                          <div key={alert.id} className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex gap-4">
                             <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                                <AlertTriangle size={24} />
                             </div>
                             <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-rose-900 uppercase italic">{alert.status}</span>
                                  <span className="text-[10px] font-bold text-rose-400">{format(new Date(alert.created_at), 'HH:mm')}</span>
                                </div>
                                <h4 className="font-bold text-slate-900 mt-1">Ref: {alert.internal_reference}</h4>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center text-slate-400 italic">
                           No alerts in the last 24 hours.
                        </div>
                      )}
                   </div>
                </div>

                {/* Daily Settlements (Phase 3.1) */}
                <div className="lg:col-span-2 space-y-6 pt-8 border-t border-slate-100">
                   <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                          <TrendingUp size={20} className="text-teal-600" />
                          Detailed Settlements
                        </h3>
                        <p className="text-xs text-slate-500 italic mt-1 font-medium">Daily financial breakdown & commissions</p>
                      </div>
                      <input 
                        type="date" 
                        defaultValue={new Date().toISOString().split('T')[0]}
                        onChange={(e) => fetchSettlement(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Settled Volume</p>
                         <p className="text-2xl font-black text-slate-900 mt-1">{business?.currency || '₦'}{settlementData?.total_volume?.toLocaleString() || '0'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total Provider Fees</p>
                         <p className="text-2xl font-black text-rose-600 mt-1">{business?.currency || '₦'}{settlementData?.total_fees?.toLocaleString() || '0'}</p>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-500/10">
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Net to Bank</p>
                         <p className="text-2xl font-black text-emerald-700 mt-1">{business?.currency || '₦'}{settlementData?.net_settlement?.toLocaleString() || '0'}</p>
                      </div>
                   </div>

                   {/* Provider breakdown for the selected day */}
                   {settlementData?.provider_volume && (
                     <div className="bg-white border border-slate-100 rounded-2xl p-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-4">Volume by Provider</h4>
                        <div className="flex flex-wrap gap-8">
                           {Object.entries(settlementData.provider_volume).map(([provider, volume]) => (
                             <div key={provider} className="flex flex-col">
                                <span className="text-xs font-black text-slate-400 uppercase">{provider}</span>
                                <span className="text-sm font-black text-slate-900 tracking-tight">{business?.currency}{Number(volume).toLocaleString()}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>
          ) : activeTab === 'payments' ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Reference #</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">DateTime</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Provider</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Terminal ID</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Net</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-sm font-black text-slate-900 font-mono">{p.internal_reference}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {format(new Date(p.created_at), 'MMM dd, HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded">{p.provider}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-mono text-slate-500 uppercase">{p.hardware_terminal_id || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">
                      {business?.currency || '₦'}{p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-teal-700">
                      {business?.currency || '₦'}{p.net_amount?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="px-6 py-4">
                      {p.status !== 'SUCCESS' && (
                        <button 
                          onClick={() => { setSelectedPayment(p); setShowOverrideModal(true); }}
                          className="text-[10px] font-black text-teal-600 uppercase border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-50"
                        >
                          Manual Override
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Time</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Provider</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {format(new Date(log.created_at), 'HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black uppercase bg-slate-100 px-2 py-1 rounded">{log.provider}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 italic truncate max-w-xs">
                      {log.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manual Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Manual Override</h2>
            <textarea 
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Audit reason..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm h-32 outline-none mb-6"
            />
            <div className="flex gap-4">
              <button onClick={() => setShowOverrideModal(false)} className="flex-1 font-black text-xs uppercase text-slate-500">Cancel</button>
              <button onClick={handleManualVerify} className="flex-[2] py-4 bg-teal-600 text-white font-black rounded-2xl">Verify Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
