'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { AuthService } from '@/services/auth.service'; // Ensure this is imported
import { 
  User, 
  Building2, 
  MapPin, 
  CreditCard, 
  Layers, 
  Grid, 
  Printer, 
  FileText, 
  Calculator, 
  Users, 
  ShieldCheck, 
  Clock, 
  HelpCircle, 
  Info, 
  LogOut, 
  ChevronRight,
  Store,
  Wallet,
  Monitor,
  Database
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, business, logout } = useAuth();
  const { 
    enableDrafts, toggleDrafts, 
    enableTables, toggleTables,
    taxRate,
    inactivityTimeout,
    updateInactivityTimeout
  } = useSettings();

  const [loading, setLoading] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Role Checks
  const role = user?.role?.toLowerCase() || '';
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isManager = isOwner || isAdmin || role === 'manager';

  const canManageSettings = isManager;
  const canManageBusiness = isOwner || isAdmin;
  const canManageUsers = isOwner || isAdmin || (role === 'manager'); 
  const canManageShifts = true; 

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;
    try {
      await logout();
      router.push('/auth/login');
    } catch (e) {
      toast.error('Logout failed');
    }
  };

  const handleCurrencyUpdate = async (currency: string) => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const updated = await AuthService.updateBusiness(business.id, { currency });
      toast.success(`Currency updated to ${currency}`);
      setShowCurrencyModal(false);
      window.location.reload(); 
    } catch (e) {
      toast.error("Failed to update currency");
    } finally {
      setLoading(false);
    }
  };


  const Initials = ({ name }: { name: string }) => {
    const parts = name.split(' ');
    const initials = parts.length >= 2 
      ? `${parts[0][0]}${parts[1][0]}` 
      : name.slice(0, 2);
    return (
      <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold">
        {initials.toUpperCase()}
      </div>
    );
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 mt-2 px-1">
      {title}
    </h3>
  );

  const SettingCard = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onClick, 
    rightElement,
    danger = false
  }: { 
    icon: any, 
    title: string, 
    subtitle?: string, 
    onClick?: () => void,
    rightElement?: React.ReactNode,
    danger?: boolean
  }) => (
    <div 
      onClick={onClick}
      className={`
        flex items-center justify-between p-4 bg-white border rounded-xl transition-all
        ${onClick ? 'cursor-pointer hover:border-teal-300 hover:shadow-sm' : 'border-slate-200'}
        ${danger ? 'hover:bg-red-50 hover:border-red-200 group' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${danger ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className={`font-semibold ${danger ? 'text-red-700' : 'text-slate-900'}`}>{title}</h4>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        {onClick && !rightElement && (
          <ChevronRight size={18} className="text-slate-400" />
        )}
      </div>
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? 'bg-teal-600' : 'bg-slate-300'}`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account and business preferences</p>
      </div>

      {/* User & Business Profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-6 shadow-sm">
           <Initials name={`${user?.first_name} ${user?.last_name}`} />
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
               <h2 className="text-xl font-bold text-slate-900">{user?.first_name} {user?.last_name}</h2>
               <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-bold uppercase border border-teal-100">
                 {user?.role}
               </span>
             </div>
             <p className="text-slate-500 mb-4">{user?.email}</p>
             <button 
               onClick={() => router.push('/dashboard/profile')} 
               className="text-sm font-bold text-teal-600 hover:text-teal-700 hover:underline"
             >
               Edit Profile
             </button>
           </div>
        </div>

        {/* Business Brief */}
        {(canManageBusiness || canManageSettings) && (
           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
             <div className="flex items-center gap-3 mb-4">
                <Store className="text-slate-400" />
                <div>
                   <h3 className="font-bold text-slate-900">{business?.name}</h3>
                   <p className="text-xs text-slate-500 uppercase tracking-wide">{business?.type}</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg border border-slate-100">
                   <span className="block text-slate-400 text-xs mb-1">Currency</span>
                   <span className="font-bold text-slate-800">{business?.currency || 'NGN'}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100">
                   <span className="block text-slate-400 text-xs mb-1">Plan</span>
                   <span className="font-bold text-teal-600 block truncate">
                      {business?.subscription_status || 'Free'}
                   </span>
                </div>
             </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* Business Settings */}
          {(canManageBusiness || canManageSettings) && (
            <section>
              <SectionTitle title="Business & Billing" />
              <div className="space-y-3">
                 <SettingCard 
                   icon={Building2} 
                   title="Business Details" 
                   subtitle="Manage name, address and contact info"
                   // onClick={() => router.push('/dashboard/settings/business')} 
                 />
                 <SettingCard 
                   icon={CreditCard} 
                   title="Subscription" 
                   subtitle="View plans and billing history"
                   onClick={() => router.push('/dashboard/subscription')} 
                 />
                  {isManager && (
                    <SettingCard 
                      icon={Wallet} 
                      title="Currency Settings" 
                      subtitle={`Current: ${business?.currency}`}
                      onClick={() => setShowCurrencyModal(true)} 
                    />
                  )}
                  {canManageBusiness && (
                    <SettingCard 
                      icon={Database} 
                      title="Data Management" 
                      subtitle="Control archiving and DB growth"
                      onClick={() => router.push('/dashboard/settings/data')} 
                    />
                  )}
              </div>
            </section>
          )}

          {/* POS Configuration */}
          {canManageSettings && (
             <section>
               <SectionTitle title="POS Configuration" />
               <div className="space-y-3">
                  <SettingCard 
                    icon={Layers} 
                    title="Draft Orders" 
                    subtitle="Allow saving orders for later"
                    rightElement={<Toggle checked={enableDrafts} onChange={toggleDrafts} />}
                  />
                  <SettingCard 
                    icon={Grid} 
                    title="Table Management" 
                    subtitle="Enable table selection for orders"
                    rightElement={<Toggle checked={enableTables} onChange={toggleTables} />}
                  />
                  {enableTables && (
                    <SettingCard 
                      icon={MapPin} 
                      title="Manage Tables" 
                      subtitle="Setup floor plan and zones"
                      onClick={() => router.push('/dashboard/settings/tables')}
                    />
                  )}
                  <SettingCard 
                     icon={Printer} 
                     title="Printer Setup" 
                     subtitle="Configure receipts and printers"
                     onClick={() => router.push('/dashboard/settings/printers')}
                  />
               </div>
             </section>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
           
           {/* Team & Shifts */}
           <section>
              <SectionTitle title="Team & Operations" />
              <div className="space-y-3">
                 {canManageUsers && (
                   <SettingCard 
                     icon={Users} 
                     title="Staff Management" 
                     subtitle="Add or remove team members"
                     onClick={() => router.push('/dashboard/staff')}
                   />
                 )}
                 {canManageUsers && (
                   <SettingCard 
                     icon={ShieldCheck} 
                     title="Roles & Permissions" 
                     subtitle="Manage access levels"
                     onClick={() => router.push('/dashboard/settings/roles')}
                   />
                 )}
                 <SettingCard 
                    icon={Clock} 
                    title="Shift History" 
                    subtitle="View past shift records"
                    onClick={() => router.push('/dashboard/shifts')}
                 />
              </div>
           </section>

            <section>
              <SectionTitle title="Security" />
              <div className="space-y-3">
                 <SettingCard 
                   icon={Monitor} 
                   title="Active Sessions" 
                   subtitle="Manage logged in devices"
                   onClick={() => router.push('/dashboard/settings/sessions')}
                 />
                 <SettingCard 
                   icon={ShieldCheck} 
                   title="Auto Logout" 
                   subtitle="Inactivity period before logout"
                   rightElement={
                     <select 
                       value={inactivityTimeout}
                       onChange={(e) => updateInactivityTimeout(parseInt(e.target.value))}
                       className="bg-slate-100 border border-slate-200 text-sm font-semibold rounded-lg px-2 py-1 outline-none text-slate-700"
                       onClick={(e) => e.stopPropagation()}
                     >
                       <option value={15}>15 Minutes</option>
                       <option value={30}>30 Minutes</option>
                       <option value={60}>1 Hour</option>
                       <option value={120}>2 Hours</option>
                       <option value={0}>Never</option>
                     </select>
                   }
                 />
               </div>
            </section>

           {/* Support */}
           <section>
              <SectionTitle title="Support" />
              <div className="space-y-3">
                 <SettingCard 
                    icon={HelpCircle} 
                    title="Help & Support" 
                    subtitle="Get assistance and view guides"
                 />
                 <SettingCard 
                    icon={Info} 
                    title="About" 
                    subtitle="Version 1.0.0 (Beta)"
                 />
              </div>
           </section>

           {/* Danger Zone */}
           <section>
              <div className="pt-6">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-colors"
                >
                  <LogOut size={20} />
                  Log Out
                </button>
              </div>
           </section>

        </div>
      </div>
      
      {showCurrencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-900">Select Currency</h3>
                <button onClick={() => setShowCurrencyModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <ChevronRight className="rotate-90 text-slate-500" size={20} />
                </button>
             </div>
             <div className="p-2 space-y-1">
                {[
                  { label: "Nigerian Naira (₦)", value: "NGN" },
                  { label: "US Dollar ($)", value: "USD" },
                  { label: "British Pound (£)", value: "GBP" },
                  { label: "Euro (€)", value: "EUR" },
                ].map((c) => (
                   <button
                     key={c.value}
                     onClick={() => handleCurrencyUpdate(c.value)}
                     className={`w-full text-left p-3 rounded-xl flex justify-between items-center transition-colors ${business?.currency === c.value ? 'bg-teal-50 text-teal-700 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
                   >
                     <span>{c.label}</span>
                     {business?.currency === c.value && <ChevronRight size={16} className="text-teal-600" />}
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
