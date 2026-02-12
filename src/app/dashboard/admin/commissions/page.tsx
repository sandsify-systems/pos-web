'use client';

import { useEffect, useState } from 'react';
import { SubscriptionService } from '../../../../services/subscription.service';
import { 
  Shield, 
  Settings, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Save,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../../../../lib/utils';
import { toast } from 'react-hot-toast';

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    onboarding_rate: 20,
    renewal_rate: 10,
    enable_renewal_commission: true,
    min_renewal_days: 0,
    commission_duration_days: 0
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [commReports, commSettings] = await Promise.all([
        SubscriptionService.getAllCommissions(),
        SubscriptionService.getCommissionSettings()
      ]);
      setCommissions(commReports);
      setSettings(commSettings);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await SubscriptionService.updateCommissionStatus(id, status);
      loadData();
      toast.success(`Commission marked as ${status}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const updated = await SubscriptionService.updateCommissionSettings(settings);
      setSettings(updated);
      toast.success('Settings updated successfully');
      loadData(); // Refresh everything
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading commission data...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Shield className="text-teal-600" />
             Commission Management
           </h1>
           <p className="text-slate-500">Global settings and payout tracking for installers</p>
        </div>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Policy Configuration */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-slate-900 font-bold">
            <Settings size={20} className="text-teal-600" />
            Global Policy Settings
          </div>
          
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <label className="premium-label">Onboarding Commission (%)</label>
              <input 
                type="number"
                value={settings.onboarding_rate}
                onChange={e => setSettings({...settings, onboarding_rate: parseFloat(e.target.value)})}
                className="premium-input"
              />
              <p className="text-[10px] text-slate-500 mt-2 font-medium">Paid on the business's first successful payment.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
               <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-200 tracking-tight">Renewal Commissions</span>
                  <span className="text-[10px] text-slate-500 font-medium">Toggle recurring payouts</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.enable_renewal_commission}
                    onChange={e => setSettings({...settings, enable_renewal_commission: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500 shadow-inner"></div>
               </label>
            </div>

            <div className={settings.enable_renewal_commission ? 'opacity-100' : 'opacity-30 pointer-events-none'}>
              <label className="premium-label">Renewal Commission (%)</label>
              <input 
                type="number"
                value={settings.renewal_rate}
                disabled={!settings.enable_renewal_commission}
                onChange={e => setSettings({...settings, renewal_rate: parseFloat(e.target.value)})}
                className="premium-input"
              />
            </div>

            <div className={settings.enable_renewal_commission ? 'space-y-6' : 'space-y-6 opacity-30 pointer-events-none'}>
              <div className="pt-4 border-t border-slate-800">
                <label className="premium-label">Min Renewal Duration (Days)</label>
                <select 
                  value={settings.min_renewal_days}
                  disabled={!settings.enable_renewal_commission}
                  onChange={e => setSettings({...settings, min_renewal_days: parseInt(e.target.value)})}
                  className="premium-input"
                >
                  <option value={0}>Any Plan (No minimum)</option>
                  <option value={30}>Monthly & Higher</option>
                  <option value={90}>Quarterly & Higher</option>
                  <option value={365}>Annual Only</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">Renewal commissions only apply if plan is ≥ this duration.</p>
              </div>

              <div>
                <label className="premium-label">Earning Period Limit</label>
                <select 
                  value={settings.commission_duration_days}
                  disabled={!settings.enable_renewal_commission}
                  onChange={e => setSettings({...settings, commission_duration_days: parseInt(e.target.value)})}
                  className="premium-input"
                >
                  <option value={0}>Lifetime (No limit)</option>
                  <option value={365}>1 Year from Onboarding</option>
                  <option value={730}>2 Years from Onboarding</option>
                  <option value={1095}>3 Years from Onboarding</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              disabled={savingSettings}
              className="w-full mt-4 bg-teal-600/10 text-teal-500 border border-teal-500/30 rounded-2xl py-4 font-black hover:bg-teal-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-500/5 group"
            >
              <Save size={18} className="group-hover:scale-110 transition-transform" />
              {savingSettings ? 'Securing Settings...' : 'Apply Global Changes'}
            </button>
          </form>
        </div>

        {/* Payout Tracking */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
             <DollarSign size={20} className="text-teal-600" />
             <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-sm text-slate-600">Installer/Business</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Type</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Amount</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Status</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Date</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">ID: {comm.installer_id}</div>
                      <div className="text-xs text-slate-500">Business ID: {comm.business_id}</div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        comm.type === 'ONBOARDING' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {comm.type}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {formatCurrency(comm.amount)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        comm.status === 'PAID' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {comm.status === 'PAID' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {comm.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {new Date(comm.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {comm.status === 'PENDING' && (
                        <button 
                          onClick={() => handleUpdateStatus(comm.id, 'PAID')}
                          className="text-teal-600 hover:text-teal-700 font-bold text-xs underline underline-offset-4"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {commissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                       No commission records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
