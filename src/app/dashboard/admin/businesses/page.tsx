'use client';

import { useState, useEffect } from 'react';
import { AdminService, Business, BusinessModule } from '../../../../services/admin.service';
import { Plus, Search, Edit2, Trash2, Building, AlertCircle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                        <Building size={16} />
                      </div>
                      {biz.name}
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
                      onClick={() => handleDelete(biz.id)}
                      className="p-2 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
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
    </div>
  );
}
