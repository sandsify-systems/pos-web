'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface PriceDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
}

export function PriceDisplay({ amount, currency = 'NGN', className = '' }: PriceDisplayProps) {
  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // formatted might look like "₦1,250.00" or "NGN 1,250.00"
  // Let's handle both
  let symbol = '';
  let rest = '';

  if (formatted.includes('₦')) {
    symbol = '₦';
    rest = formatted.replace('₦', '').trim();
  } else {
    // Fallback if Intl doesn't use the symbol but the code
    const parts = formatted.split(/\s+/);
    if (parts.length > 1) {
      symbol = parts[0];
      rest = parts.slice(1).join(' ');
    } else {
      rest = formatted;
    }
  }

  const [value, decimals] = rest.split('.');

  return (
    <span className={cn("inline-flex items-baseline font-black tracking-tighter", className)}>
      <sup className="text-[0.55em] font-bold mr-0.5 translate-y-[-0.2em]">{symbol}</sup>
      <span className="text-inherit">{value}</span>
      {decimals && (
        <sup className="text-[0.55em] font-bold ml-0.5 translate-y-[-0.2em]">{decimals}</sup>
      )}
    </span>
  );
}
