'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  CheckCircle2, 
  Printer, 
  Plus,
  Receipt,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { SalesService } from '@/services/sales.service';
import { formatCurrency, cn } from '@/lib/utils';
import { PaymentInfo } from '@/types/pos';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getSubtotal, clearCart } = useCart();
  const { business, user, activeShift } = useAuth();
  const { printerPaperSize } = useSettings();
  
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'EXTERNAL_TERMINAL'>('CASH');
  const [selectedProvider, setSelectedProvider] = useState<string>('opay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  const totalOrderAmount = getTotal();
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max(0, totalOrderAmount - totalPaid);

  useEffect(() => {
    // Default current amount to remaining balance
    if (remainingBalance > 0) {
      setCurrentAmount(remainingBalance.toString());
    } else {
      setCurrentAmount('0');
    }
  }, [remainingBalance]);

  const addPayment = (method: string, amount: number, provider?: string) => {
    if (amount <= 0) return;
    
    // If it's the same method/provider, just update the amount
    const existingIdx = payments.findIndex(p => p.method === method && p.terminal_provider === provider);
    if (existingIdx > -1) {
      const newPayments = [...payments];
      newPayments[existingIdx].amount += amount;
      setPayments(newPayments);
    } else {
      setPayments([...payments, { method, amount, terminal_provider: provider || null }]);
    }
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleQuickPayFull = (method: string, provider?: string) => {
    if (remainingBalance <= 0) return;
    addPayment(method, remainingBalance, provider);
  };

  const handleAddPaymentClick = () => {
    const amount = parseFloat(currentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amount > remainingBalance + 0.01) { // Precision allowance
       toast.error('Payment exceeds remaining balance');
       return;
    }

    addPayment(selectedMethod, amount, (selectedMethod === 'CARD' || selectedMethod === 'TRANSFER') ? selectedProvider : undefined);
  };

  const handleProcessPayment = async () => {
    if (items.length === 0) return;
    if (totalPaid < totalOrderAmount - 0.01) {
      toast.error('Total paid is less than order total');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        payments: payments.map(p => ({
            ...p,
            method: p.method === 'CARD' ? 'EXTERNAL_TERMINAL' : p.method // Backend normalization
        })),
        tax: 0, 
        discount: items.reduce((sum, item) => sum + item.discount, 0),
        shift_id: activeShift?.id
      };

      const response = await SalesService.createSale(payload);
      setCompletedSale(response);
      clearCart();
      toast.success('Sale completed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    const receiptEl = document.getElementById('checkout-receipt');
    if (!receiptEl) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const paperWidth = printerPaperSize === '58mm' ? '58mm' : '80mm';
    const fontSize = printerPaperSize === '58mm' ? '9px' : '11px';

    const saleItems = completedSale?.items || [];
    const saleDate = completedSale?.sale?.created_at || completedSale?.created_at 
      ? new Date(completedSale?.sale?.created_at || completedSale?.created_at).toLocaleString() 
      : new Date().toLocaleString();
    const saleRefNo = completedSale?.receipt_no || completedSale?.sale?.id || completedSale?.id || '';
    const subtotal = Number(completedSale?.sale?.subtotal || completedSale?.subtotal || 0);
    const total = Number(completedSale?.sale?.total || completedSale?.total || 0);
    const methodStr = completedSale?.sale?.payment_method || 'SPLIT';

    let itemsHtml = '';
    saleItems.forEach((item: any) => {
      itemsHtml += `<div style="display:flex;justify-content:space-between;padding:2px 0;">
        <span>${item.quantity}x ${item.product_name || item.product?.name || 'Item'}</span>
        <span style="font-weight:600;">${formatCurrency(item.unit_price * item.quantity, business?.currency)}</span>
      </div>`;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          @page { margin: 0; size: ${paperWidth} auto; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${paperWidth};
            font-family: 'Courier New', monospace;
            font-size: ${fontSize};
            color: #000;
            background: #fff;
            padding: 2mm;
          }
        </style>
      </head>
      <body>
        <div style="text-align:center;margin-bottom:8px;">
          <div style="font-weight:bold;font-size:1.1em;text-transform:uppercase;letter-spacing:0.1em;">${business?.name || ''}</div>
          <div style="font-size:0.85em;color:#666;">${saleDate}</div>
          <div style="font-size:0.75em;font-family:monospace;color:#999;">Ref: ${saleRefNo}</div>
        </div>
        <div style="border-top:1px dashed #333;border-bottom:1px dashed #333;padding:6px 0;margin:6px 0;">
          ${itemsHtml || '<div style="text-align:center;color:#999;font-style:italic;">No items</div>'}
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;">
            <span>Subtotal</span>
            <span>${formatCurrency(subtotal, business?.currency)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0 2px;border-top:1px solid #ccc;margin-top:4px;font-weight:bold;font-size:1.1em;">
            <span>Total Paid</span>
            <span>${formatCurrency(total, business?.currency)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:0.85em;color:#666;">
            <span>Payment</span>
            <span style="font-weight:500;text-transform:uppercase;">${methodStr}</span>
          </div>
        </div>
        <div style="text-align:center;font-size:0.75em;margin-top:10px;">
          <p>Thank you for your patronage!</p>
          <p style="margin-top:2px;color:#999;">Powered by AlphaKit POS</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  if (items.length === 0 && !completedSale) {
    router.push('/dashboard/pos');
    return null;
  }

  // --- RECEIPT VIEW ---
  if (completedSale) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 print:shadow-none print:w-full">
          <div className="bg-teal-600 p-8 text-white text-center print:hidden">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl font-bold">Payment Successful</h1>
            <p className="opacity-90 mt-1">Transaction completed</p>
          </div>

          <div className="p-8 space-y-6 print:p-0" id="checkout-receipt">
            <div className="text-center space-y-1 mb-6">
              <h2 className="font-bold text-xl text-slate-900 uppercase tracking-widest">{business?.name}</h2>
              <p className="text-xs text-slate-500">{completedSale.sale?.created_at || completedSale.created_at ? new Date(completedSale.sale?.created_at || completedSale.created_at).toLocaleString() : new Date().toLocaleString()}</p>
              <p className="text-xs text-slate-400 font-mono">Ref: {completedSale.receipt_no || completedSale.sale?.id || completedSale.id || ''}</p>
            </div>

            <div className="border-t border-b border-dashed border-slate-200 py-4 space-y-3">
              {(completedSale.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-700">
                    {item.quantity}x {item.product_name || item.product?.name}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(item.unit_price * item.quantity, business?.currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(completedSale.sale?.subtotal || completedSale.subtotal || 0), business?.currency)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-100 pt-4">
                <span>Total Paid</span>
                <span>{formatCurrency(Number(completedSale.sale?.total || completedSale.total || 0), business?.currency)}</span>
              </div>
              <div className="space-y-1 pt-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Payment Breakdown</p>
                {payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-500">
                        <span>{p.method} {p.terminal_provider ? `(${p.terminal_provider})` : ''}</span>
                        <span>{formatCurrency(p.amount, business?.currency)}</span>
                    </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-8 print:hidden">
              <button 
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                <Printer size={18} />
                Print Receipt
              </button>
              <button 
                onClick={() => router.push('/dashboard/pos')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-teal-50 text-teal-700 font-bold rounded-xl hover:bg-teal-100 transition-colors"
              >
                <Plus size={18} />
                New Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium"
      >
        <ArrowLeft size={20} />
        Back to Cart
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Summary & Added Payments */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -mr-16 -mt-16 -z-0 opacity-50" />
            
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">Checkout Summary</h2>
            
            <div className="space-y-4 mb-8 relative z-10">
                <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Bill</span>
                    <span className="text-2xl font-black text-slate-900">{formatCurrency(totalOrderAmount, business?.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-teal-600">
                    <span className="font-medium">Total Paid</span>
                    <span className="text-xl font-bold">{formatCurrency(totalPaid, business?.currency)}</span>
                </div>
                <div className={cn(
                    "flex justify-between items-center p-4 rounded-2xl",
                    remainingBalance > 0 ? "bg-orange-50 text-orange-700" : "bg-teal-50 text-teal-700"
                )}>
                    <span className="font-bold">Remaining</span>
                    <span className="text-xl font-black">{formatCurrency(remainingBalance, business?.currency)}</span>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Added Payments</p>
                {payments.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                        <Banknote className="mx-auto text-slate-200 mb-2" size={32} />
                        <p className="text-sm text-slate-400">No payments added yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {payments.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        {p.method === 'CASH' && <Banknote size={16} className="text-green-600" />}
                                        {p.method === 'CARD' && <CreditCard size={16} className="text-blue-600" />}
                                        {p.method === 'TRANSFER' && <Smartphone size={16} className="text-purple-600" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{p.method}</p>
                                        {p.terminal_provider && <p className="text-[10px] text-slate-500 uppercase">{p.terminal_provider}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-900">{formatCurrency(p.amount, business?.currency)}</span>
                                    <button 
                                        onClick={() => removePayment(i)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-900/20">
            <h3 className="font-bold mb-4 flex items-center gap-2">
                <Receipt size={18} className="text-teal-400" />
                Items Details
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm opacity-80 border-b border-white/5 pb-2">
                        <span>{item.quantity}x {item.product.name}</span>
                        <span>{formatCurrency(item.product.price * item.quantity, business?.currency)}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column: Payment Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full">
            <h2 className="text-2xl font-black text-slate-900 mb-8 mt-4">Manual Payment Input</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { id: 'CASH', label: 'Cash', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
                    { id: 'CARD', label: 'Card/POS', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'TRANSFER', label: 'Transfer', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id as any)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all",
                            selectedMethod === m.id 
                                ? "border-teal-600 bg-teal-50/50 ring-4 ring-teal-100" 
                                : "border-slate-100 hover:border-slate-200 bg-slate-50/30"
                        )}
                    >
                        <m.icon size={28} className={m.color} />
                        <span className="font-bold text-sm text-slate-700">{m.label}</span>
                    </button>
                ))}
                <button 
                  onClick={() => router.push('/dashboard/pos')}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:bg-slate-50 transition-all"
                >
                  <Plus size={24} />
                  <span className="font-bold text-sm">Add Item</span>
                </button>
            </div>

            {/* Reconciliation Config (Visible for digital payments) */}
            {(selectedMethod === 'CARD' || selectedMethod === 'TRANSFER') && (
                <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3 px-1">Select Reconciliation Provider</p>
                    <div className="flex flex-wrap gap-2">
                        {['moniepoint', 'opay', 'palmpay', 'monnify'].map((prov) => (
                            <button
                                key={prov}
                                onClick={() => setSelectedProvider(prov)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-bold border-2 capitalize transition-all",
                                    selectedProvider === prov 
                                        ? "bg-white border-teal-600 text-teal-700 shadow-sm" 
                                        : "bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                {prov}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-teal-50/50 rounded-xl flex items-start gap-3 border border-teal-100/50">
                        <AlertCircle className="text-teal-600 shrink-0" size={16} />
                        <p className="text-[10px] text-teal-800 leading-relaxed font-medium">
                            The system will generate a tracking reference for this {selectedMethod} payment to be reconciled against your {selectedProvider} dashboard.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase px-1 mb-2 block">Amount to Pay</label>
                    <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 group-focus-within:text-teal-600 transition-colors">
                            {business?.currency}
                        </div>
                        <input 
                            type="number" 
                            value={currentAmount}
                            onChange={(e) => setCurrentAmount(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-12 py-6 text-4xl font-black text-slate-900 group-focus-within:border-teal-600 outline-none transition-all shadow-inner"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleAddPaymentClick}
                        className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
                    >
                        Add to Split
                    </button>
                    <button 
                        onClick={() => handleQuickPayFull(selectedMethod, (selectedMethod === 'CARD' || selectedMethod === 'TRANSFER') ? selectedProvider : undefined)}
                        className="py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-teal-600/20"
                    >
                        Pay Remaining Full
                    </button>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100">
                <button
                    onClick={handleProcessPayment}
                    disabled={isProcessing || totalPaid < totalOrderAmount - 0.01}
                    className="w-full py-6 bg-slate-900 text-white font-black text-xl rounded-3xl hover:bg-slate-800 shadow-2xl shadow-slate-900/30 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    {isProcessing ? (
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            COMPLETE TRANSACTION
                            <CheckCircle2 size={24} className="text-teal-400" />
                        </>
                    )}
                </button>
                {totalPaid < totalOrderAmount - 0.01 && (
                    <p className="text-center text-xs font-bold text-orange-500 mt-4 flex items-center justify-center gap-1">
                        <AlertCircle size={14} />
                        Please fulfill the remaining {formatCurrency(remainingBalance, business?.currency)} to finish
                    </p>
                )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
