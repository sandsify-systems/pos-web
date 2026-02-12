'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'react-hot-toast';

export const InactivityMonitor = () => {
  const { logout, isAuthenticated } = useAuth();
  const { inactivityTimeout } = useSettings();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!isAuthenticated || inactivityTimeout === 0) return;

    // Convert minutes to milliseconds
    const ms = inactivityTimeout * 60 * 1000;

    timeoutRef.current = setTimeout(() => {
      toast('Logging out due to inactivity', { icon: '⌛' });
      logout();
    }, ms);
  }, [inactivityTimeout, isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated || inactivityTimeout === 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleEvent = () => resetTimer();

    // Initialize timer
    resetTimer();

    // Add listeners
    events.forEach(event => {
      window.addEventListener(event, handleEvent);
    });

    return () => {
      // Cleanup listeners
      events.forEach(event => {
        window.removeEventListener(event, handleEvent);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inactivityTimeout, isAuthenticated, resetTimer]);

  return null;
};
