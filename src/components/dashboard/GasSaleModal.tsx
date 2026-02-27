'use client';

import React, { useState, useEffect } from 'react';
import { X, Scale, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GasSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (quantity: number, pricePerKg: number) => void;
  productName: string;
  pricePerKg: number; // Price per KG (e.g., 1100)
  availableStock?: number; // Stock in KG directly
  currency?: string;
}

export const GasSaleModal: React.FC<GasSaleModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddToCart, 
  productName,
  pricePerKg,
  availableStock = 0,
  currency = '₦'
}) => {
  const [amount, setAmount] = useState('');
  const [weight, setWeight] = useState('');
  const availableKg = availableStock; // Stock IS in KG directly

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setWeight('');
    }
  }, [isOpen]);

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && pricePerKg > 0) {
      const kg = num / pricePerKg;
      setWeight(kg.toFixed(3));
    } else {
      setWeight('');
    }
  };

  const handleWeightChange = (val: string) => {
    setWeight(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const amt = num * pricePerKg;
      setAmount(amt.toFixed(2));
    } else {
      setAmount('');
    }
  };

  const setPresetWeight = (w: number) => {
    setWeight(w.toString());
    const amt = w * pricePerKg;
    setAmount(amt.toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!isNaN(w) && w > 0) {
      if (w > availableKg) {
        return; // Handled by UI feedback
      }
      // Pass KG quantity and price per KG to parent
      onAddToCart(w, pricePerKg);
      onClose();
    }
  };

  if (!isOpen) return null;

  const presets = [0.5, 1, 2, 3, 5, 6, 12.5, 25];
  const currentWeight = parseFloat(weight) || 0;
  const isOverStock = currentWeight > availableKg;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white relative">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{productName}</h3>
              <p className="text-teal-100/80 text-xs font-medium mt-1">LPG Gas Refill Calculator</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="mt-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-teal-100 tracking-wider">Selling Rate</p>
              <p className="text-xl font-black">{currency}{pricePerKg.toLocaleString()} <span className="text-xs font-normal">/ KG</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-teal-100 tracking-wider">Available</p>
              <p className="text-lg font-bold">{availableKg.toLocaleString()}kg</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Presets */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Quick Select KG</label>
            <div className="grid grid-cols-4 gap-2">
              {presets.map(w => (
                <button
                  key={w}
                  type="button"
                  disabled={w > availableKg}
                  onClick={() => setPresetWeight(w)}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-bold transition-all border",
                    parseFloat(weight) === w 
                      ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600"
                  )}
                >
                  {w}kg
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Weight Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <Scale size={16} className="text-teal-600" />
                Target Weight
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className={cn(
                    "w-full px-4 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:outline-none font-bold text-2xl text-slate-900 transition-all",
                    isOverStock 
                       ? "border-rose-300 bg-rose-50 text-rose-900 focus:ring-rose-500/10 focus:border-rose-500" 
                       : "border-slate-200 focus:ring-teal-500/10 focus:border-teal-500"
                  )}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">kg</span>
              </div>
              {isOverStock && (
                <p className="text-[10px] text-rose-600 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                   Insufficient stock! Max available: {availableKg.toLocaleString()}kg
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 py-1">
                <div className="h-px bg-slate-100 flex-1"></div>
                <Calculator size={14} className="text-slate-300" />
                <div className="h-px bg-slate-100 flex-1"></div>
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <Calculator size={16} className="text-teal-600" />
                Total Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:outline-none focus:ring-teal-500/10 focus:border-teal-500 font-bold text-2xl text-teal-900 transition-all"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isOverStock || !weight || parseFloat(weight) <= 0}
              className="flex-1 py-4 px-6 rounded-2xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-lg shadow-teal-600/25 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              Add to Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
