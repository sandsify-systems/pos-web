
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  Users, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  Store,
  Menu,
  ChefHat,
  Shield,
  CreditCard,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useState, useEffect } from 'react';

const menuItems = [
  // Super Admin Navigation
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard/admin', roles: ['super_admin'] },
  { icon: Store, label: 'Businesses', href: '/dashboard/admin/businesses', roles: ['super_admin'] },
  { icon: CreditCard, label: 'Subscriptions', href: '/dashboard/admin/subscriptions', roles: ['super_admin'] },
  { icon: Shield, label: 'Commissions', href: '/dashboard/admin/commissions', roles: ['super_admin'] },
  { icon: BookOpen, label: 'Training', href: '/dashboard/admin/training', roles: ['super_admin'] },

  // Installer Navigation
  { icon: Users, label: 'Referrals', href: '/dashboard/installer', roles: ['installer'] },

  // Business User Navigation
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['owner', 'admin', 'manager', 'cashier'] },
  { icon: ShoppingCart, label: 'POS Terminal', href: '/dashboard/pos', roles: ['owner', 'admin', 'manager', 'cashier'] },
  { icon: ChefHat, label: 'Real-time Monitor', href: '/dashboard/kds', roles: ['owner', 'admin', 'manager', 'kitchen'], requiresModule: 'KITCHEN_DISPLAY' },
  { icon: Package, label: 'Inventory', href: '/dashboard/inventory', roles: ['owner', 'admin', 'manager'] },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports', roles: ['owner', 'admin', 'manager'] },
  { icon: ShieldCheck, label: 'Compliance', href: '/dashboard/compliance', roles: ['owner', 'admin', 'manager'], requiresModule: 'AUTOMATED_COMPLIANCE' },
  { icon: Users, label: 'Staff', href: '/dashboard/staff', roles: ['owner', 'admin', 'manager'] },
  { icon: BookOpen, label: 'How It Works', href: '/dashboard/how-it-works', roles: ['owner', 'admin', 'manager', 'cashier'] },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings', roles: ['owner', 'admin', 'manager'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { business, logout, user } = useAuth();
  const { hasModule } = useSubscription();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-collapse on POS and KDS page
  useEffect(() => {
    if (pathname === '/dashboard/pos' || pathname === '/dashboard/kds') {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
    setIsMobileOpen(false); // Close mobile menu on nav
  }, [pathname]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col h-screen fixed md:sticky top-0 z-40 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64",
          // Mobile adjustments
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:translate-x-0" // Always show on desktop (subject to width change)
        )}
      >
        <div className={cn("p-6 flex items-center gap-3", isCollapsed && "justify-center px-2")}>
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white shrink-0">
            <Store size={24} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 overflow-hidden animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-900 truncate">{business?.name || 'My Business'}</h2>
              <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider truncate">{business?.type || 'Retail'}</p>
            </div>
          )}
        </div>

        {/* Toggle Button (Desktop only) */}
        <button 
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 text-slate-400 hover:text-teal-600 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {menuItems.filter(item => {
            // Check role permission
            if (item.roles && !item.roles.includes(user?.role?.toLowerCase() || '')) return false;
            
            // Check module subscription if required
            if ((item as any).requiresModule && !hasModule((item as any).requiresModule)) return false;
            
            return true;
          }).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative",
                  isActive 
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                
                {!isCollapsed && (
                  <span className="animate-in fade-in duration-200">{item.label}</span>
                )}
                
                {!isCollapsed && isActive && <ChevronRight size={16} className="ml-auto opacity-70" />}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={cn("p-4 border-t border-slate-100 space-y-4", isCollapsed && "items-center")}>
          <div className={cn("px-4 py-3 rounded-xl bg-slate-50 flex items-center gap-3", isCollapsed && "px-2 justify-center bg-transparent")}>
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden animate-in fade-in duration-200">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-slate-500 truncate lowercase">{user?.role}</p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="animate-in fade-in duration-200">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
