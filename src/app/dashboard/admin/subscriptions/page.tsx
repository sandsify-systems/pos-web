'use client';

import { useEffect, useState } from 'react';
import { SubscriptionService } from '../../../../services/subscription.service';
import { AdminService } from '../../../../services/admin.service'; // For admin actions
import { RefreshCw, Search, Calendar, ChevronDown, CheckCircle } from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Renewal State
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [renewForm, setRenewForm] = useState({
    business_id: '',
    plan_type: 'MONTHLY',
    duration_days: 30,
    amount: 0
  });

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await SubscriptionService.getAllSubscriptions();
      setSubscriptions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    try {
      const data = await AdminService.getAllBusinesses();
      setBusinesses(data);
    } catch (e) { console.error("Failed to load businesses list", e); }
  };

  useEffect(() => {
    loadSubscriptions();
    loadBusinesses();
  }, []);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!renewForm.business_id) return;
      
      await AdminService.renewSubscription({
        business_id: parseInt(renewForm.business_id),
        plan_type: renewForm.plan_type,
        duration_days: renewForm.duration_days,
        amount: renewForm.amount
      });
      
      setShowRenewModal(false);
      loadSubscriptions(); // Refresh list
      alert('Subscription renewed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Renewal failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading subscriptions...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Subscription Management</h1>
           <p className="text-slate-500">Monitor and manage all business subscriptions</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowRenewModal(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 flex items-center gap-2"
            >
                <RefreshCw size={18} />
                Renew / Extend
            </button>
            <button 
            onClick={loadSubscriptions}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
            Refresh
            </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-lg border border-rose-200">
          {error}
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-sm text-slate-600">Business</th>
              <th className="p-4 font-semibold text-sm text-slate-600">Plan</th>
              <th className="p-4 font-semibold text-sm text-slate-600">Status</th>
              <th className="p-4 font-semibold text-sm text-slate-600 text-right">Amount</th>
              <th className="p-4 font-semibold text-sm text-slate-600 text-right">Start Date</th>
              <th className="p-4 font-semibold text-sm text-slate-600 text-right">End Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscriptions.map((sub: any) => (
              <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{sub.business_name || 'N/A'}</td>
                <td className="p-4 text-slate-600">{sub.plan_type}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    sub.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : sub.status === 'TRIAL' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : sub.status === 'EXPIRED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {sub.status}
                  </span>
                </td>
                <td className="p-4 text-right text-slate-600">
                  {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(sub.amount_paid)}
                </td>
                <td className="p-4 text-right text-slate-500 text-sm">
                  {new Date(sub.start_date).toLocaleDateString()}
                </td>
                <td className="p-4 text-right text-slate-500 text-sm">
                  {new Date(sub.end_date).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && !error && (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500">No subscriptions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

       {/* Renew Modal */}
       {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">Renew Subscription</h2>
            <form onSubmit={handleRenew} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business <span className="text-rose-500">*</span></label>
                <select 
                    required
                    value={renewForm.business_id}
                    onChange={e => setRenewForm({...renewForm, business_id: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm md:text-base text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                    <option value="">Select Business</option>
                    {businesses.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.tenant_id})</option>
                    ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Plan Type</label>
                   <select 
                      value={renewForm.plan_type}
                      onChange={e => setRenewForm({...renewForm, plan_type: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm md:text-base text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                   >
                     <option value="TRIAL">Free Trial</option>
                     <option value="STARTER">Starter</option>
                     <option value="GROWTH">Growth</option>
                     <option value="PRO">Pro</option>
                     <option value="ANNUAL">Annual Pro</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Days)</label>
                   <input 
                      type="number" 
                      value={renewForm.duration_days}
                      onChange={e => setRenewForm({...renewForm, duration_days: parseInt(e.target.value)})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm md:text-base text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                   />
                </div>
              </div>
              
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount Paid (NGN)</label>
                <input 
                  type="number" 
                  value={renewForm.amount}
                  onChange={e => setRenewForm({...renewForm, amount: parseFloat(e.target.value)})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm md:text-base text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                >
                  Renew Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
