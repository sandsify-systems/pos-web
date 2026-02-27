'use client';

import { useEffect, useState } from 'react';
import { AdminService, GlobalPromotion, PromoUsage } from '../../../../services/admin.service';
import { 
  Plus, 
  Settings, 
  Calendar, 
  Tag, 
  Users, 
  CheckCircle2, 
  XCircle,
  TrendingDown,
  RotateCw
} from 'lucide-react';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<GlobalPromotion[]>([]);
  const [usage, setUsage] = useState<PromoUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<GlobalPromotion | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'usage'>('list');

  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quarterly_discount: 20,
    annual_discount: 40,
    is_active: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [promosData, usageData] = await Promise.all([
        AdminService.getGlobalPromotions(),
        AdminService.getGlobalPromotionUsage()
      ]);
      setPromotions(promosData);
      setUsage(usageData);
    } catch (err) {
      console.error("Failed to load promotions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedPromo) {
        await AdminService.updateGlobalPromotion(selectedPromo.id, form as any);
      } else {
        await AdminService.createGlobalPromotion(form as any);
      }
      setShowModal(false);
      setSelectedPromo(null);
      loadData();
    } catch (err) {
      alert("Action failed. Check console.");
    }
  };

  const handleEdit = (promo: GlobalPromotion) => {
    setSelectedPromo(promo);
    setForm({
      name: promo.name,
      description: promo.description,
      start_date: new Date(promo.start_date).toISOString().split('T')[0],
      end_date: new Date(promo.end_date).toISOString().split('T')[0],
      quarterly_discount: promo.quarterly_discount,
      annual_discount: promo.annual_discount,
      is_active: promo.is_active
    });
    setShowModal(true);
  };

  const toggleStatus = async (promo: GlobalPromotion) => {
    try {
      await AdminService.updateGlobalPromotion(promo.id, { is_active: !promo.is_active });
      loadData();
    } catch (err) {
      alert("Toggle failed");
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <RotateCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 font-medium font-outfit">Loading promotion data...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-outfit">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Promotions & Offers</h1>
          <p className="text-slate-500 font-medium">Manage automated launch offers and global discounts</p>
        </div>
        <button 
          onClick={() => {
            setSelectedPromo(null);
            setForm({
                name: '',
                description: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                quarterly_discount: 20,
                annual_discount: 40,
                is_active: true
            });
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-95"
        >
          <Plus size={20} />
          Create New Offer
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
                <Tag size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Active Offers</p>
            <h3 className="text-4xl font-black text-slate-900">{promotions.filter(p => p.is_active).length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Usage</p>
            <h3 className="text-4xl font-black text-slate-900">{usage.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <TrendingDown size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Impacted Revenue</p>
            <h3 className="text-4xl font-black text-slate-900">
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(usage.reduce((sum, u) => sum + u.amount_paid, 0))}
            </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-100 mb-6">
        <button 
          onClick={() => setActiveTab('list')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'list' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Promotion List
          {activeTab === 'list' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('usage')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'usage' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Benefit Usage Tracking
          {activeTab === 'usage' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {promotions.map((promo) => {
            const isExpired = new Date(promo.end_date) < new Date();
            const isFuture = new Date(promo.start_date) > new Date();
            const isActive = promo.is_active && !isExpired && !isFuture;

            return (
              <div key={promo.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900">{promo.name}</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                          isActive ? 'bg-emerald-100 text-emerald-700' : 
                          isExpired ? 'bg-slate-100 text-slate-500' : 
                          isFuture ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {isActive ? 'Active Now' : isExpired ? 'Expired' : isFuture ? 'Upcoming' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">{promo.description}</p>
                    </div>
                    <button 
                        onClick={() => handleEdit(promo)}
                        className="p-2 text-slate-400 hover:bg-slate-50 hover:text-teal-600 rounded-xl transition-all"
                    >
                        <Settings size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                        <TrendingDown className="text-teal-600" size={18} />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quarterly</p>
                            <p className="text-lg font-black text-slate-900">-{promo.quarterly_discount}%</p>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                        <TrendingDown className="text-teal-600" size={18} />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Annual</p>
                            <p className="text-lg font-black text-slate-900">-{promo.annual_discount}%</p>
                        </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {new Date(promo.start_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px]">TO</span>
                            {new Date(promo.end_date).toLocaleDateString()}
                        </div>
                    </div>
                    <button 
                        onClick={() => toggleStatus(promo)}
                        className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-colors ${promo.is_active ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                        {promo.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {promo.is_active ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {promotions.length === 0 && (
            <div className="col-span-full py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                <Tag size={48} className="text-slate-200" />
                <p className="text-slate-400 font-bold">No promotions found. Create your first campaign above.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Business</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Benefit Used</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Onboarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usage.map((u, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-900">{u.business_name}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase">{u.tenant_id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-black uppercase tracking-widest">
                      {u.plan_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    {new Intl.NumberFormat('en-NG').format(u.amount_paid)}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {usage.length === 0 && (
                <tr>
                   <td colSpan={4} className="py-20 text-center text-slate-400 font-bold">No active benefit usage detected in the system yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedPromo ? 'Edit Promotion' : 'New Global Offer'}</h2>
                        <p className="text-slate-500 text-sm font-medium">Define parameters for automatic discount application</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Name</label>
                            <input 
                                required
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                                placeholder="Launch Offer March 2026"
                                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 outline-none placeholder:text-slate-300"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                            <textarea 
                                required
                                value={form.description}
                                onChange={e => setForm({...form, description: e.target.value})}
                                placeholder="Public message about the offer..."
                                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 outline-none placeholder:text-slate-300 h-24 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                                <input 
                                    type="date"
                                    required
                                    value={form.start_date}
                                    onChange={e => setForm({...form, start_date: e.target.value})}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                                <input 
                                    type="date"
                                    required
                                    value={form.end_date}
                                    onChange={e => setForm({...form, end_date: e.target.value})}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quarterly Discount %</label>
                                <input 
                                    type="number"
                                    required
                                    value={form.quarterly_discount}
                                    onChange={e => setForm({...form, quarterly_discount: parseInt(e.target.value)})}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Annual Discount %</label>
                                <input 
                                    type="number"
                                    required
                                    value={form.annual_discount}
                                    onChange={e => setForm({...form, annual_discount: parseInt(e.target.value)})}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input 
                                type="checkbox"
                                id="is_active"
                                checked={form.is_active}
                                onChange={e => setForm({...form, is_active: e.target.checked})}
                                className="w-5 h-5 accent-teal-600 rounded-lg cursor-pointer"
                            />
                            <label htmlFor="is_active" className="text-sm font-bold text-slate-700 cursor-pointer">Activate this offer immediately</label>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <button 
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                            >
                                {selectedPromo ? 'Save Changes' : 'Launch Campaign'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
