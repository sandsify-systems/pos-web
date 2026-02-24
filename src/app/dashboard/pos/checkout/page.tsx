'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  CheckCircle2, 
  Printer, 
  Plus,
  Receipt
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { SalesService } from '@/services/sales.service';
import { formatCurrency, cn } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getSubtotal, clearCart } = useCart();
  const { business, user, activeShift } = useAuth();
  const { printerPaperSize } = useSettings();
  
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  const totalAmount = getTotal();

  const handleProcessPayment = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    try {
      const payload = {
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        payment_method: paymentMethod,
        amount_paid: totalAmount,
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

    // Gather receipt data directly from state
    const saleItems = completedSale?.items || [];
    const saleDate = completedSale?.sale?.created_at || completedSale?.created_at 
      ? new Date(completedSale?.sale?.created_at || completedSale?.created_at).toLocaleString() 
      : new Date().toLocaleString();
    const saleRefNo = completedSale?.receipt_no || completedSale?.sale?.id || completedSale?.id || '';
    const subtotal = Number(completedSale?.sale?.subtotal || completedSale?.subtotal || 0);
    const total = Number(completedSale?.sale?.total || completedSale?.total || 0);
    const method = completedSale?.sale?.payment_method || paymentMethod;

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
            <span style="font-weight:500;text-transform:uppercase;">${method}</span>
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
      <div className="min-h-full flex items-center justify-center p-6 bg-slate-50/50">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              margin: 0;
              size: ${printerPaperSize === '58mm' ? '58mm auto' : '80mm auto'};
            }
            #checkout-receipt {
              width: ${printerPaperSize === '58mm' ? '58mm' : '80mm'} !important;
              padding: 2mm !important;
              font-size: ${printerPaperSize === '58mm' ? '9px' : '11px'} !important;
            }
          }
        `}} />
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 print:shadow-none print:w-full">
          <div className="bg-teal-600 p-8 text-white text-center print:hidden">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl font-bold">Payment Successful</h1>
            <p className="opacity-90 mt-1">Transaction completed</p>
          </div>

          <div className="p-8 space-y-6 print:p-0" id="checkout-receipt">
            {/* Receipt Content */}
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
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Payment Method</span>
                <span className="font-medium">{completedSale.sale?.payment_method || paymentMethod}</span>
              </div>
            </div>

            {/* Actions */}
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
            
            {/* Print Footer */}
            <div className="hidden print:block text-center text-xs mt-8">
              <p>Thank you for your patronage!</p>
              <p>Powered by AlphaKit POS</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- CHECKOUT VIEW ---
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium"
      >
        <ArrowLeft size={20} />
        Back to POS
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Order Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Receipt size={20} className="text-teal-600" />
              Order Summary
            </h2>
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.product.id} className="py-3 flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-500">
                      {item.quantity}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.product.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(item.product.price * item.quantity, business?.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(getSubtotal(), business?.currency)}</span>
              </div>
              <div className="flex justify-between text-2xl font-extrabold text-slate-900 pt-2">
                <span>Total</span>
                <span>{formatCurrency(totalAmount, business?.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Select Payment Method</h2>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all relative overflow-hidden",
                  paymentMethod === 'CASH' 
                    ? "border-teal-600 bg-teal-50/50" 
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  paymentMethod === 'CASH' ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                )}>
                  <Banknote size={24} />
                </div>
                <div className="text-left">
                  <h3 className={cn("font-bold", paymentMethod === 'CASH' ? "text-teal-900" : "text-slate-900")}>Cash</h3>
                  <p className="text-sm text-slate-500">Pay with physical currency</p>
                </div>
                {paymentMethod === 'CASH' && (
                  <div className="absolute right-4 text-teal-600">
                    <CheckCircle2 size={24} />
                  </div>
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('CARD')}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all relative overflow-hidden",
                  paymentMethod === 'CARD' 
                    ? "border-teal-600 bg-teal-50/50" 
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  paymentMethod === 'CARD' ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                )}>
                  <CreditCard size={24} />
                </div>
                <div className="text-left">
                  <h3 className={cn("font-bold", paymentMethod === 'CARD' ? "text-teal-900" : "text-slate-900")}>Card / POS Terminal</h3>
                  <p className="text-sm text-slate-500">Use external card reader</p>
                </div>
                {paymentMethod === 'CARD' && (
                  <div className="absolute right-4 text-teal-600">
                    <CheckCircle2 size={24} />
                  </div>
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('TRANSFER')}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all relative overflow-hidden",
                  paymentMethod === 'TRANSFER' 
                    ? "border-teal-600 bg-teal-50/50" 
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  paymentMethod === 'TRANSFER' ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                )}>
                  <Smartphone size={24} />
                </div>
                <div className="text-left">
                  <h3 className={cn("font-bold", paymentMethod === 'TRANSFER' ? "text-teal-900" : "text-slate-900")}>Bank Transfer</h3>
                  <p className="text-sm text-slate-500">Verify transfer before confirming</p>
                </div>
                {paymentMethod === 'TRANSFER' && (
                  <div className="absolute right-4 text-teal-600">
                    <CheckCircle2 size={24} />
                  </div>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleProcessPayment}
            disabled={isProcessing}
            className="w-full py-4 bg-teal-600 text-white font-bold text-lg rounded-xl hover:bg-teal-700 shadow-xl shadow-teal-600/20 disabled:opacity-70 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Confirm Payment
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono">
                  {formatCurrency(totalAmount, business?.currency)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
