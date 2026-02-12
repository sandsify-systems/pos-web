
'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { CartProvider } from '@/contexts/CartContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <AuthProvider>
        <SubscriptionProvider>
          <SettingsProvider>
            <CartProvider>
              {children}
              <Toaster position="top-center" />
            </CartProvider>
          </SettingsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
