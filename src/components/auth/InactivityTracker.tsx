'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  AlertCircle, 
  LogOut, 
  Clock, 
  ShieldAlert,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Constants
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD = 2 * 60 * 1000;  // Show modal 2 minutes before logout

export const InactivityTracker: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(120); // 120 seconds (2 mins)
  
  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showModal) {
      setShowModal(false);
      setCountdown(120);
    }
  }, [showModal]);

  const handleLogout = useCallback(() => {
    setShowModal(false);
    logout();
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const updateActivity = () => resetActivity();
    
    events.forEach(event => window.addEventListener(event, updateActivity));

    // Main check loop
    timerRef.current = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;
      
      if (inactiveTime >= (INACTIVITY_TIMEOUT - WARNING_THRESHOLD) && !showModal) {
          setShowModal(true);
      }
      
      if (inactiveTime >= INACTIVITY_TIMEOUT) {
          handleLogout();
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, resetActivity, showModal, handleLogout]);

  // Countdown logic for modal
  useEffect(() => {
    if (showModal) {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(120);
    }
    
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showModal, handleLogout]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />
      
      <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-rose-600 p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
            <ShieldAlert size={120} />
          </div>
          <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Clock size={12} />
            Session Security
          </div>
          <h2 className="text-3xl font-black tracking-tighter">Session Expiring</h2>
          <p className="text-rose-100 text-sm font-medium opacity-90 mt-1">You've been inactive for a while. For your security, we'll log you out soon.</p>
        </div>

        <div className="p-10 space-y-8">
            <div className="flex flex-col items-center justify-center py-6">
                <div className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums mb-2">
                    {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seconds Remaining</p>
            </div>

            <div className="space-y-3">
                <button 
                    onClick={resetActivity}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                >
                    <Zap size={18} className="fill-current text-teal-400" />
                    Stay Logged In
                </button>
                <button 
                    onClick={handleLogout}
                    className="w-full py-4 bg-slate-50 text-rose-600 rounded-2xl font-black text-sm hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                >
                    <LogOut size={18} />
                    Logout Now
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
