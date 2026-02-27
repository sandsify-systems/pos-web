'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Loader2, 
  Package,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProductService } from '@/services/product.service';
import { Product } from '@/types/pos';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface BulkInventoryProps {
  products: Product[];
  loading: boolean;
  onRefresh: () => void;
}

export function BulkInventory({ products, loading, onRefresh }: BulkInventoryProps) {
  const { business } = useAuth();
  const [activeRounds, setActiveRounds] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Simplified Form State for Bulk Restock
  const [formData, setFormData] = useState({
    productId: '',
    totalVolume: '',
    purchasePrice: '',
    unit: 'KG' as 'KG' | 'Tons' | 'Grams'
  });

  useEffect(() => {
    fetchActiveRounds();
  }, []);

  const fetchActiveRounds = async () => {
    try {
        const rounds = await ProductService.getActiveRounds();
        setActiveRounds(rounds);
    } catch (error) {
        console.error("Failed to fetch rounds", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      let targetProductId = formData.productId;
      
      if (!targetProductId) {
          toast.error("Please select a product");
          return;
      }

      // Conversion to base unit (10g)
      // 1 KG = 100 units
      // 1 Ton = 1000 KG = 100,000 units
      // 1 Gram = 0.1 units
      const vol = parseFloat(formData.totalVolume);
      let units = 0;
      if (formData.unit === 'Tons') units = vol * 1000 * 100;
      else if (formData.unit === 'KG') units = vol * 100;
      else if (formData.unit === 'Grams') units = vol * 0.1;

      // 2. Start a new round
      await ProductService.startNewRound({
          product_id: parseInt(targetProductId),
          total_volume: units,
          cost: parseFloat(formData.purchasePrice)
      });

      toast.success('Bulk stock updated successfully');
      setIsModalOpen(false);
      onRefresh();
      fetchActiveRounds();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update stock');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseRound = async (roundId: number) => {
      if (!window.confirm("Are you sure you want to close this stock round? This will prevent further deductions from this batch.")) return;
      try {
          await ProductService.closeRound(roundId);
          toast.success("Round closed");
          fetchActiveRounds();
      } catch (error) {
          toast.error("Failed to close round");
      }
  };

  const bulkProducts = products.filter(p => p.track_by_round);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Inventory Management</h1>
          <p className="text-slate-500">Monitor and manage your LPG stock rounds and bulk measurements</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 shadow-xl shadow-teal-500/20 transition-all active:scale-95"
        >
          <Plus size={20} />
          New Stock Intake
        </button>
      </div>

      {/* Active Rounds Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock size={20} className="text-teal-600" />
                  Active Stock Rounds
              </h2>
              
              {loading ? (
                  <div className="bg-white p-12 rounded-3xl border border-slate-200 flex flex-col items-center justify-center">
                      <Loader2 size={40} className="animate-spin text-teal-600 mb-4" />
                      <p className="text-slate-500 font-medium tracking-wide">Synchronizing Inventory...</p>
                  </div>
              ) : activeRounds.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                          <Package size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">No active rounds</h3>
                      <p className="text-slate-500 max-w-xs mt-1">Start a new stock round to begin tracking your LPG supply.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-4">
                      {activeRounds.map((round) => {
                          const product = products.find(p => p.id === round.product_id);
                          const percentage = (round.remaining_volume / round.total_volume) * 100;
                          const isLow = percentage < 15;

                          return (
                              <div key={round.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between mb-6">
                                      <div className="flex items-center gap-4">
                                          <div className={cn(
                                              "p-3 rounded-2xl",
                                              isLow ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-teal-600"
                                          )}>
                                              <Package size={24} />
                                          </div>
                                          <div>
                                              <h3 className="text-lg font-bold text-slate-900">{product?.name || 'Bulk LPG'}</h3>
                                              <p className="text-sm text-slate-500 font-medium">Batch #{round.id} • Started {new Date(round.start_date).toLocaleDateString()}</p>
                                          </div>
                                      </div>
                                      <button 
                                          onClick={() => handleCloseRound(round.id)}
                                          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-all uppercase tracking-wider"
                                      >
                                          Close Round
                                      </button>
                                  </div>

                                  <div className="space-y-2">
                                      <div className="flex justify-between items-end mb-1">
                                          <p className="text-sm font-bold text-slate-700">Remaining Volume</p>
                                          <p className="text-sm font-black text-slate-900">
                                              {(round.remaining_volume / 100).toFixed(2)} / {(round.total_volume / 100).toFixed(2)} <span className="text-xs text-slate-500 uppercase">KG</span>
                                          </p>
                                      </div>
                                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-100 p-0.5">
                                          <div 
                                              className={cn(
                                                  "h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-2",
                                                  isLow ? "bg-rose-500" : "bg-teal-500"
                                              )}
                                              style={{ width: `${percentage}%` }}
                                          >
                                              {percentage > 10 && (
                                                  <div className="h-1 w-8 bg-white/30 rounded-full animate-pulse" />
                                              )}
                                          </div>
                                      </div>
                                      <div className="flex justify-between mt-2">
                                          <p className={cn(
                                              "text-[10px] font-black uppercase tracking-widest",
                                              isLow ? "text-rose-600" : "text-teal-600"
                                          )}>
                                              {isLow ? 'Critical Low Level' : 'Healthy Supply'}
                                          </p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                              {percentage.toFixed(1)}% Available
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>

          <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl shadow-slate-900/20">
                  <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest mb-4">Inventory Overview</h3>
                  <div className="space-y-6">
                      <div>
                          <p className="text-xs text-slate-400 font-bold mb-1">Total Items trackable</p>
                          <p className="text-2xl font-black">{bulkProducts.length}</p>
                      </div>
                      <div className="h-px bg-slate-800 w-full" />
                      <div>
                          <p className="text-xs text-slate-400 font-bold mb-1">Total Stock (KG)</p>
                          <p className="text-2xl font-black">
                              {(activeRounds.reduce((acc, r) => acc + r.remaining_volume, 0) / 100).toFixed(1)} <span className="text-sm font-medium opacity-50">KG</span>
                          </p>
                      </div>
                  </div>
              </div>

              {/* Guidance Box */}
              <div className="bg-teal-50 rounded-3xl p-6 border border-teal-100">
                  <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center text-white mb-4">
                      <AlertCircle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-teal-900">How Bulk Works</h3>
                  <p className="text-sm text-teal-700/80 leading-relaxed mt-2">
                      When you receive a new supply of LPG, create a <strong>New Stock Intake</strong>. 
                      This starts a new "Round". Each sale will automatically deduct from the oldest open round.
                  </p>
              </div>
          </div>
      </div>

      {/* NEW STOCK INTAKE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Restock</h2>
                    <p className="text-sm text-slate-500 font-medium">Add new LPG supply to your inventory</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                >
                   <X size={24} />
                </button>
             </div>
             
             <div className="p-8">
                <form id="bulkRestockForm" onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Select Gas Product</label>
                        <div className="grid grid-cols-1 gap-3">
                            {bulkProducts.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setFormData({...formData, productId: p.id.toString()})}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                                        formData.productId === p.id.toString() 
                                            ? "border-teal-600 bg-teal-50/50" 
                                            : "border-slate-100 hover:border-slate-300"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            formData.productId === p.id.toString() ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
                                        )}>
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{p.name}</p>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tracked by: {p.unit_of_measure || 'KG'}</p>
                                        </div>
                                    </div>
                                    {formData.productId === p.id.toString() && (
                                        <CheckCircle2 size={20} className="text-teal-600" />
                                    )}
                                </button>
                            ))}
                            {bulkProducts.length === 0 && (
                                <div className="text-rose-600 bg-rose-50 p-6 rounded-2xl border border-rose-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={20} />
                                        <h4 className="font-bold uppercase text-[10px] tracking-widest">No Gas Products Found</h4>
                                    </div>
                                    <p className="text-xs font-medium leading-relaxed">
                                        To enable bulk tracking, go to <strong>Inventory &gt; Products</strong>, edit your LPG product, and toggle <strong>"Track by Round (Bulk)"</strong> on.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                             <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Intake Quantity</label>
                             <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="number"
                                        value={formData.totalVolume}
                                        onChange={(e) => setFormData({...formData, totalVolume: e.target.value})}
                                        className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-teal-600 text-slate-900 font-bold transition-all"
                                        placeholder="0.00"
                                        step="0.001"
                                        required
                                    />
                                </div>
                                <select 
                                    value={formData.unit}
                                    onChange={(e) => setFormData({...formData, unit: e.target.value as any})}
                                    className="px-4 py-4 bg-slate-100 border-2 border-transparent rounded-2xl font-black text-xs text-slate-600 uppercase outline-none focus:border-teal-600 transition-all"
                                >
                                    <option value="KG">KG</option>
                                    <option value="Tons">Tons</option>
                                    <option value="Grams">Grams</option>
                                </select>
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Total Purchase Cost (Supply)</label>
                             <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₦</span>
                                <input 
                                    type="number"
                                    value={formData.purchasePrice}
                                    onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-teal-600 text-slate-900 font-bold transition-all"
                                    placeholder="0.00"
                                    step="0.01"
                                    required
                                />
                             </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                        <AlertCircle size={20} className="text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700 font-medium leading-relaxed">
                            Creating a new intake will add this quantity to your current supply pool. 
                            The cost will be used for profit and loss calculations.
                        </p>
                    </div>
                </form>
             </div>

             <div className="p-8 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-200 rounded-2xl transition-all"
                  type="button"
                >
                   Cancel
                </button>
                <button 
                   type="submit" 
                   form="bulkRestockForm"
                   disabled={modalLoading || bulkProducts.length === 0}
                   className="flex-[2] py-4 bg-teal-600 text-white font-black rounded-2xl hover:bg-teal-700 shadow-xl shadow-teal-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                   {modalLoading && <Loader2 size={20} className="animate-spin" />}
                   Confirm Restock
                   <ArrowRight size={20} />
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

const X = ({ size, className }: any) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
);
