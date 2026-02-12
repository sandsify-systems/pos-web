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
  LogOut
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { ProductService } from '@/services/product.service';
import { DraftService } from '@/services/draft.service';
import { ShiftService } from '@/services/shift.service'; 
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
        addItem({
            id: item.product.id,
            name: item.product_name || item.product.name,
            price: item.unit_price || item.product.price, 
            stock: 9999, // Assumption or fetch real stock
            category_id: 0, 
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
    router.push('/dashboard/pos/checkout');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.4))] md:flex-row gap-4 p-4 overflow-hidden text-sm self-start">
      
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

      {/* LEFT SECTION: Products */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full md:h-auto">
        {/* Header: Search & Categories */}
        <div className="p-3 border-b border-slate-100 space-y-3 bg-white z-10 text-sm">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
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
                    
                    {/* Hover Overlay for Stock */}
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
                  
                  <div className="p-2 flex flex-col flex-1">
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

      {/* RIGHT SECTION: Cart */}
      <div className="w-full md:w-[320px] flex flex-col bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden shrink-0 h-[calc(100vh-theme(spacing.24))] md:h-auto">
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm">Current Order</h2>
            <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <button 
            onClick={clearCart} 
            disabled={items.length === 0}
            className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Clear Cart"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
               <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                 <Grid size={20} className="opacity-20" />
               </div>
               <p className="text-xs font-medium">Cart is empty</p>
               <p className="text-[10px] text-center max-w-[150px]">Select products from the grid to add them.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-2 p-2 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-teal-100 transition-colors group">
                 <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-400">
                    {item.product.quantity}x
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                       <h4 className="font-semibold text-slate-900 text-xs truncate pr-1">{item.product.name}</h4>
                       <span className="text-xs font-bold text-slate-700 shrink-0">
                         {formatCurrency(item.product.price * item.quantity, business?.currency)}
                       </span>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1 bg-slate-100 rounded p-0.5">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-teal-600 disabled:opacity-50"
                          >
                            <Minus size={10} strokeWidth={3} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-700">{item.quantity}</span>
                          <button 
                             onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                             className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-teal-600"
                          >
                             <Plus size={10} strokeWidth={3} />
                          </button>
                       </div>
                       
                       {/* Remove Item Button */}
                       <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors invisible group-hover:visible"
                          title="Remove item"
                        >
                          <X size={14} />
                        </button>

                    </div>
                 </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-3">
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(getTotal(), business?.currency)}</span>
            </div>
            {/* Total */}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-teal-700">{formatCurrency(getTotal(), business?.currency)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             {enableDrafts && (
               <button 
                  onClick={handleSaveDraft}
                  disabled={items.length === 0}
                  className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                 <Save size={16} />
                 <span className="text-[10px]">Save Draft</span>
               </button>
             )}
             <button 
                onClick={handleCheckout}
                disabled={items.length === 0}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
                  !enableDrafts && "col-span-2 flex-row py-3"
                )}
             >
                <div className="flex items-center gap-2">
                   <CreditCard size={enableDrafts ? 16 : 18} />
                   <span className={enableDrafts ? "text-[10px]" : "text-sm"}>Checkout</span>
                </div>
             </button>
          </div>

          {/* End Shift Button */}
          {activeShift && (
             <button 
                onClick={() => setShowEndShiftModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-transparent transition-all"
             >
                <LogOut size={16} />
                <span className="text-xs">End Shift</span>
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
