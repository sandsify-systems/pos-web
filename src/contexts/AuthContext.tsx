
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { User, Business } from '../types/auth';
import { AuthService } from '../services/auth.service';
import { Shift, ShiftService } from '../services/shift.service';

interface LastLoggedUser {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  business: Business | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeShift: Shift | null;
  lastLoggedUser: LastLoggedUser | null;
  login: (token: string, user: User, business?: Business) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setBusiness: (business: Business) => void;
  checkActiveShift: () => Promise<void>;
  clearLastLoggedUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusinessState] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [lastLoggedUser, setLastLoggedUser] = useState<LastLoggedUser | null>(null);
  const router = useRouter();



  const logout = useCallback(() => {
    Cookies.remove('auth_token');
    Cookies.remove('current_business_id');
    localStorage.removeItem('auth_token'); // Clear backup token
    localStorage.removeItem('current_business');
    localStorage.removeItem('user_data');
    localStorage.removeItem('subscription_data');
    
    setUser(null);
    setBusinessState(null);
    setActiveShift(null);
    router.push('/auth/login');
  }, [router]);



  const checkActiveShift = useCallback(async () => {
    try {
      const shift = await ShiftService.getActiveShift();
      setActiveShift(shift);
    } catch (e) {
      console.log('Failed to check active shift', e);
    }
  }, []);



  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Optimistic Restore from LocalStorage
        const storedToken = localStorage.getItem('auth_token') || Cookies.get('auth_token');
        const storedUser = localStorage.getItem('user_data');
        const storedBusiness = localStorage.getItem('current_business');
        const storedLastUser = localStorage.getItem('last_logged_user');

        if (storedLastUser) {
          try {
            setLastLoggedUser(JSON.parse(storedLastUser));
          } catch (e) {
             console.error("Failed to parse last logged user", e);
          }
        }

        // 2. Hydrate State Optimistically
        if (storedToken) {
           // Ensure Backup
           if (!localStorage.getItem('auth_token')) localStorage.setItem('auth_token', storedToken);
           if (!Cookies.get('auth_token')) Cookies.set('auth_token', storedToken, { expires: 7 });

           if (storedUser) {
              try {
                setUser(JSON.parse(storedUser));
              } catch (e) { console.error("Validation error: corrupted user data", e); }
           }
           
           if (storedBusiness) {
              try {
                setBusinessState(JSON.parse(storedBusiness));
              } catch (e) { console.error("Validation error: corrupted business data", e); }
           }

           // If we have optimistic data, stop loading immediately to prevent redirect
           if (storedUser) {
              setIsLoading(false); 
           }
           
           // 3. Background Verification (Revalidate with Server)
           try {
             // We use prompt execution to separate background check
             const verifySession = async () => {
                try {
                  const data = await AuthService.getProfile();
                  setUser(data.user);
                  if (data.business) {
                    setBusinessState(data.business);
                    localStorage.setItem('current_business', JSON.stringify(data.business));
                  }
                  localStorage.setItem('user_data', JSON.stringify(data.user));
                  
                  await checkActiveShift().catch(err => console.error("Shift check failed", err));
                } catch (error: any) {
                  console.error('Session verification failed:', error);
                  // CRITICAL: Only logout if definitely unauthorized. 
                  // Network errors should NOT log the user out if they have cached data.
                  if (error.response?.status === 401 || error.response?.status === 403) {
                    logout();
                  }
                }
             };
             await verifySession();
           } catch (error) {
             console.error("Background verification error", error);
           }
        }
      } catch (error) {
        console.error('Failed to init auth:', error);
      } finally {
        // Ensure loading is done in all cases
        setIsLoading(false);
      }
    };

    initAuth();
  }, [logout, checkActiveShift]);

  const login = useCallback((token: string, user: User, business?: Business) => {
    // Set Persistence
    Cookies.set('auth_token', token, { expires: 7 }); 
    localStorage.setItem('auth_token', token); // Backup for refreshes
    
    // Set State
    setUser(user);

    // Save Last Logged User
    const lastUser = {
      name: `${user.first_name} ${user.last_name}`,
      email: user.email
    };
    setLastLoggedUser(lastUser);
    localStorage.setItem('last_logged_user', JSON.stringify(lastUser));
    localStorage.setItem('user_data', JSON.stringify(user));

    if (business) {
      setBusinessState(business);
      Cookies.set('current_business_id', business.id.toString(), { expires: 7 });
      localStorage.setItem('current_business', JSON.stringify(business));
    }
    
    checkActiveShift();
  }, [checkActiveShift]);

  const clearLastLoggedUser = useCallback(() => {
    setLastLoggedUser(null);
    localStorage.removeItem('last_logged_user');
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await AuthService.getProfile();
      setUser(data.user);
      if (data.business) {
        setBusinessState(data.business);
        localStorage.setItem('current_business', JSON.stringify(data.business));
      }
      localStorage.setItem('user_data', JSON.stringify(data.user));
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }, []);

  const setBusiness = useCallback((business: Business) => {
    setBusinessState(business);
    Cookies.set('current_business_id', business.id.toString(), { expires: 7 });
    localStorage.setItem('current_business', JSON.stringify(business));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        isAuthenticated: !!user,
        isLoading,
        activeShift,
        lastLoggedUser,
        login,
        logout,
        refreshProfile,
        setBusiness,
        checkActiveShift,
        clearLastLoggedUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
