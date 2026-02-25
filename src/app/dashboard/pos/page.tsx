'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Grid, 
  List, 
  Loader2, 
  Plus, 
  Minus, 
  Trash2, 
  Save, 
  CreditCard, 
  Clock,
  ClipboardList,
  X,
  LogOut,
  ArrowLeft,
  Smartphone,
  Banknote,
  CheckCircle2,
  Printer,
  Receipt,
  ChevronRight,
  HandCoins,
  History,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { ProductService } from '@/services/product.service';
import { DraftService } from '@/services/draft.service';
import { ShiftService } from '@/services/shift.service'; 
import { SalesService } from '@/services/sales.service';
import { formatCurrency, cn } from '@/lib/utils';
import { Product, Category } from '@/types/pos';

export default function POSPage() {
  const router = useRouter();
  const { user, business, activeShift, checkActiveShift } = useAuth();
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal } = useCart();
  const { enableDrafts, enableTables } = useSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [startCash, setStartCash] = useState('');
  const [endCash, setEndCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  
  // Drafts state
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);

  // Checkout State
  const [checkoutView, setCheckoutView] = useState<'products' | 'payment' | 'receipt'>('products');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'EXTERNAL_TERMINAL' | 'CREDIT'>('CASH');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          ProductService.getProducts(),
          ProductService.getCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        toast.error('Failed to load POS data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle Shift Requirement
  useEffect(() => {
    if (!loading && !activeShift) {
      setShowShiftModal(true);
    }
  }, [loading, activeShift]);

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await ShiftService.startShift(parseFloat(startCash) || 0);
      await checkActiveShift(); // Refresh context
      setShowShiftModal(false);
      toast.success('Shift started successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start shift');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    setIsProcessing(true);
    try {
      await ShiftService.endShift(activeShift.id, parseFloat(endCash) || 0, shiftNotes);
      await checkActiveShift(); // Refresh context
      setShowEndShiftModal(false);
      toast.success('Shift closed successfully');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to close shift');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (items.length === 0) return;
    
    let tableNumber = undefined;
    if (enableTables) {
      tableNumber = window.prompt("Enter Table Number:");
      if (tableNumber === null) return; // Cancelled
    }

    setIsProcessing(true);
    try {
      await DraftService.createDraft(items, tableNumber);
      clearCart();
      toast.success('Order saved to drafts');
    } catch (error) {
      toast.error('Failed to save draft');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFetchDrafts = async () => {
    setIsProcessing(true);
    try {
      const draftsData = await DraftService.listDrafts();
      setDrafts(draftsData);
      setShowDraftsModal(true);
    } catch (error) {
      toast.error('Failed to load drafts');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeDraft = async (draft: any) => {
    if (items.length > 0) {
      if (!window.confirm('Current cart will be cleared. Continue?')) return;
    }
    
    try {
      const resumed = await DraftService.resumeDraft(draft.id);
      clearCart();
      
      resumed.items.forEach((item: any) => {
        const currentProd = products.find(p => p.id === item.product.id);
        addItem({
            ...item.product,
            stock: currentProd ? currentProd.stock : (item.product.stock || 0),
        } as Product, item.quantity);
      });

      await DraftService.deleteDraft(draft.id);
      setShowDraftsModal(false);
      toast.success('Draft resumed');
    } catch (error) {
      toast.error('Failed to resume draft');
      console.error(error);
    }
  };

  const handleDeleteDraft = async (id: number) => {
    if (!window.confirm('Delete this draft?')) return;
    try {
      await DraftService.deleteDraft(id);
      setDrafts(drafts.filter(d => d.id !== id));
      toast.success('Draft deleted');
    } catch (error) {
      toast.error('Failed to delete draft');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    setCheckoutView('payment');
  };

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
        amount_paid: getTotal(),
        tax: 0,
        discount: items.reduce((sum, item) => sum + (item.discount || 0), 0),
        shift_id: activeShift?.id,
        terminal_provider: selectedProvider
      };

      const response = await SalesService.createSale(payload);
      setCompletedSale(response);
      setCheckoutView('receipt');
      clearCart();
      toast.success('Sale completed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (!completedSale) return;
    
    // Simple window.print based receipt
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const paperWidth = '80mm';
    const fontSize = '11px';

    const saleItems = completedSale.items || [];
    const saleDate = new Date(completedSale.sale?.created_at || completedSale.created_at || new Date()).toLocaleString();
    const saleRefNo = completedSale.receipt_no || completedSale.sale?.id || completedSale.id || '';
    const total = Number(completedSale.sale?.total || completedSale.total || 0);

    let itemsHtml = '';
    saleItems.forEach((item: any) => {
      itemsHtml += `<div style="display:flex;justify-content:space-between;padding:2px 0;">
        <span>${item.quantity}x ${item.product_name || item.product?.name || 'Item'}</span>
        <span style="font-weight:600;">${formatCurrency(item.unit_price * item.quantity, business?.currency)}</span>
      </div>`;
    });

    printWindow.document.write(`
      <html>
      <head><title>Receipt</title><style>body { width: ${paperWidth}; font-family: monospace; font-size: ${fontSize}; padding: 2mm; }</style></head>
      <body>
        <div style="text-align:center;margin-bottom:8px;font-weight:bold;">${business?.name || ''}</div>
        <div style="text-align:center;font-size:0.8em;margin-bottom:8px;">${saleDate}<br/>Ref: ${saleRefNo}</div>
        <div style="border-top:1px dashed #333;border-bottom:1px dashed #333;padding:4px 0;margin:4px 0;">${itemsHtml}</div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;margin-top:4px;"><span>TOTAL</span><span>${formatCurrency(total, business?.currency)}</span></div>
        <div style="text-align:center;font-size:0.8em;margin-top:10px;">Thank you!<br/>Powered by BetadayPOS</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.4))] md:flex-row gap-4 p-4 overflow-hidden text-sm self-start relative">
      
      {/* Terminal Provider Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg">Select Provider</h3>
              <button onClick={() => setShowProviderModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { id: 'moniepoint', name: 'MoniePoint', color: 'bg-teal-50 text-teal-600' },
                { id: 'opay', name: 'OPay', color: 'bg-emerald-50 text-emerald-600' },
                { id: 'palmpay', name: 'PalmPay', color: 'bg-blue-50 text-blue-600' },
                { id: 'other', name: 'Other POS Terminal', color: 'bg-slate-50 text-slate-600' }
              ].map(provider => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setShowProviderModal(false);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-teal-500 hover:bg-teal-50/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm", provider.color)}>
                      {provider.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-700">{provider.name}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Start Shift Modal */}
      {(!activeShift && showShiftModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Start Your Shift</h2>
              <p className="text-slate-500 mt-2">You need to open a shift before processing sales.</p>
            </div>
            
            <form onSubmit={handleStartShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Opening Cash Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">{business?.currency}</span>
                  <input
                    type="number"
                    value={startCash}
                    onChange={(e) => setStartCash(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:outline-none focus:border-teal-500 font-bold text-lg text-teal-900"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-lg shadow-teal-600/20 disabled:opacity-70"
                >
                  {isProcessing ? 'Opening...' : 'Start Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Shift Modal */}
      {showEndShiftModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Close Your Shift</h2>
              <p className="text-slate-500 mt-2">Enter the final cash amount at your register.</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Expected Cash:</span>
                <span className="font-bold text-slate-900">{formatCurrency(activeShift.expected_cash || 0, business?.currency)}</span>
              </div>
              <p className="text-[10px] text-slate-400">Includes opening cash + all cash sales.</p>
            </div>

            <form onSubmit={handleEndShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Actual Cash in Drawer</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">{business?.currency}</span>
                  <input
                    type="number"
                    value={endCash}
                    onChange={(e) => setEndCash(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:outline-none focus:border-teal-500 font-bold text-lg text-teal-900"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:outline-none focus:border-teal-500 text-sm"
                  placeholder="Any discrepancies or observations?"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEndShiftModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-lg shadow-teal-600/20 disabled:opacity-70"
                >
                  {isProcessing ? 'Closing...' : 'Close Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAFTS MODAL */}
      {showDraftsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-lg flex items-center gap-2">
                   <ClipboardList className="text-teal-600" />
                   Saved Drafts
                </h3>
                <button onClick={() => setShowDraftsModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                   <X size={20} className="text-slate-500" />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {drafts.length === 0 ? (
                 <div className="text-center py-10 text-slate-500">
                    No active drafts found.
                 </div>
               ) : (
                 drafts.map((draft) => (
                    <div key={draft.id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-teal-500/50 transition-all shadow-sm">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="font-bold text-slate-900">
                                Draft #{draft.id}
                             </span>
                             {draft.table_number && (
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                                   Table {draft.table_number}
                                </span>
                             )}
                          </div>
                          <p className="text-sm text-slate-500">
                             {new Date(draft.created_at).toLocaleString()} • {draft.items?.length || 0} items
                          </p>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="font-bold text-slate-900 mr-4">
                             {formatCurrency(draft.total_amount || 0, business?.currency)}
                          </div>
                          <button 
                             onClick={() => handleDeleteDraft(draft.id)}
                             className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                             title="Delete Draft"
                          >
                             <Trash2 size={18} />
                          </button>
                          <button 
                             onClick={() => handleResumeDraft(draft)}
                             className="px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-all"
                          >
                             Resume
                          </button>
                       </div>
                    </div>
                 ))
               )}
             </div>
           </div>
        </div>
      )}

      {/* MAIN POS VIEWPORT */}
      <div className="flex-1 flex gap-4 overflow-hidden relative">
        
        {/* SECTION 1: Products Grid (Slides left out of view) */}
        <div className={cn(
          "flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-700 ease-in-out shrink-0",
          checkoutView === 'products' ? "flex-1 opacity-100" : "w-0 opacity-0 pointer-events-none border-none"
        )}>
          {/* Header: Search & Categories */}
          <div className="p-3 border-b border-slate-100 space-y-3 bg-white text-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
                />
              </div>
              {enableDrafts && (
                 <button 
                    onClick={handleFetchDrafts}
                    className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 border border-transparent transition-all"
                    title="View Drafts"
                 >
                    <ClipboardList size={18} />
                 </button>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  selectedCategory === null 
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                All Items
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    selectedCategory === cat.id 
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/20" 
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Grid size={48} className="mb-4 opacity-20" />
                <p>No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    disabled={product.stock <= 0}
                    className={cn(
                      "flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md hover:border-teal-500/50 transition-all text-left group relative",
                      product.stock <= 0 && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-slate-300 font-bold text-3xl select-none">
                          {product.name.charAt(0)}
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px]">
                          Stock: {product.stock}
                        </span>
                      </div>

                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-[1px]">
                           <span className="text-red-500 font-bold text-[10px] uppercase border border-red-200 bg-red-50 px-1.5 py-0.5 rounded">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2 flex flex-col flex-1 text-sm">
                      <h3 className="font-semibold text-slate-900 line-clamp-2 text-xs mb-auto leading-tight min-h-[2.5em]">
                        {product.name}
                      </h3>
                      <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                         <span className="font-bold text-teal-700 text-xs">
                           {formatCurrency(product.price, business?.currency)}
                         </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Cart / Items Section (Slides left when Products hide) */}
        <div className={cn(
          "flex flex-col bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden shrink-0 transition-all duration-700 ease-in-out",
          checkoutView === 'products' ? "w-full md:w-[320px]" : "w-full md:w-[320px]"
        )}>
          {/* Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {checkoutView !== 'products' && (
                <button 
                  onClick={() => setCheckoutView('products')}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <h2 className="font-bold text-slate-900 text-sm">
                {checkoutView === 'products' ? 'Current Order' : 'Items Checklist'}
              </h2>
            </div>
            {checkoutView === 'products' && (
              <button 
                onClick={clearCart} 
                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-2 p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-400">
                  {item.quantity}x
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-[11px] truncate">{item.product.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] font-bold text-slate-800">
                      {formatCurrency(item.product.price * item.quantity, business?.currency)}
                    </span>
                    {checkoutView === 'products' && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-slate-500"><Minus size={10}/></button>
                        <span className="text-[10px] w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-slate-500"><Plus size={10}/></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total Due</span>
              <span className="font-black text-teal-700 text-sm">{formatCurrency(getTotal(), business?.currency)}</span>
            </div>
            {checkoutView === 'products' ? (
              <div className="space-y-2">
                <button 
                  onClick={handleCheckout}
                  disabled={items.length === 0}
                  className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
                >
                  <CreditCard size={16} /> Checkout
                </button>
                <div className="grid grid-cols-2 gap-2">
                   {enableDrafts && (
                     <button 
                        onClick={handleSaveDraft}
                        disabled={items.length === 0}
                        className="flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all"
                     >
                       <Save size={14} /> Save Draft
                     </button>
                   )}
                   {activeShift && (
                      <button 
                         onClick={() => setShowEndShiftModal(true)}
                         className={cn(
                           "flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg text-xs hover:bg-rose-50 hover:text-rose-600 transition-all",
                           !enableDrafts && "col-span-2"
                         )}
                      >
                         <LogOut size={14} /> End Shift
                      </button>
                   )}
                </div>
              </div>
            ) : checkoutView === 'payment' ? (
              <div className="text-center py-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                Checkout in progress...
              </div>
            ) : null }
          </div>
        </div>

        {/* SECTION 3: Payment Selection (Slides in from right) */}
        <div className={cn(
          "flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-700 ease-in-out shrink-0 relative",
          checkoutView === 'payment' ? "flex-1 opacity-100" : "w-0 opacity-0 pointer-events-none border-none"
        )}>
           <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white text-sm">
             <h2 className="font-bold text-slate-900">Select Payment Method</h2>
             <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-bold">
               {formatCurrency(getTotal(), business?.currency)}
             </span>
           </div>

           <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
             <div className="max-w-2xl mx-auto space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   { id: 'CASH', name: 'Cash', icon: Banknote, desc: 'Physical currency' },
                   { id: 'CARD', name: 'Card (In-App)', icon: CreditCard, desc: 'Process via web hook' },
                   { id: 'EXTERNAL_TERMINAL', name: 'External Terminal', icon: Smartphone, desc: 'MoniePoint, Opay, etc.' },
                   { id: 'TRANSFER', name: 'Bank Transfer', icon: RefreshCw, desc: 'Manual verification' }
                 ].map(method => (
                   <button
                     key={method.id}
                     onClick={() => {
                        setPaymentMethod(method.id as any);
                        if (method.id === 'EXTERNAL_TERMINAL') setShowProviderModal(true);
                     }}
                     className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left bg-white",
                        paymentMethod === method.id ? "border-teal-600 shadow-lg shadow-teal-600/5" : "border-slate-100 hover:border-slate-300"
                     )}
                   >
                     <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", paymentMethod === method.id ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500")}>
                       <method.icon size={24} />
                     </div>
                     <div className="flex-1">
                       <h3 className="font-bold text-sm text-slate-900">{method.name}</h3>
                       <p className="text-[10px] text-slate-500 mt-1">{method.desc}</p>
                     </div>
                     {paymentMethod === method.id && <CheckCircle2 size={18} className="text-teal-600" />}
                   </button>
                 ))}
               </div>

               <button 
                 onClick={handleProcessPayment}
                 disabled={isProcessing}
                 className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-3 mt-4"
               >
                 {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} 
                 Complete Payment
               </button>
             </div>
           </div>
        </div>

        {/* SECTION 4: Receipt (Full width overlay) */}
        <div className={cn(
          "absolute inset-0 z-50 bg-white transition-all duration-500",
          checkoutView === 'receipt' ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}>
          {completedSale && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
               <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-6">
                 <CheckCircle2 size={40} />
               </div>
               <h2 className="text-3xl font-black text-slate-900">SALE COMPLETE!</h2>
               <p className="text-slate-500 mt-2">Receipt #{completedSale.receipt_no || completedSale.id} has been generated.</p>
               
               <div className="mt-10 flex gap-4 w-full max-w-sm">
                 <button onClick={handlePrint} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"><Printer size={20}/> Print</button>
                 <button onClick={() => { setCheckoutView('products'); setCompletedSale(null); }} className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"><Plus size={20}/> New Sale</button>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
