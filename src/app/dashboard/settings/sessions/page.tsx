'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Globe, 
  LogOut, 
  Clock, 
  ChevronLeft,
  User as UserIcon,
  Trash2,
  AlertTriangle,
  Search,
  Calendar,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, isToday, isSameDay, startOfDay } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSessions = async () => {
    try {
      const data = await AuthService.getActiveSessions();
      setSessions(data);
    } catch (e) {
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id: number) => {
    if (!confirm('Logout this session?')) return;
    setRevoking(id);
    try {
      await AuthService.revokeSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      toast.success('Session revoked');
    } catch (e) {
      toast.error('Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('This will logout ALL users from ALL devices. Continue?')) return;
    try {
      await AuthService.logoutAllSessions();
      setSessions([]);
      toast.success('All sessions invalidated');
    } catch (e) {
      toast.error('Failed to logout sessions');
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return Smartphone;
    return Monitor;
  };

  // Filtering Logic
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = 
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.ip_address || '').includes(searchQuery);
      
      const sessionDate = new Date(s.created_at);
      const matchesDate = dateFilter === 'all' || isToday(sessionDate);
      
      return matchesSearch && matchesDate;
    });
  }, [sessions, searchQuery, dateFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSessions, currentPage]);

  // Grouping Logic (on paginated data)
  const groupedSessions = useMemo(() => {
    return paginatedSessions.reduce((groups: any, session) => {
      const date = format(new Date(session.created_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
      return groups;
    }, {});
  }, [paginatedSessions]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));
  }, [groupedSessions]);

  const isRecentlyActive = (lastUsed: string) => {
    const diff = new Date().getTime() - new Date(lastUsed).getTime();
    return diff < 5 * 60 * 1000; // Active within 5 minutes
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active Sessions</h1>
          <p className="text-slate-500">Manage all devices logged into your business account</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-4">
        <div className="bg-amber-100 p-2 rounded-lg text-amber-600 h-fit">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h4 className="font-bold text-amber-900">Account Security</h4>
          <p className="text-sm text-amber-800">
            If you notice any suspicious activity, you can revoke individual sessions or perform a global logout.
          </p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search user, email or IP..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500"
            />
          </div>
          
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => { setDateFilter('today'); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${dateFilter === 'today' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Today
            </button>
            <button
              onClick={() => { setDateFilter('all'); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${dateFilter === 'all' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              All History
            </button>
          </div>

          <button 
            onClick={handleLogoutAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} />
            Logout All
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
         <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-teal-600" />
            {dateFilter === 'today' ? "Today's Active Sessions" : "All Active Sessions"}
            <span className="text-slate-400 font-normal">({filteredSessions.length})</span>
         </h3>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShieldCheck size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No sessions found</h3>
            <p className="text-slate-500">No active login sessions match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                  {format(new Date(date), 'MMMM d, yyyy')}
                </span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>
              
              <div className="space-y-3">
                {groupedSessions[date].map((session: any) => {
                  const DeviceIcon = getDeviceIcon(session.device_info || '');
                  const active = isRecentlyActive(session.last_used_at);
                  
                  return (
                    <div 
                      key={session.id} 
                      className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-teal-300 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 relative">
                          <DeviceIcon size={24} />
                          {active && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 capitalize">
                              {session.first_name} {session.last_name}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              {session.ip_address}
                            </span>
                            {active && (
                              <span className="text-[10px] font-black text-green-600 uppercase bg-green-50 px-1.5 py-0.5 rounded">Active Now</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              Login: {format(new Date(session.created_at), 'HH:mm')}
                            </div>
                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                            <div className="flex items-center gap-1 truncate max-w-[150px]">
                              <UserIcon size={12} />
                              {session.email}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleRevoke(session.id)}
                        disabled={revoking === session.id}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30"
              >
                <ChevronLeftIcon size={20} />
              </button>
              <span className="text-sm font-bold text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
