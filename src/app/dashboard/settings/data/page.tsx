'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/auth.service';
import { 
  Database, 
  Trash2, 
  Cloud, 
  ChevronLeft,
  Save,
  Loader2,
  Calendar,
  AlertCircle,
  HardDrive,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DataManagementPage() {
  const router = useRouter();
  const { business, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    data_retention_months: 6,
    auto_archive_enabled: false,
    archive_frequency: 'monthly'
  });

  useEffect(() => {
    if (business) {
      setFormData({
        data_retention_months: (business as any).data_retention_months || 6,
        auto_archive_enabled: (business as any).auto_archive_enabled || false,
        archive_frequency: (business as any).archive_frequency || 'monthly'
      });
    }
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    
    setLoading(true);
    try {
      await AuthService.updateBusiness(business.id.toString(), formData);
      toast.success('Data management settings updated');
      // In a real app, we might need a way to refresh the business context
      // for now, a reload or context update
      window.location.reload();
    } catch (error: any) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async () => {
    if (!business?.id) return;
    if (!confirm('This will PERMANENTLY delete raw records older than 12 months. Ensure you have backed up your data. Continue?')) return;
    
    setLoading(true);
    try {
      await AuthService.purgeData(business.id.toString());
      toast.success('Manual cleanup completed');
    } catch (e) {
      toast.error('Purge failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Management</h1>
          <p className="text-slate-500">Control your transaction history and archiving</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-4">
        <div className="bg-amber-100 p-2 rounded-lg text-amber-600 h-fit">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="font-bold text-amber-900">Database Growth Control</h4>
          <p className="text-sm text-amber-800 line-height-relaxed">
            As your business grows, keeping years of raw transaction data can slow down your app. 
            Archiving helps keep the database lean while preserving your financial records in the cloud.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Retention Period */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                 <Calendar size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Retention Period</h3>
           </div>
           
           <div className="space-y-4">
              <p className="text-sm text-slate-500">How long should raw transaction records stay in the active database?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 {[3, 6, 12, 24].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormData({...formData, data_retention_months: m})}
                      className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition-all ${
                        formData.data_retention_months === m 
                          ? 'border-teal-500 bg-teal-50 text-teal-700' 
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {m} Months
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Archiving Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Cloud size={20} />
                 </div>
                 <h3 className="font-bold text-slate-900">Cloud Archiving</h3>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, auto_archive_enabled: !formData.auto_archive_enabled})}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${formData.auto_archive_enabled ? 'bg-teal-600' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${formData.auto_archive_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>
           
           {formData.auto_archive_enabled && (
             <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1.5">
                   <label className="text-sm font-bold text-slate-700">Backup Frequency</label>
                   <select 
                     value={formData.archive_frequency}
                     onChange={(e) => setFormData({...formData, archive_frequency: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 outline-none"
                   >
                     <option value="monthly">Monthly</option>
                     <option value="bi-monthly">Bi-Monthly (Every 2 Months)</option>
                     <option value="quarterly">Quarterly</option>
                   </select>
                </div>

                <div 
                   onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/google/connect`}
                   className="p-4 bg-slate-50 border border-slate-200 rounded-xl group cursor-pointer hover:border-teal-300 transition-all"
                >
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 group-hover:text-teal-600 transition-colors">
                            <HardDrive size={20} />
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                               {business?.google_drive_linked ? 'Google Drive Connected' : 'Connect Google Drive'}
                            </h4>
                            <p className="text-xs text-slate-500 italic">
                               {business?.google_drive_linked ? 'Your backups are being saved to Drive' : 'No account connected yet'}
                            </p>
                         </div>
                      </div>
                      {!business?.google_drive_linked && (
                         <button type="button" className="text-xs font-black text-teal-600 hover:underline uppercase tracking-tight">Connect</button>
                      )}
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Manual Cleanup */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
           <div className="flex items-center gap-3 mb-2">
              <Trash2 size={20} className="text-red-600" />
              <h3 className="font-bold text-red-900">Emergency Cleanup</h3>
           </div>
           <p className="text-sm text-red-800 mb-4 opacity-80">
              Manually trigger an export and immediate deletion of records older than 12 months. This cannot be undone.
           </p>
           <button 
             type="button"
             onClick={handlePurge}
             disabled={loading}
             className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition-shadow shadow-lg shadow-red-600/20 disabled:opacity-50"
           >
              <Download size={16} />
              Run Manual Export & Purge
           </button>
        </div>

        <div className="pt-4 flex justify-end">
           <button 
             type="submit"
             disabled={loading}
             className="bg-teal-600 text-white rounded-xl px-10 py-3 font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50"
           >
             {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
             Apply Settings
           </button>
        </div>
      </form>
    </div>
  );
}
