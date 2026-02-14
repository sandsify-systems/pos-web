
'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  BarChart3,
  Settings,
  Store,
  Clock,
  CreditCard,
  Plus,
  ChefHat,
  Shield,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { ReportService, type DailyReport } from '../../services/report.service';
import { RolePermissions, UserRole } from '../../constants/roles';
import Link from 'next/link';

export default function DashboardPage() {
  const { business, user } = useAuth();
  const { hasModule } = useSubscription();
  const [reportData, setReportData] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const userRole = (user?.role || "cashier").toLowerCase() as UserRole;
  const permissions = RolePermissions[userRole] || RolePermissions.cashier;

  useEffect(() => {
    if (permissions.canViewReports) {
      fetchDailyData();
    }
  }, [business?.id]);

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      const data = await ReportService.getDailyReport();
      setReportData(data);
    } catch (e) {
      console.error("Failed to fetch dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      id: "pos",
      name: "Point of Sale",
      description: "Process new sales and orders",
      icon: ShoppingCart,
      href: "/dashboard/pos",
      permissionKey: "canProcessSales",
      color: "teal",
    },
    {
      id: "inventory",
      name: "Inventory",
      description: "Manage products and stock",
      icon: Package,
      href: "/dashboard/inventory",
      permissionKey: "canManageInventory",
      color: "purple",
    },
    {
      id: "reports",
      name: "Sales Reports",
      description: "Analyze business performance",
      icon: BarChart3,
      href: "/dashboard/reports",
      permissionKey: "canViewReports",
      color: "blue",
    },
    {
      id: "staff",
      name: "Staff Management",
      description: "Manage your team members",
      icon: Users,
      href: "/dashboard/staff",
      permissionKey: "canManageUsers",
      color: "orange",
    },
    {
      id: "shifts",
      name: "Shifts",
      description: "Track staff work hours",
      icon: Clock,
      href: "/dashboard/shifts",
      permissionKey: "canManageShifts",
      color: "amber",
    },
    {
      id: "settings",
      name: "Settings",
      description: "Configure system preferences",
      icon: Settings,
      href: "/dashboard/settings",
      permissionKey: "canManageSettings",
      color: "slate",
    },
    {
      id: "subscription",
      name: "Subscription",
      description: "Manage billing and plans",
      icon: CreditCard,
      href: "/dashboard/subscription",
      permissionKey: "canManageSettings",
      color: "pink",
    },
    {
      id: "admin",
      name: "Admin Panel",
      description: "Manage subscriptions, modules & promo codes",
      icon: Shield,
      href: "/dashboard/admin",
      permissionKey: "isSuperAdmin",
      color: "purple",
    },
    {
      id: "kds",
      name: "Real-time Monitor",
      description: "Real-time kitchen display system",
      icon: ChefHat,
      href: "/dashboard/kds",
      permissionKey: "isKDS",
      color: "emerald",
    },
  ];

  const allowedModules = modules.filter(m => {
    // Check role permission
    if (!(permissions as any)[m.permissionKey]) return false;
    
    // Check module subscription for KDS
    if (m.id === "kds" && !hasModule("KITCHEN_DISPLAY")) return false;
    
    return true;
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, <span className="text-teal-600">{user?.first_name}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Running <span className="font-semibold text-slate-700">{business?.name}</span> • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/pos"
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            Quick Sale
          </Link>
        </div>
        {/* Subtle background pattern */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-teal-50 rounded-full translate-x-16 -translate-y-16" />
      </div>

      {/* Metrics Grid */}
      {permissions.canViewReports && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales Today</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                {loading ? (
                  <div className="h-6 w-24 bg-slate-100 animate-pulse rounded" />
                ) : (
                  formatCurrency(reportData?.total_sales || 0, business?.currency)
                )}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Transactions</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                {loading ? (
                  <div className="h-6 w-12 bg-slate-100 animate-pulse rounded" />
                ) : (
                  reportData?.total_transactions || 0
                )}
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Sale</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                {loading ? (
                  <div className="h-6 w-20 bg-slate-100 animate-pulse rounded" />
                ) : (
                  formatCurrency(reportData?.average_sale || 0, business?.currency)
                )}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Banner */}
      {!permissions.isSuperAdmin && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-3xl p-8 text-white relative overflow-hidden group shadow-xl shadow-teal-600/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                <Lightbulb size={12} className="text-amber-300" />
                Quick Onboarding
              </div>
              <h2 className="text-2xl font-black tracking-tight">Need help setting up {business?.type?.replace('_', ' ') || 'your business'}?</h2>
              <p className="text-teal-50/80 font-medium max-w-xl">
                We've prepared simple, concise guides to help you master sales, stock management, and operational flow specific to your business model.
              </p>
            </div>
            <Link 
              href="/dashboard/how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-black rounded-xl hover:bg-teal-50 transition-all active:scale-[0.98] shadow-lg shadow-black/10 group-hover:translate-x-1"
            >
              Learn How It Works
              <ChevronRight size={18} />
            </Link>
          </div>
          {/* Abstract background graphics */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full translate-x-24 -translate-y-24 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 w-32 h-32 bg-teal-400/20 rounded-full translate-y-16 blur-2xl" />
        </div>
      )}

      {/* Main Modules Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 px-1">Business Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allowedModules.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col items-start gap-4"
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                item.color === 'teal' ? "bg-teal-50 text-teal-600" :
                item.color === 'purple' ? "bg-purple-50 text-purple-600" :
                item.color === 'blue' ? "bg-blue-50 text-blue-600" :
                item.color === 'orange' ? "bg-orange-50 text-orange-600" :
                item.color === 'amber' ? "bg-amber-50 text-amber-600" :
                item.color === 'pink' ? "bg-pink-50 text-pink-600" :
                "bg-slate-50 text-slate-600"
              )}>
                <item.icon size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{item.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Stats or Activity Footer could go here */}
    </div>
  );
}
