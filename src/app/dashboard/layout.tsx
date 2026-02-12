
'use client';

import { Sidebar } from '../../components/dashboard/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { InactivityMonitor } from '../../components/dashboard/InactivityMonitor';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, Bell, HelpCircle, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const isFullscreenPage = pathname === '/dashboard/pos' || pathname === '/dashboard/kds';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!isLoading && !subLoading && isAuthenticated && !isSubscribed && user?.role !== 'super_admin') {
      router.push('/subscription/checkout');
    }
  }, [isLoading, subLoading, isAuthenticated, isSubscribed, router, user?.role]);

  // Default to collapsed header on fullscreen pages
  useEffect(() => {
    if (isFullscreenPage) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
  }, [isFullscreenPage]);

  if (isLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  
  const isSubscriptionPage = pathname.includes('/subscription');

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {!isSubscriptionPage && <InactivityMonitor />}
      {!isSubscriptionPage && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Toggle Button for Header (Only visible on POS page when header is hidden) */}
        {isFullscreenPage && !isHeaderVisible && (
          <div className="absolute top-0 right-4 z-20">
             <button 
               onClick={() => setIsHeaderVisible(true)}
               className="bg-white/80 backdrop-blur-sm border border-slate-200 border-t-0 rounded-b-lg px-3 py-1 text-slate-500 hover:text-teal-600 shadow-sm transition-all"
             >
               <ChevronDown size={14} />
             </button>
          </div>
        )}

        {/* Header */}
        <header 
          className={cn(
            "bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0 transition-all duration-300 ease-in-out",
            isHeaderVisible ? "h-16 opacity-100" : "h-0 opacity-0 overflow-hidden border-b-0",
            isSubscriptionPage && "h-20" // Slightly larger header for subscription pages
          )}
        >
          <div className="flex-1 max-w-xl">
            {!isSubscriptionPage ? (
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search resources, products, orders..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black text-xl">A</div>
                <h2 className="font-black text-slate-900 tracking-tighter">AB-POS <span className="text-teal-600 font-medium text-xs tracking-normal ml-1">Secure Checkout</span></h2>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!isSubscriptionPage && (
              <>
                <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                </button>
                <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                  <HelpCircle size={20} />
                </button>
                <div className="h-8 w-px bg-slate-200 mx-2" />
              </>
            )}
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-teal-600 font-bold uppercase mt-1">
                  {isSubscribed ? 'ACTIVE SESSION' : 'SUBSCRIPTION REQUIRED'}
                </p>
              </div>
              <button 
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-all border border-slate-200 hover:border-rose-100 group"
                title="Logout"
              >
                <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
              </button>
            </div>
            
            {/* Collapse Button (Only on POS page) */}
            {isFullscreenPage && (
              <button 
                onClick={() => setIsHeaderVisible(false)}
                className="ml-2 p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
                title="Collapse Header"
              >
                <ChevronUp size={18} />
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          {children}
        </main>
      </div>
    </div>
  );
}
