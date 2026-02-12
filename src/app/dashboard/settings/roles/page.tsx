'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  Rocket, 
  Briefcase, 
  User as UserIcon,
  HelpCircle
} from 'lucide-react';
import { RolePermissions, UserRole } from '@/constants/roles';

export default function RoleManagementPage() {
  const router = useRouter();
  const roles = Object.keys(RolePermissions) as UserRole[];

    const getPermissionLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^can /, "")
      .replace(/^\w/, (c) => c.toUpperCase())
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER: return <Rocket size={24} className="text-purple-600" />;
      case UserRole.MANAGER: return <Briefcase size={24} className="text-blue-600" />;
      default: return <UserIcon size={24} className="text-slate-600" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER: return 'bg-purple-50 text-purple-700 border-purple-100';
      case UserRole.MANAGER: return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Roles & Permissions</h1>
          <p className="text-slate-500">View access levels for different team members</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-4 p-4 bg-teal-50 border border-teal-100 rounded-xl">
        <ShieldCheck className="text-teal-600 shrink-0 mt-0.5" size={24} />
        <div>
          <h3 className="font-bold text-teal-800">Role-Based Access Control</h3>
          <p className="text-teal-700 text-sm mt-1">
             Permissions are predefined for each role to ensure maximum security and operational efficiency. 
             Roles dictate what features users can access within the application.
          </p>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-6">
        {roles.map((role) => (
          <div key={role} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                   role === UserRole.OWNER ? 'bg-purple-50' : 
                   role === UserRole.MANAGER ? 'bg-blue-50' : 'bg-slate-50'
                }`}>
                   {getRoleIcon(role)}
                </div>
                <div>
                   <h2 className="font-bold text-lg text-slate-900">{role.toUpperCase()}</h2>
                   <p className="text-sm text-slate-500">
                      {role === UserRole.OWNER ? "Full business control and administration" : 
                       role === UserRole.MANAGER ? "Operational management and oversight" : 
                       "Day-to-day sales and basic operations"}
                   </p>
                </div>
             </div>
             
             <div className="p-6 bg-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   {Object.entries(RolePermissions[role]).map(([key, value]) => (
                      <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${value ? 'bg-white shadow-sm border border-slate-100' : 'opacity-50'}`}>
                         {value ? (
                            <CheckCircle2 size={16} className="text-teal-500 shrink-0" />
                         ) : (
                            <XCircle size={16} className="text-slate-300 shrink-0" />
                         )}
                         <span className={`text-xs font-bold uppercase ${value ? 'text-slate-700' : 'text-slate-400 decoration-slate-300'}`}>
                            {getPermissionLabel(key)}
                         </span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
