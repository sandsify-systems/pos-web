'use client';

import { useState, useEffect } from 'react';
import { AdminService, Business, BusinessModule, BusinessDetails } from '../../../../services/admin.service';
import { Plus, Search, Edit2, Trash2, Building, AlertCircle, Package, RefreshCcw, Eye, MapPin, Mail, Phone, Calendar, Users, TrendingUp, DollarSign, ArrowUpRight, X, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, cn } from '../../../../lib/utils';

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedBizForModules, setSelectedBizForModules] = useState<Business | null>(null);
  const [bizModules, setBizModules] = useState<BusinessModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<BusinessDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    tenant_id: '',
    name: '',
    type: 'RETAIL',
    address: '',
    city: '',
    currency: 'NGN'
  });

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAllBusinesses();
      setBusinesses(data);
    } catch (err: any) {
      setError('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBusiness) {
        await AdminService.updateBusiness(editingBusiness.id, formData);
      } else {
        await AdminService.createBusiness(formData);
      }
      setShowModal(false);
      setEditingBusiness(null);
      setFormData({ tenant_id: '', name: '', type: 'RETAIL', address: '', city: '', currency: 'NGN' });
      fetchBusinesses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save business');
    }
  };

  const handleEdit = (biz: Business) => {
    setEditingBusiness(biz);
    setFormData({
      tenant_id: biz.tenant_id,
      name: biz.name,
      type: biz.type,
      address: biz.address || '',
      city: biz.city || '',
      currency: biz.currency
    });
    setShowModal(true);
  };

  const handleResetData = async (biz: Business) => {
    if (confirm(`CRITICAL ACTION: This will delete ALL sales, shifts, and audit logs for "${biz.name}". Quantities will be restored to stock. This is irreversible. Continue?`)) {
      try {
        setResettingId(biz.id);
        const res = await AdminService.resetBusinessData(biz.id);
        toast.success(res.message);
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to reset data');
      } finally {
        setResettingId(null);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to deactivate this business? This may be irreversible.')) {
      try {
        await AdminService.deleteBusiness(id);
        fetchBusinesses();
      } catch (err) {
        alert('Failed to delete business');
      }
    }
  };

  const handleManageModules = async (biz: Business) => {
    setSelectedBizForModules(biz);
    setShowModulesModal(true);
    setModulesLoading(true);
    try {
      const allModules = await AdminService.getAllModules();
      setBizModules(allModules.filter(m => m.business_id === biz.id));
    } catch (err) {
      toast.error('Failed to load modules');
    } finally {
      setModulesLoading(false);
    }
  };

  const handleToggleModule = async (mod: BusinessModule) => {
    try {
      await AdminService.updateModule(mod.id, { is_active: !mod.is_active });
      toast.success('Module updated');
      // Refresh local list
      setBizModules(prev => prev.map(m => m.id === mod.id ? { ...m, is_active: !m.is_active } : m));
    } catch (err) {
      toast.error('Failed to update module');
    }
  };

  const [newModuleType, setNewModuleType] = useState('KITCHEN_DISPLAY');
  const [addingModule, setAddingModule] = useState(false);

  const handleAddModule = async () => {
    if (!selectedBizForModules) return;
    setAddingModule(true);
    try {
      const mod = await AdminService.createModule({
        business_id: selectedBizForModules.id,
        module: newModuleType,
        is_active: true
      });
      setBizModules(prev => [...prev, mod]);
      toast.success('Module assigned');
    } catch (err) {
      toast.error('Failed to assign module');
    } finally {
      setAddingModule(false);
    }
  };

  const handleViewDetails = async (biz: Business) => {
    setShowDetailsModal(true);
    setDetailsLoading(true);
    try {
      const details = await AdminService.getBusinessDetails(biz.id);
      setSelectedDetails(details);
    } catch (err) {
      toast.error('Failed to load business details');
      setShowDetailsModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Businesses</h1>
          <p className="text-slate-500">Manage all registered businesses across tenants</p>
        </div>
        <button 
          onClick={() => {
            setEditingBusiness(null);
            setFormData({ tenant_id: '', name: '', type: 'RETAIL', address: '', city: '', currency: 'NGN' });
            setShowModal(true);
          }}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors"
        >
          <Plus size={18} />
          Add Business
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Name</th>
                <th className="p-4 font-semibold text-slate-600">Tenant ID</th>
                <th className="p-4 font-semibold text-slate-600">Type</th>
                <th className="p-4 font-semibold text-slate-600">Location</th>
                <th className="p-4 font-semibold text-slate-600">Referrer</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businesses.map((biz) => (
                <tr key={biz.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => handleViewDetails(biz)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                        <Building size={16} />
                      </div>
                      <span className="group-hover:text-teal-600 transition-colors">{biz.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-mono text-xs">{biz.tenant_id}</td>
                  <td className="p-4 text-slate-600">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium uppercase">
                      {biz.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    {biz.city ? `${biz.city}` : '-'}
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    {biz.installer_id ? (
                      <span className="text-teal-600 font-medium">Installer #{biz.installer_id}</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="p-4">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        biz.subscription_status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {biz.subscription_status}
                      </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleViewDetails(biz)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleManageModules(biz)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-purple-600 transition-colors"
                      title="Manage Modules"
                    >
                      <Package size={16} />
                    </button>
                    <button 
                      onClick={() => handleEdit(biz)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-teal-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleResetData(biz)}
                      disabled={resettingId === biz.id}
                      className="p-2 hover:bg-amber-50 rounded-lg text-slate-500 hover:text-amber-600 transition-colors disabled:opacity-50"
                      title="Reset Business Data"
                    >
                      <RefreshCcw size={16} className={resettingId === biz.id ? 'animate-spin' : ''} />
                    </button>
                    <button 
                      onClick={() => handleDelete(biz.id)}
                      className="p-2 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                      title="Deactivate Business"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {businesses.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">No businesses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">{editingBusiness ? 'Edit Business' : 'New Business'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenant ID <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.tenant_id}
                  onChange={e => setFormData({...formData, tenant_id: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g. TNT-001"
                  disabled={!!editingBusiness} // Don't verify ID edit for now
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Business Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                   <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                   >
                     <option value="RETAIL">Retail</option>
                     <option value="RESTAURANT">Restaurant</option>
                     <option value="BAR">Bar</option>
                     <option value="LOUNGE">Lounge</option>
                     <option value="SUPERMARKET">Supermarket</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                   <select 
                      value={formData.currency}
                      onChange={e => setFormData({...formData, currency: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                   >
                     <option value="NGN">NGN</option>
                     <option value="USD">USD</option>
                     <option value="GBP">GBP</option>
                     <option value="EUR">EUR</option>
                   </select>
                </div>
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="City"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  {editingBusiness ? 'Save Changes' : 'Create Business'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modules Modal */}
      {showModulesModal && selectedBizForModules && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Modules: {selectedBizForModules.name}</h2>
              <button onClick={() => setShowModulesModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <div className="p-6">
              {modulesLoading ? (
                <div className="py-8 text-center text-slate-500">Loading modules...</div>
              ) : (
                <div className="space-y-3">
                  {bizModules.length === 0 ? (
                    <p className="text-center py-4 text-slate-400">No special modules assigned.</p>
                  ) : (
                    bizModules.map(mod => (
                      <div key={mod.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                        <div>
                          <p className="font-semibold text-slate-900">{mod.module}</p>
                          <p className="text-xs text-slate-500">Exp: {mod.expiry_date ? new Date(mod.expiry_date).toLocaleDateString() : 'Never'}</p>
                        </div>
                        <button 
                          onClick={() => handleToggleModule(mod)}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            mod.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {mod.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    ))
                  )}
                  
                  <div className="pt-6 border-t border-slate-100 mt-6">
                    <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Assign New Module</p>
                    <div className="flex gap-2">
                      <select 
                        value={newModuleType}
                        onChange={e => setNewModuleType(e.target.value)}
                        className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="KITCHEN_DISPLAY">Kitchen Display</option>
                        <option value="TABLE_MANAGEMENT">Table Management</option>
                        <option value="SAVE_DRAFTS">Save Drafts</option>
                        <option value="ADVANCED_INVENTORY">Advanced Inventory</option>
                        <option value="RECIPE_MANAGEMENT">Recipe Management (BOM)</option>
                        <option value="WHATSAPP_ALERTS">WhatsApp Alerts</option>
                        <option value="AUTOMATED_COMPLIANCE">Compliance & Reporting</option>
                      </select>
                      <button 
                         onClick={handleAddModule}
                         disabled={addingModule}
                         className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50"
                      >
                        {addingModule ? '...' : 'Assign'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowModulesModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-end p-0">
          <div className="absolute inset-0" onClick={() => setShowDetailsModal(false)} />
          <div className="relative bg-white w-full max-w-4xl h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-xl">
                  {detailsLoading ? '-' : selectedDetails?.business.name[0]}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {detailsLoading ? 'Loading...' : selectedDetails?.business.name}
                  </h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={12} />
                      Member since {detailsLoading ? '...' : new Date(selectedDetails?.business.created_at || '').toLocaleDateString()}
                    </span>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-black border",
                      selectedDetails?.business.subscription_status === 'ACTIVE' ? "bg-teal-50 text-teal-600 border-teal-100" : "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      {selectedDetails?.business.subscription_status}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
              >
                <X size={24} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <RefreshCcw className="animate-spin text-teal-600" size={32} />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aggregating business data...</p>
              </div>
            ) : selectedDetails && (
              <div className="flex-1 overflow-y-auto p-8 space-y-12">
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-teal-200 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Revenue</p>
                    <h3 className="text-2xl font-black text-slate-900">{formatCurrency(selectedDetails.stats.revenue_today, selectedDetails.business.currency)}</h3>
                    <TrendingUp size={16} className="text-teal-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Weekly Gross</p>
                    <h3 className="text-2xl font-black text-slate-900">{formatCurrency(selectedDetails.stats.revenue_week, selectedDetails.business.currency)}</h3>
                    <ArrowUpRight size={16} className="text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Lifetime Profit</p>
                    <h3 className="text-2xl font-black text-emerald-700">{formatCurrency(selectedDetails.stats.total_profit, selectedDetails.business.currency)}</h3>
                    <TrendingUp size={16} className="text-emerald-500 mt-2" />
                  </div>
                  <div className="p-6 bg-rose-50/50 rounded-[2rem] border border-rose-100">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Expenses</p>
                    <h3 className="text-2xl font-black text-rose-700">{formatCurrency(selectedDetails.stats.total_expense, selectedDetails.business.currency)}</h3>
                    <DollarSign size={16} className="text-rose-500 mt-2" />
                  </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-3 gap-10">
                  
                  {/* Left Column: Charts */}
                  <div className="col-span-2 space-y-10">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <TrendingUp size={14} />
                        Financial Overview (6 Months Trend)
                      </h3>
                      <div className="h-[350px] w-full bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={selectedDetails.chart_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                            <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={0} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-6 mt-4 ml-4">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-900" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Profit</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expenses</span></div>
                      </div>
                    </div>

                    {/* Staff List */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users size={14} />
                        Staff Members ({selectedDetails.staff.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedDetails.staff.map(member => (
                          <div key={member.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:border-indigo-100 hover:bg-slate-50/50 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                              {member.first_name[0]}{member.last_name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{member.first_name} {member.last_name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{member.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Business Info & Owner */}
                  <div className="space-y-10">
                    
                    {/* Owner Details */}
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
                       <User size={100} className="absolute -bottom-8 -right-8 opacity-10" />
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Business Owner</h3>
                       {selectedDetails.owner ? (
                         <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl">
                                {selectedDetails.owner.first_name[0]}{selectedDetails.owner.last_name[0]}
                              </div>
                              <div>
                                <p className="text-lg font-black tracking-tight">{selectedDetails.owner.first_name} {selectedDetails.owner.last_name}</p>
                                <p className="text-slate-400 text-xs font-medium">Verified Proprietor</p>
                              </div>
                            </div>
                            <div className="space-y-3 pt-4">
                              <div className="flex items-center gap-3 text-sm text-slate-300">
                                <Mail size={16} className="text-teal-400" />
                                {selectedDetails.owner.email}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-300">
                                <Phone size={16} className="text-teal-400" />
                                {selectedDetails.owner.phone || 'N/A'}
                              </div>
                            </div>
                         </div>
                       ) : (
                         <p className="text-slate-500 italic text-sm">Owner details not available.</p>
                       )}
                    </div>

                    {/* Address & Logistics */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <MapPin size={14} />
                        Physical Location
                      </h3>
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Address</p>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedDetails.business.address || 'Street address not mapped.'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">City / Region</p>
                          <p className="text-sm font-bold text-slate-700">{selectedDetails.business.city || 'N/A'}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Settlement Currency</p>
                            <p className="text-xs font-black text-slate-900">{selectedDetails.business.currency}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tenant Hash</p>
                            <code className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg">{selectedDetails.business.tenant_id}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business ID: BIZ-{selectedDetails?.business.id}</p>
              <div className="flex items-center gap-4">
                <button className="text-xs font-black text-slate-600 hover:text-slate-900 transition-all uppercase tracking-widest px-4 py-2 border border-slate-200 rounded-xl">Generate Audit PDF</button>
                <button 
                  onClick={() => {
                    setEditingBusiness(selectedDetails?.business || null);
                    setShowModal(true);
                  }}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Edit profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
