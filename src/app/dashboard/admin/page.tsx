'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Tag, 
  Package,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { AdminService, type BusinessModule, type PromoCode, type SubscriptionWithBusiness, type Business } from '../../../services/admin.service';
import { cn } from '../../../lib/utils';
import { toast } from 'react-hot-toast';

type Tab = 'subscriptions' | 'modules' | 'promo-codes';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('subscriptions');
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithBusiness[]>([]);
  const [modules, setModules] = useState<BusinessModule[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingModule, setEditingModule] = useState<BusinessModule | null>(null);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'subscriptions') {
        const data = await AdminService.getAllSubscriptions();
        setSubscriptions(data);
      } else if (activeTab === 'modules') {
        const [modulesData, businessesData] = await Promise.all([
          AdminService.getAllModules(),
          AdminService.getAllBusinesses(),
        ]);
        setModules(modulesData);
        setBusinesses(businessesData);
      } else if (activeTab === 'promo-codes') {
        const data = await AdminService.getAllPromoCodes();
        setPromoCodes(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    
    try {
      await AdminService.deleteModule(id);
      toast.success('Module deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete module');
    }
  };

  const handleDeletePromo = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    
    try {
      await AdminService.deletePromoCode(id);
      toast.success('Promo code deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete promo code');
    }
  };

  const handleToggleModuleStatus = async (module: BusinessModule) => {
    try {
      await AdminService.updateModule(module.id, { is_active: !module.is_active });
      toast.success('Module status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update module');
    }
  };

  const handleTogglePromoStatus = async (promo: PromoCode) => {
    try {
      await AdminService.updatePromoCode(promo.id, { active: !promo.active });
      toast.success('Promo code status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update promo code');
    }
  };

  const tabs = [
    { id: 'subscriptions' as Tab, label: 'Subscriptions', icon: TrendingUp },
    { id: 'modules' as Tab, label: 'Business Modules', icon: Package },
    { id: 'promo-codes' as Tab, label: 'Promo Codes', icon: Tag },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield className="text-purple-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Super Admin Panel</h1>
            <p className="text-sm text-slate-500">Manage subscriptions, modules, and promo codes</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2",
              activeTab === tab.id
                ? "text-purple-600 border-purple-600"
                : "text-slate-500 border-transparent hover:text-slate-700"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'subscriptions' && (
              <SubscriptionsTab subscriptions={subscriptions} />
            )}
            {activeTab === 'modules' && (
              <ModulesTab 
                modules={modules} 
                onAdd={() => {
                  setEditingModule(null);
                  setShowModuleModal(true);
                }}
                onEdit={(module) => {
                  setEditingModule(module);
                  setShowModuleModal(true);
                }}
                onDelete={handleDeleteModule}
                onToggleStatus={handleToggleModuleStatus}
              />
            )}
            {activeTab === 'promo-codes' && (
              <PromoCodesTab 
                promoCodes={promoCodes}
                onAdd={() => {
                  setEditingPromo(null);
                  setShowPromoModal(true);
                }}
                onEdit={(promo) => {
                  setEditingPromo(promo);
                  setShowPromoModal(true);
                }}
                onDelete={handleDeletePromo}
                onToggleStatus={handleTogglePromoStatus}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showModuleModal && (
        <ModuleModal
          module={editingModule}
          businesses={businesses}
          onClose={() => setShowModuleModal(false)}
          onSuccess={() => {
            setShowModuleModal(false);
            fetchData();
          }}
        />
      )}

      {showPromoModal && (
        <PromoCodeModal
          promoCode={editingPromo}
          onClose={() => setShowPromoModal(false)}
          onSuccess={() => {
            setShowPromoModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Subscriptions Tab Component
function SubscriptionsTab({ subscriptions }: { subscriptions: SubscriptionWithBusiness[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'EXPIRED': return 'bg-red-100 text-red-700';
      case 'GRACE_PERIOD': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Business</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Plan</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Start Date</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">End Date</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subscriptions.map((sub) => (
            <tr key={sub.id} className="hover:bg-slate-50">
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{sub.business_name}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{sub.plan_type}</td>
              <td className="px-6 py-4">
                <span className={cn("px-2 py-1 rounded-full text-xs font-bold", getStatusColor(sub.status))}>
                  {sub.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {new Date(sub.start_date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {new Date(sub.end_date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                ₦{sub.amount_paid.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {subscriptions.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
          <p>No subscriptions found</p>
        </div>
      )}
    </div>
  );
}

// Modules Tab Component
function ModulesTab({ 
  modules, 
  onAdd, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: { 
  modules: BusinessModule[];
  onAdd: () => void;
  onEdit: (module: BusinessModule) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (module: BusinessModule) => void;
}) {
  return (
    <div>
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Business Modules</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
        >
          <Plus size={16} />
          Add Module
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Business</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Module</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Expiry Date</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {modules.map((module) => (
              <tr key={module.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{module.business_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{module.module}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onToggleStatus(module)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                      module.is_active 
                        ? "bg-green-100 text-green-700 hover:bg-green-200" 
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {module.is_active ? <Check size={12} /> : <X size={12} />}
                    {module.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {module.expiry_date ? new Date(module.expiry_date).toLocaleDateString() : 'No expiry'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(module)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(module.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {modules.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p>No modules found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Promo Codes Tab Component
function PromoCodesTab({ 
  promoCodes, 
  onAdd, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: { 
  promoCodes: PromoCode[];
  onAdd: () => void;
  onEdit: (promo: PromoCode) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (promo: PromoCode) => void;
}) {
  return (
    <div>
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Promo Codes</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
        >
          <Plus size={16} />
          Add Promo Code
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {promoCodes.map((promo) => (
              <tr key={promo.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-bold text-purple-600">{promo.code}</td>
                <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{promo.discount_percentage}%</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {promo.used_count} / {promo.max_uses || '∞'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(promo.expiry_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onToggleStatus(promo)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                      promo.active 
                        ? "bg-green-100 text-green-700 hover:bg-green-200" 
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {promo.active ? <Check size={12} /> : <X size={12} />}
                    {promo.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(promo)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(promo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {promoCodes.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Tag size={48} className="mx-auto mb-4 opacity-20" />
            <p>No promo codes found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Module Modal Component
function ModuleModal({ 
  module, 
  businesses,
  onClose, 
  onSuccess 
}: { 
  module: BusinessModule | null;
  businesses: Business[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    business_id: module?.business_id || 0,
    module: module?.module || 'KITCHEN_DISPLAY',
    is_active: module?.is_active ?? true,
    expiry_date: module?.expiry_date ? module.expiry_date.split('T')[0] : '',
  });
  const [businessSearch, setBusinessSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(businessSearch.toLowerCase()) ||
    b.id.toString() === businessSearch
  );

  const selectedBusinessName = businesses.find(b => b.id === formData.business_id)?.name || 'Select Business';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (module) {
        await AdminService.updateModule(module.id, {
          is_active: formData.is_active,
          expiry_date: formData.expiry_date || undefined,
        });
        toast.success('Module updated');
      } else {
        await AdminService.createModule({
          ...formData,
          expiry_date: formData.expiry_date || undefined,
        });
        toast.success('Module created');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {module ? 'Edit Module' : 'Add Module'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!module && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Business
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for a business..."
                    value={businessSearch}
                    onChange={(e) => setBusinessSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none mb-1"
                  />
                  {businessSearch && filteredBusinesses.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredBusinesses.map(b => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, business_id: b.id });
                            setBusinessSearch(''); // Clear search on select
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex justify-between items-center"
                        >
                          <span className="font-medium">{b.name}</span>
                          <span className="text-xs text-slate-400">ID: {b.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="text-xs font-semibold py-1 px-3 bg-purple-50 text-purple-700 rounded-md inline-block">
                    Selected: {selectedBusinessName} (ID: {formData.business_id})
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Module Type
                </label>
                <select
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="KITCHEN_DISPLAY">Kitchen Display</option>
                  <option value="TABLE_MANAGEMENT">Table Management</option>
                  <option value="SAVE_DRAFTS">Save Drafts</option>
                  <option value="ADVANCED_INVENTORY">Advanced Inventory</option>
                  <option value="RECIPE_MANAGEMENT">Recipe Management (BOM)</option>
                  <option value="WHATSAPP_ALERTS">Security WhatsApp Alerts</option>
                  <option value="AUTOMATED_COMPLIANCE">Automated Compliance & Reporting</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-slate-700">Active</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Promo Code Modal Component
function PromoCodeModal({ 
  promoCode, 
  onClose, 
  onSuccess 
}: { 
  promoCode: PromoCode | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    code: promoCode?.code || '',
    discount_percentage: promoCode?.discount_percentage || 10,
    max_uses: promoCode?.max_uses || 100,
    expiry_date: promoCode?.expiry_date ? promoCode.expiry_date.split('T')[0] : '',
    active: promoCode?.active ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (promoCode) {
        await AdminService.updatePromoCode(promoCode.id, {
          discount_percentage: formData.discount_percentage,
          max_uses: formData.max_uses,
          expiry_date: formData.expiry_date,
          active: formData.active,
        });
        toast.success('Promo code updated');
      } else {
        await AdminService.createPromoCode(formData);
        toast.success('Promo code created');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save promo code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {promoCode ? 'Edit Promo Code' : 'Add Promo Code'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!promoCode && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none uppercase"
                placeholder="SUMMER2024"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Discount Percentage
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Max Uses
            </label>
            <input
              type="number"
              min="0"
              value={formData.max_uses}
              onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-slate-700">Active</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
