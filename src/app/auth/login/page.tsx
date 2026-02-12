
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { LogIn, Lock, Mail, Eye, EyeOff, ArrowRight, UserCircle, X } from 'lucide-react';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, lastLoggedUser, clearLastLoggedUser, isLoading } = useAuth();
  
  // Create local state to avoid flicker if context updates late, though context is quite fast.
  // Actually, rely on context.
  
  const isReturningUser = !!lastLoggedUser;

  useEffect(() => {
    if (lastLoggedUser) {
        setEmail(lastLoggedUser.email);
    }
  }, [lastLoggedUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.login(email, password);
      
      if (res.requires_otp) {
        toast.success('OTP sent to your email');
        router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }

      login(res.access_token, res.user, res.business);
      toast.success('Login successful');
      
      if (res.user.role === 'super_admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
      clearLastLoggedUser();
      setEmail('');
      setPassword('');
  };

  // If auth is loading, show nothing or spinner to prevent flash
  // However, `isLoading` from AuthContext is primarily for verifying SESSION.
  // Here we are on Login page, meaning session is likely invalid or missing.
  // But initAuth runs to load lastLoggedUser. So we might want to wait a tick?
  // Let's just render. The flicker might be minimal.

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {isReturningUser ? 'Welcome Back' : 'Sign In'}
            </h1>
            <p className="text-slate-500">
                {isReturningUser ? 'Enter your password to continue' : 'Enter your credentials to access your POS'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {isReturningUser ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-lg">
                            {lastLoggedUser?.name.charAt(0)}
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-slate-900 text-sm">{lastLoggedUser?.name}</p>
                            <p className="text-xs text-slate-500">{lastLoggedUser?.email}</p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={handleSwitchAccount}
                        className="text-xs text-teal-600 font-bold hover:underline"
                    >
                        Switch
                    </button>
                </div>
            ) : (
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                        <Mail size={18} />
                        </div>
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        placeholder="name@company.com"
                        required
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-slate-700">Password</label>
                {!isReturningUser && (
                    <Link href="/auth/forgot-password"  className="text-sm font-medium text-teal-600 hover:text-teal-700">
                    Forgot?
                    </Link>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {isReturningUser && (
                 <div className="flex justify-end">
                     <Link href="/auth/forgot-password" className="text-xs font-medium text-teal-600 hover:text-teal-700">
                        Forgot Password?
                     </Link>
                 </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isReturningUser ? 'Login' : 'Sign In'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {!isReturningUser && (
            <p className="text-center text-slate-500 text-sm">
                Don't have an account?{' '}
                <Link href="/auth/register" className="font-semibold text-teal-600 hover:text-teal-700">
                Create Business
                </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
