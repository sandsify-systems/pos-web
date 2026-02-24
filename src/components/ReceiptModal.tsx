'use client';

import React, { useState } from 'react';
import { CheckCircle2, Printer, Plus, X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Sale } from '@/types/pos';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { SalesService } from '@/services/sales.service';
import { usePDF } from 'react-to-pdf';
import { toast } from 'react-hot-toast';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  items?: any[];
  onSaleVoided?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, sale, items, onSaleVoided }) => {
  const { business, user } = useAuth();
  const { printerPaperSize, autoPrint } = useSettings();
  const { toPDF, targetRef } = usePDF({filename: `receipt-${sale?.id}.pdf`});
  const [isVoiding, setIsVoiding] = useState(false);

  React.useEffect(() => {
    if (isOpen && autoPrint && sale) {
       const timer = setTimeout(() => {
          handlePrint();
       }, 500); // Give it a moment to render
       return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, sale]);

  if (!isOpen || !sale) return null;

  const saleItems = items || (sale as any).items || [];
  const saleTotal = sale.total;
  const salePayMethod = sale.payment_method || sale.paymentMethod;
  const saleRef = (sale as any).reference || sale.id; 
  const isVoided = sale.status === 'VOIDED' || (sale as any).status === 'voided';

  const userRole = user?.role?.toLowerCase() || '';
  const canVoid = ['owner', 'admin', 'manager'].includes(userRole) && !isVoided;

  const handlePrint = () => {
     const printWindow = window.open('', '_blank', 'width=400,height=600');
     if (!printWindow) return;

     const paperWidth = printerPaperSize === '58mm' ? '58mm' : '80mm';
     const fontSize = printerPaperSize === '58mm' ? '9px' : '11px';

     // Build items HTML from component state
     let itemsHtml = '';
     if (saleItems.length > 0) {
       saleItems.forEach((item: any) => {
         const name = item.product_name || item.product?.name || item.name || 'Item';
         const price = (item.unit_price || item.price || 0) * item.quantity;
         itemsHtml += `<div style="display:flex;justify-content:space-between;padding:2px 0;">
           <span>${item.quantity}x ${name}</span>
           <span style="font-weight:600;">${formatCurrency(price, business?.currency)}</span>
         </div>`;
       });
     } else {
       itemsHtml = '<div style="text-align:center;color:#999;font-style:italic;padding:4px 0;">Item details unavailable</div>';
     }

     // Format date
     const dateStr = sale.created_at || sale.createdAt
       ? new Date(sale.created_at || sale.createdAt!).toLocaleString()
       : 'Date N/A';

     // Void section
     let voidHtml = '';
     if (isVoided) {
       voidHtml = `<div style="margin-top:6px;padding:4px;border:1px solid #dc2626;background:#fef2f2;">
         <div style="font-size:0.75em;font-weight:bold;color:#dc2626;text-transform:uppercase;">Reason for voiding:</div>
         <div style="font-size:0.9em;font-style:italic;">${(sale as any).void_reason || 'Administrative correction'}</div>
       </div>`;
     }

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
           ${isVoided ? '<div style="font-weight:bold;font-size:0.85em;color:#dc2626;text-transform:uppercase;">*** VOIDED ***</div>' : ''}
           <div style="font-weight:bold;font-size:1.1em;text-transform:uppercase;letter-spacing:0.1em;">${business?.name || ''}</div>
           <div style="font-size:0.85em;color:#666;">${dateStr}</div>
           <div style="font-size:0.75em;font-family:monospace;color:#999;">Ref: ${saleRef}</div>
         </div>
         <div style="border-top:1px dashed #333;border-bottom:1px dashed #333;padding:6px 0;margin:6px 0;">
           ${itemsHtml}
         </div>
         <div>
           <div style="display:flex;justify-content:space-between;padding:2px 0;">
             <span>Subtotal</span>
             <span>${formatCurrency(Number(sale.subtotal || (sale as any).subtotal || 0), business?.currency)}</span>
           </div>
           <div style="display:flex;justify-content:space-between;padding:6px 0 2px;border-top:1px solid #ccc;margin-top:4px;font-weight:bold;font-size:1.1em;">
             <span>Total</span>
             <span${isVoided ? ' style="text-decoration:line-through;color:#999;"' : ''}>${formatCurrency(Number(saleTotal || 0), business?.currency)}</span>
           </div>
           <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:0.85em;color:#666;">
             <span>Payment</span>
             <span style="font-weight:500;text-transform:uppercase;">${salePayMethod || ''}</span>
           </div>
         </div>
         ${voidHtml}
         <div style="text-align:center;font-size:0.75em;margin-top:10px;">
           <p>Thank you for your patronage!</p>
           <p style="margin-top:2px;color:#999;">Powered by AlphaKit POS</p>
         </div>
       </body>
       </html>
     `);

     printWindow.document.close();

     // Wait for content to render, then print
     setTimeout(() => {
       printWindow.focus();
       printWindow.print();
       printWindow.close();
     }, 300);
  };

  const handleVoidSale = async () => {
    if (!sale?.id) return;
    
    const reason = window.prompt("Reason for voiding this sale:");
    if (reason === null) return; // Cancelled
    if (!reason.trim()) {
      toast.error("Reason is required to void a sale");
      return;
    }

    if (!window.confirm("Are you sure you want to void this sale? This action will restore stock and cannot be undone.")) return;

    setIsVoiding(true);
    try {
      await SalesService.voidSale(Number(sale.id), reason.trim());
      toast.success("Sale voided successfully");
      if (onSaleVoided) onSaleVoided();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to void sale");
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 z-10 print:hidden"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto flex-1 p-6 print:p-0" id="receipt-content" ref={targetRef}>
             <div className="text-center space-y-2 mb-8">
               <div className={cn(
                 "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 print:hidden ml-auto mr-auto",
                 isVoided ? "bg-rose-100 text-rose-600" : "bg-teal-100 text-teal-600"
               )}>
                 {isVoided ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
               </div>
               {isVoided && <p className="text-rose-600 font-bold text-xs uppercase tracking-widest print:hidden">Transaction Voided</p>}
               <h2 className="font-bold text-xl text-slate-900 uppercase tracking-widest">{business?.name}</h2>
               <p className="text-sm text-slate-500">
                  {sale.created_at || sale.createdAt ? new Date(sale.created_at || sale.createdAt!).toLocaleString() : 'Date N/A'}
               </p>
               <p className="text-xs text-slate-400 font-mono">Ref: {saleRef}</p>
             </div>

             <div className="border-t border-b border-dashed border-slate-200 py-4 space-y-3 mb-6">
                {saleItems.length > 0 ? (
                  saleItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-700">
                         {item.quantity}x {item.product_name || item.product?.name || item.name || 'Item'}
                      </span>
                      <span className="font-semibold text-slate-900">
                         {formatCurrency((item.unit_price || item.price || 0) * item.quantity, business?.currency)}
                      </span>
                    </div>
                  ))
                ) : (
                    <p className="text-center text-slate-400 italic text-sm">Item details unavailable</p>
                )}
             </div>

             <div className="space-y-2">
               <div className="flex justify-between text-sm text-slate-500">
                 <span>Subtotal</span>
                 <span>{formatCurrency(Number(sale.subtotal || (sale as any).subtotal || 0), business?.currency)}</span>
               </div>
               <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-100 pt-4">
                 <span>Total</span>
                 <span className={cn(isVoided && "line-through text-slate-400")}>{formatCurrency(Number(sale.total || (sale as any).total || 0), business?.currency)}</span>
               </div>
               <div className="flex justify-between text-xs text-slate-500 pt-1">
                 <span>Payment Method</span>
                 <span className="font-medium uppercase">{salePayMethod}</span>
               </div>
               {isVoided && (
                 <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                    <p className="text-xs text-rose-700 font-bold uppercase mb-1">Reason for voiding:</p>
                    <p className="text-sm text-rose-900 italic">{(sale as any).void_reason || 'Administrative correction'}</p>
                 </div>
               )}
             </div>
             
             <div className="hidden print:block text-center text-xs mt-8">
               <p>Thank you for your patronage!</p>
             </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3 print:hidden">
          <div className="flex gap-3">
            <button 
              onClick={() => toPDF()} 
              className="flex-1 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              Save PDF
            </button>
            <button 
              onClick={handlePrint} 
              className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
          
          {canVoid && (
            <button 
              onClick={handleVoidSale}
              disabled={isVoiding}
              className="w-full py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-lg hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
            >
              {isVoiding ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Void Transaction
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
