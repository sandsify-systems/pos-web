'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/auth.service';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  ChevronLeft,
  Save,
  Loader2,
  Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setLoading(true);
    try {
      await AuthService.updateProfile(user.id, formData);
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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
          <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
          <p className="text-slate-500">Manage your personal information</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-32 bg-teal-600 relative">
           <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                 <div className="w-full h-full rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 text-3xl font-black relative group cursor-pointer">
                    {user.first_name?.[0].toUpperCase()}{user.last_name?.[0].toUpperCase()}
                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <Camera size={20} className="text-white" />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="pt-16 p-8">
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">First Name</label>
                    <div className="relative">
                       <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         type="text" 
                         value={formData.first_name}
                         onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-semibold text-slate-900"
                         required
                       />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Last Name</label>
                    <div className="relative">
                       <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         type="text" 
                         value={formData.last_name}
                         onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-semibold text-slate-900"
                         required
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-sm font-bold text-slate-700">Email Address</label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      value={user.email}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-500 cursor-not-allowed font-medium"
                    />
                 </div>
                 <p className="text-[10px] text-slate-400 px-1">Email address is your primary login and cannot be modified.</p>
              </div>

              <div className="space-y-1.5">
                 <label className="text-sm font-bold text-slate-700">Role & Access</label>
                 <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={user.role}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-500 cursor-not-allowed font-bold capitalize"
                    />
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                 <button 
                   type="submit"
                   disabled={loading}
                   className="bg-teal-600 text-white rounded-xl px-8 py-3 font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50"
                 >
                   {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                   Update Profile
                 </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
