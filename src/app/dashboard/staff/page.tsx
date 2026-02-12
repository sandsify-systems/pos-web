'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UserService } from '@/services/user.service';
import { User } from '@/types/auth';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Mail, 
  Shield, 
  Loader2,
  Trash2,
  Edit,
  X,
  Eye,
  EyeOff,
  Lock,
  Crown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function StaffPage() {
  const { user: currentUser } = useAuth();
  const { subscription, plans } = useSubscription();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'CASHIER' as 'MANAGER' | 'CASHIER',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Permission Check
  // In mobile: MANAGER and CASHIER has canManageUsers: false
  // Roles: OWNER, ADMIN, MANAGER, CASHIER
  const role = currentUser?.role?.toLowerCase();
  const canManage = role === 'owner' || role === 'admin';

  // Subscription Limit Check
  const currentPlan = plans.find(p => p.type === subscription?.plan_type);
  const userLimit = currentPlan?.user_limit || 2; // Default to 2 if unknown
  const activeUserCount = users.filter(u => u.active).length;
  const isLimitReached = activeUserCount >= userLimit && currentUser?.role !== 'super_admin';

  useEffect(() => {
    if (canManage) {
      fetchUsers();
    }
  }, [canManage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await UserService.getUsers();
      setUsers(data);
    } catch (e) {
      console.error("Failed to fetch users", e);
      toast.error("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'CASHIER',
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleOpenAdd = () => {
    if (isLimitReached) {
      toast.error(`User limit of ${userLimit} reached. Please upgrade your plan.`);
      return;
    }
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      password: '', // Empty for update unless changing
      role: (user.role?.toUpperCase() === 'MANAGER' ? 'MANAGER' : 'CASHIER'),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error("Password is required for new users");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const updates: any = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
        };
        if (formData.password) updates.password = formData.password;

        await UserService.updateUser(editingUser.id, updates);
        toast.success("Staff updated successfully");
      } else {
        await UserService.createUser({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          is_verified: true,
          active: true,
        } as any);
        toast.success("Staff added successfully");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || "Failed to save staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    
    try {
      await UserService.deleteUser(userId);
      toast.success("Staff deleted successfully");
      setUsers(users.filter(u => u.id.toString() !== userId.toString()));
    } catch (e) {
      toast.error("Failed to delete staff member");
    }
  };

  const filteredUsers = users.filter(u => 
    u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Lock size={64} className="mb-4 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p>You don't have permission to manage staff</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <div className="flex items-center gap-2 text-slate-500 mt-1">
             <p>Manage your team members</p>
             <span className="text-slate-300">•</span>
             <p className={`text-xs font-bold px-2 py-0.5 rounded-md border ${isLimitReached ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {activeUserCount} / {userLimit} Active Users
             </p>
          </div>
        </div>
        <button 
          onClick={handleOpenAdd}
          disabled={isLimitReached}
          className={`flex items-center justify-center gap-2 px-4 py-2 font-bold rounded-xl shadow-lg transition-all ${
             isLimitReached 
               ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
               : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-500/20'
          }`}
        >
          {isLimitReached ? <Crown size={20} className="text-amber-500" /> : <UserPlus size={20} />}
          {isLimitReached ? 'Plan Limit Reached' : 'Add Staff'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search staff by name or email..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 placeholder:text-slate-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => (
            <div key={u.id} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-4 group hover:border-teal-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-lg">
                    {u.first_name[0]}{u.last_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{u.first_name} {u.last_name}</h3>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                {/* Badge */}
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                  u.role === 'OWNER' ? 'bg-purple-100 text-purple-700' :
                  u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {u.role}
                </span>
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t border-slate-50 mt-auto">
                <button 
                  onClick={() => handleOpenEdit(u)}
                  className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit size={16} />
                  Edit
                </button>
                {u.role !== 'OWNER' && (
                  <button 
                    onClick={() => handleDelete(u.id)}
                    className="flex-1 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
              <Users size={48} className="mb-4 opacity-50" />
              <p>No staff members found.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingUser ? "Edit Staff Member" : "Add Staff Member"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="John"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Doe"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Email Address</label>
                 <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input
                     type="email"
                     value={formData.email}
                     onChange={(e) => setFormData({...formData, email: e.target.value})}
                     placeholder="john.doe@example.com"
                     disabled={!!editingUser}
                     className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-50 text-slate-900"
                   />
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between">
                   <label className="text-sm font-bold text-slate-700">
                      {editingUser ? "New Password (Optional)" : "Password"}
                   </label>
                 </div>
                 <div className="relative">
                   <input
                     type={showPassword ? "text" : "password"}
                     value={formData.password}
                     onChange={(e) => setFormData({...formData, password: e.target.value})}
                     placeholder={editingUser ? "Leave blank to keep current" : "Min 6 characters"}
                     className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900"
                   />
                   <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                   >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Role</label>
                 <div className="flex gap-3">
                    {['CASHIER', 'MANAGER'].map((r) => (
                       <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({...formData, role: r as any})}
                          className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                             formData.role === r 
                               ? 'border-teal-500 bg-teal-50 text-teal-700' 
                               : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                          }`}
                       >
                          {r}
                       </button>
                    ))}
                 </div>
              </div>
              
              <div className="pt-4">
                 <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
                 >
                    {submitting && <Loader2 className="animate-spin" size={20} />}
                    {editingUser ? 'Update Staff Member' : 'Create Staff Member'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
