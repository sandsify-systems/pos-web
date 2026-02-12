'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  LogOut, 
  ChefHat, 
  Printer, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Utensils
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { SalesService } from '../../../services/sales.service';
import { DraftService } from '../../../services/draft.service';
import { wsService, WS_EVENTS } from '../../../services/websocket.service';
import { cn, formatCurrency } from '../../../lib/utils';
import { PrepStatus, Sale } from '../../../types/pos';

export default function KitchenPage() {
  const { business, user, logout } = useAuth();
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePrintOrder, setActivePrintOrder] = useState<Sale | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      // DRAFTS items are active orders for the kitchen
      const drafts = await DraftService.listDrafts();
      setOrders(drafts);
    } catch (e) {
      console.error("[KDS] Fetch error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    wsService.connect();

    const handleUpdate = () => {
      fetchOrders();
    };

    const unsubCreated = wsService.on(WS_EVENTS.ORDER_CREATED, handleUpdate);
    const unsubPrep = wsService.on(WS_EVENTS.ORDER_PREP_UPDATE, handleUpdate);
    const unsubPaid = wsService.on(WS_EVENTS.ORDER_PAID, handleUpdate);
    const unsubVoided = wsService.on(WS_EVENTS.ORDER_VOIDED, handleUpdate);
    const unsubUpdated = wsService.on(WS_EVENTS.ORDER_UPDATED, handleUpdate);

    return () => {
      unsubCreated();
      unsubPrep();
      unsubPaid();
      unsubVoided();
      unsubUpdated();
      wsService.disconnect();
    };
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: number, currentStatus: PrepStatus = 'PENDING') => {
    // ... (logic remains same) ...
    let nextStatus: PrepStatus = 'PREPARING';
    if (currentStatus === 'PENDING') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    else if (currentStatus === 'READY') nextStatus = 'SERVED';
    else return;

    try {
      await SalesService.updatePreparationStatus(orderId, nextStatus);
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, preparation_status: nextStatus } : o
      ));
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const handlePrint = (order: Sale) => {
    setActivePrintOrder(order);
    setTimeout(() => {
        window.print();
        // Optional: clear after print dialog closes (though hard to detect accurately in all browsers, 
        // leaving it is fine as it's hidden)
        setActivePrintOrder(null); 
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      {/* KDS Header */}
      <header className="h-16 bg-[#1e293b] border-b border-slate-700/50 flex items-center justify-between px-6 shadow-xl relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center border border-teal-500/20">
            <ChefHat className="text-teal-400" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Real-time Display <span className="text-teal-400">System</span></h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{business?.name} • Live</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={fetchOrders}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
          <div className="h-6 w-[1px] bg-slate-700/50" />
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      {/* Main KDS Board */}
      <main className="flex-1 p-6 overflow-x-auto overflow-y-hidden">
        {loading ? (
            <div className="w-full h-full flex items-center justify-center">
                <RefreshCw size={48} className="text-teal-500 animate-spin" />
            </div>
        ) : (
            <div className="flex gap-6 h-full pb-4 items-start items-stretch">
            {orders.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-4">
                    <Utensils size={64} />
                    <p className="text-xl font-bold italic tracking-wide lowercase">Kitchen is currently clear</p>
                </div>
            ) : (
                orders.map((order) => {
                    const status = order.preparation_status || 'PENDING';
                    const isReady = status === 'READY';
                    const isPreparing = status === 'PREPARING';

                    return (
                    <div 
                        key={order.id}
                        className={cn(
                        "w-80 flex-shrink-0 bg-[#1e293b] rounded-2xl border flex flex-col shadow-2xl transition-all duration-300",
                        isReady ? "border-emerald-500 shadow-emerald-500/10" : "border-slate-700/50",
                        isPreparing && "border-amber-500/50 scale-[1.02]"
                        )}
                    >
                        {/* Order Card Header */}
                        <div className={cn(
                        "p-4 rounded-t-2xl flex items-center justify-between",
                        isReady ? "bg-emerald-500/10" : "bg-slate-800/50"
                        )}>
                        <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Order</span>
                            <h2 className="text-xl font-black text-white -mt-1">#{order.id}</h2>
                        </div>
                        <div className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                            status === 'PENDING' ? "bg-slate-700 text-slate-400" :
                            status === 'PREPARING' ? "bg-amber-500 text-[#1e293b]" :
                            status === 'READY' ? "bg-emerald-500 text-[#1e293b]" :
                            "bg-teal-500 text-[#1e293b]"
                        )}>
                            {status}
                        </div>
                        </div>

                        {/* Order Card Content */}
                        <div className="p-4 flex-1 space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 font-bold">
                            <Utensils size={14} className="text-teal-500" />
                            <span className="text-sm">{order.table_number ? `Table ${order.table_number}` : (order.customer_name || 'Walk-in Guest')}</span>
                        </div>

                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 py-2 border-b border-slate-700/30 last:border-0 group">
                                <span className="bg-teal-500/10 text-teal-400 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 border border-teal-500/10">
                                {item.quantity}x
                                </span>
                                <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-200 group-hover:text-teal-400 transition-colors leading-tight">
                                    {item.product_name || item.product?.name}
                                </p>
                                {item.note && (
                                    <p className="text-[10px] text-amber-400 font-bold italic mt-0.5 animate-pulse">
                                    * {item.note}
                                    </p>
                                )}
                                </div>
                            </div>
                            ))}
                        </div>
                        </div>

                        {/* Order Card Footer */}
                        <div className="p-4 bg-slate-800/30 rounded-b-2xl border-t border-slate-700/30 space-y-3">
                        <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold">
                            <div className="flex items-center gap-1">
                            <Clock size={10} />
                            <span>{new Date(order.created_at || order.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <span>{order.items?.length || 0} items</span>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => handlePrint(order)}
                                className="w-12 h-12 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-xl transition-all active:scale-95 text-slate-300"
                            >
                            <Printer size={20} />
                            </button>
                            <button 
                            onClick={() => handleUpdateStatus(order.id, status)}
                            className={cn(
                                "flex-1 h-12 flex items-center justify-center gap-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg",
                                status === 'PENDING' ? "bg-teal-600 hover:bg-teal-50 hover:shadow-teal-500/20" :
                                status === 'PREPARING' ? "bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-amber-500/20" :
                                isReady ? "bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-emerald-500/20" :
                                "bg-slate-700 text-slate-400"
                            )}
                            >
                            {status === 'PENDING' && (
                                <>
                                <span>Start Prep</span>
                                <ChefHat size={16} />
                                </>
                            )}
                            {status === 'PREPARING' && (
                                <>
                                <span>Mark Ready</span>
                                <CheckCircle2 size={16} />
                                </>
                            )}
                            {status === 'READY' && (
                                <>
                                <span>Delivered</span>
                                <ArrowRight size={16} />
                                </>
                            )}
                            </button>
                        </div>
                        </div>
                    </div>
                    );
                })
            )}
            </div>
        )}
      </main>

      {/* Printable Receipt */}
      <div id="printable-receipt" className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black">
        {activePrintOrder && (
            <div className="max-w-[300px] mx-auto font-mono text-sm">
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold uppercase">{business?.name}</h1>
                    <p className="text-xs mt-1">Kitchen Order Ticket</p>
                    <p className="text-xs mt-1">{new Date().toLocaleString()}</p>
                </div>
                
                <div className="border-b-2 border-dashed border-black pb-4 mb-4">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Order #{activePrintOrder.id}</span>
                        <span>{activePrintOrder.table_number ? `T${activePrintOrder.table_number}` : 'Walk-in'}</span>
                    </div>
                    {activePrintOrder.customer_name && (
                        <p className="text-xs uppercase mt-1">Cust: {activePrintOrder.customer_name}</p>
                    )}
                </div>

                <div className="space-y-3 mb-6">
                    {activePrintOrder.items?.map((item: any, i: number) => (
                        <div key={i}>
                            <div className="flex justify-between font-bold">
                                <span>{item.quantity} x {item.product_name || item.product?.name}</span>
                            </div>
                            {item.note && (
                                <p className="text-xs italic mt-0.5 pl-4">** {item.note}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t-2 border-dashed border-black pt-4 text-center text-xs">
                    <p>*** END OF ORDER ***</p>
                </div>
            </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: block !important;
            background: white;
          }
          @page {
            size: auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
