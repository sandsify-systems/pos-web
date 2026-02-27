'use client';

import { useEffect, useState } from 'react';
import { SubscriptionService } from '../../../../services/subscription.service';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Copy, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Hash,
  Star,
  Zap,
  Edit,
  Trash2,
  TrendingUp,
  Wallet,
  Clock,
  ArrowUpRight,
  User,
  Settings,
  MoreVertical,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency, cn } from '../../../../lib/utils';

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [affiliateStats, setAffiliateStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    online_name: '',
    commission_rate: 20,
    renewal_commission_rate: 10,
    discount_percentage: 20
  });

  const [editData, setEditData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      const data = await SubscriptionService.getAffiliates();
      setAffiliates(data);
    } catch (err: any) {
      toast.error('Failed to load affiliates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await SubscriptionService.createInfluencer(formData);
      toast.success(res.message || 'Influencer created successfully!');
      
      alert(`Account Created!\nPassword: ${res.temp_password}\nCode: ${res.code}\n\nEmail has been sent to the influencer.`);
      
      setIsCreateModalOpen(false);
      setFormData({ 
        first_name: '', last_name: '', email: '', online_name: '', 
        commission_rate: 20, renewal_commission_rate: 10, discount_percentage: 20 
      });
      loadAffiliates();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create influencer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await SubscriptionService.updateAffiliate(selectedAffiliate.id, editData);
      toast.success('Influencer updated successfully!');
      setIsEditModalOpen(false);
      loadAffiliates();
    } catch (err: any) {
      toast.error('Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this influencer? This will deactivate their codes.')) return;
    try {
      await SubscriptionService.deleteAffiliate(id);
      toast.success('Influencer deleted');
      loadAffiliates();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const viewStats = async (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    setIsStatsModalOpen(true);
    setAffiliateStats(null);
    try {
      const stats = await SubscriptionService.getAffiliateStats(affiliate.id);
      setAffiliateStats(stats);
    } catch (err) {
      toast.error('Failed to load stats');
    }
  };

  const openEdit = (affiliate: any) => {
    setSelectedAffiliate(affiliate);
    const ref = affiliate.referral_codes?.[0] || {};
    setEditData({
      first_name: affiliate.first_name,
      last_name: affiliate.last_name,
      active: affiliate.active,
      commission_rate: ref.onboarding_commission_rate || 20,
      renewal_commission_rate: ref.renewal_commission_rate || 10,
      discount_percentage: 20 // We'd need to fetch matching promo code but usually matches code
    });
    setIsEditModalOpen(true);
  };

  const filteredAffiliates = affiliates.filter(a => 
    a.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.referral_codes?.[0]?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-600 mb-1">
             <Zap size={18} className="fill-current" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Affiliate Portal v2</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
             Affiliates & Influencers
             <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full font-bold">{affiliates.length}</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage social media marketers and dynamic commission rates.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={loadAffiliates}
                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-teal-600 transition-all hover:bg-slate-50 shadow-sm"
            >
                <RefreshCw size={20} className={cn(loading && "animate-spin")} />
            </button>
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
                <UserPlus size={18} />
                Create Influencer
            </button>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search name, email or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                />
             </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marketer</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Referral Code</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Comm. %</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAffiliates.map((a) => (
                <tr key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => viewStats(a)}>
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                            {a.first_name[0]}{a.last_name[0]}
                        </div>
                        <div>
                            <p className="font-black text-slate-900 leading-tight">{a.first_name} {a.last_name}</p>
                            <p className="text-xs text-slate-500">{a.email}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-xl font-black text-xs tracking-wider border border-teal-100">
                        {a.referral_codes?.[0]?.code || 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <p className="text-sm font-black text-slate-700">{a.referral_codes?.[0]?.onboarding_commission_rate || 20}%</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Renewal: {a.referral_codes?.[0]?.renewal_commission_rate || 10}%</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {a.active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-black border border-emerald-100">
                            VERIFIED
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full text-[10px] font-black border border-slate-200">
                            INACTIVE
                        </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => viewStats(a)}
                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                            title="View Stats"
                        >
                            <TrendingUp size={18} />
                        </button>
                        <button 
                            onClick={() => openEdit(a)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit"
                        >
                            <Edit size={18} />
                        </button>
                        <button 
                            onClick={() => handleDelete(a.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INFLUENCER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !submitting && setIsCreateModalOpen(false)} />
            <form onSubmit={handleCreate} className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-900 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <UserPlus size={100} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">New Influencer Setup</h2>
                    <p className="text-slate-400 text-sm font-medium">Provision a new marketer with custom rates and credentials.</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">First Name</label>
                            <input 
                                placeholder="e.g. John" 
                                required 
                                value={formData.first_name} 
                                onChange={e => setFormData({...formData, first_name: e.target.value})} 
                                className="w-full bg-slate-50 border text-black border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Last Name</label>
                            <input 
                                placeholder="e.g. Doe" 
                                required 
                                value={formData.last_name} 
                                onChange={e => setFormData({...formData, last_name: e.target.value})} 
                                className="w-full bg-slate-50 border text-black border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                        <input 
                            placeholder="marketer@email.com" 
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Online / Brand Name (@)</label>
                        <input 
                            placeholder="TAOOMA" 
                            required 
                            value={formData.online_name} 
                            onChange={e => setFormData({...formData, online_name: e.target.value.toUpperCase()})} 
                            className="w-full bg-slate-50 border text-black border-slate-200 rounded-2xl px-5 py-4 text-sm font-black tracking-widest focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all placeholder:tracking-normal placeholder:font-normal" 
                        />
                        <p className="text-[10px] text-slate-400 font-medium ml-1 italic">* This will be used as their unique Promo & Referral Code.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Commission Rate (%)</label>
                            <div className="relative">
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                <input type="number" value={formData.commission_rate} onChange={e => setFormData({...formData, commission_rate: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Fan Discount (%)</label>
                            <div className="relative">
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                <input type="number" value={formData.discount_percentage} onChange={e => setFormData({...formData, discount_percentage: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-teal-500/10 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0 flex gap-3">
                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-sm hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-black text-sm hover:bg-teal-700 transition-all shadow-xl shadow-teal-500/10 disabled:opacity-50">
                        {submitting ? <RefreshCw className="animate-spin" size={18} /> : 'Finalize Account'}
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedAffiliate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsEditModalOpen(false)} />
            <form onSubmit={handleUpdate} className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Edit Affiliate</h2>
                        <p className="text-slate-400 text-xs font-medium">Update marketer profile and commission agreement.</p>
                    </div>
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24} /></button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">First Name</label>
                            <input value={editData.first_name} onChange={e => setEditData({...editData, first_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-black font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Last Name</label>
                            <input value={editData.last_name} onChange={e => setEditData({...editData, last_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-black font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-[1.5rem] border border-blue-100">
                        <div className="flex-1">
                            <p className="text-xs font-black text-blue-900 uppercase tracking-wider mb-0.5">Account Status</p>
                            <p className="text-[10px] text-blue-600 font-bold opacity-80">Toggle if this influencer is currently active.</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setEditData({...editData, active: !editData.active})}
                            className={cn("w-14 h-7 rounded-full transition-all relative p-1", editData.active ? "bg-teal-500" : "bg-slate-300")}
                        >
                            <div className={cn("w-5 h-5 bg-white rounded-full transition-all shadow-sm", editData.active ? "translate-x-7" : "translate-x-0")} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 text-center block">Onboarding (%)</label>
                            <input type="number" value={editData.commission_rate} onChange={e => setEditData({...editData, commission_rate: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black text-center outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 text-center block">Renewal (%)</label>
                            <input type="number" value={editData.renewal_commission_rate} onChange={e => setEditData({...editData, renewal_commission_rate: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black text-center outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-0 flex gap-3">
                    <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                        {submitting ? <RefreshCw className="animate-spin m-auto" size={18} /> : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* STATS MODAL (Profile View) */}
      {isStatsModalOpen && selectedAffiliate && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsStatsModalOpen(false)} />
              <div className="relative bg-white w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                  
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                              {selectedAffiliate.first_name[0]}{selectedAffiliate.last_name[0]}
                          </div>
                          <div>
                              <h2 className="text-2xl font-black text-slate-900">{selectedAffiliate.first_name} {selectedAffiliate.last_name}</h2>
                              <p className="text-sm text-slate-500 font-medium">Affiliate Performance Profile</p>
                          </div>
                      </div>
                      <button onClick={() => setIsStatsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X /></button>
                  </div>

                  {!affiliateStats ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
                          <RefreshCw className="animate-spin text-teal-600" size={32} />
                          <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Loading performance data...</p>
                      </div>
                  ) : (
                      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                          
                          {/* Top Stats Chips */}
                          <div className="grid grid-cols-3 gap-4">
                              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                  <Users className="text-teal-600 mb-2" size={20} />
                                  <h4 className="text-2xl font-black text-slate-900">{affiliateStats.total_fans}</h4>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Businesses</p>
                              </div>
                              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                  <Wallet className="text-emerald-600 mb-2" size={20} />
                                  <h4 className="text-2xl font-black text-slate-900">{formatCurrency(affiliateStats.total_earned)}</h4>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Out</p>
                              </div>
                              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                                  <Clock className="text-amber-600 mb-2" size={20} />
                                  <h4 className="text-2xl font-black text-slate-900">{formatCurrency(affiliateStats.pending_payout)}</h4>
                                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pending</p>
                              </div>
                          </div>

                          {/* Recent Onboards */}
                          <div className="space-y-4">
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <ArrowUpRight size={14} />
                                  Recent Fan Onboarding
                              </h3>
                              <div className="space-y-2">
                                  {affiliateStats.recent_onboards?.map((biz: any) => (
                                      <div key={biz.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-teal-200 transition-all">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-black">#{biz.id}</div>
                                              <p className="font-bold text-slate-800">{biz.name}</p>
                                          </div>
                                          <p className="text-[10px] font-bold text-slate-400">{new Date(biz.onboarded_at).toLocaleDateString()}</p>
                                      </div>
                                  ))}
                                  {(!affiliateStats.recent_onboards || affiliateStats.recent_onboards.length === 0) && (
                                      <div className="p-8 text-center bg-slate-50 rounded-2xl">
                                          <p className="text-xs font-bold text-slate-400">No recent signups found.</p>
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* Payout History */}
                          <div className="space-y-4">
                              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Wallet size={14} />
                                  Payout Log
                              </h3>
                              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                                  {affiliateStats.payout_history?.map((payout: any) => (
                                      <div key={payout.id} className="p-4 bg-white border-b border-slate-50 flex items-center justify-between last:border-0 hover:bg-slate-50 transition-colors">
                                          <div>
                                              <p className="text-sm font-black text-slate-900">{formatCurrency(payout.amount)}</p>
                                              <p className="text-[10px] text-slate-400 font-medium">{new Date(payout.created_at).toLocaleString()}</p>
                                          </div>
                                          <span className={cn(
                                              "px-2.5 py-1 rounded-full text-[9px] font-black border",
                                              payout.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                              payout.status === 'REQUESTED' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                              "bg-slate-50 text-slate-500 border-slate-100"
                                          )}>
                                              {payout.status}
                                          </span>
                                      </div>
                                  ))}
                                  {(!affiliateStats.payout_history || affiliateStats.payout_history.length === 0) && (
                                      <div className="p-8 text-center bg-slate-50">
                                          <p className="text-xs font-bold text-slate-400">No payout requests recorded.</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="p-8 bg-slate-950 text-white flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance ID: AFF-{selectedAffiliate.id}</p>
                      <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 text-xs font-black hover:text-teal-400 transition-all uppercase tracking-widest">
                          Manage Agreement
                          <ChevronRight size={14} />
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
