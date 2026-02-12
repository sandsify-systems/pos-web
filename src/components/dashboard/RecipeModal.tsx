'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Search,
  BookOpen,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { RecipeService } from '@/services/recipe.service';
import { Product } from '@/types/pos';
import { formatCurrency, cn } from '@/lib/utils';

interface RecipeIngredient {
  id: number;
  product_id: number;
  ingredient_id: number;
  quantity: number;
}

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  allProducts: Product[];
  businessCurrency?: string;
}

export function RecipeModal({ isOpen, onClose, product, allProducts, businessCurrency }: RecipeModalProps) {
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingIngredient, setAddingIngredient] = useState(false);
  
  // Form state for new ingredient
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');

  useEffect(() => {
    if (isOpen && product) {
      fetchRecipe();
    }
  }, [isOpen, product]);

  const fetchRecipe = async () => {
    if (!product) return;
    try {
      setLoading(true);
      const data = await RecipeService.getRecipe(product.id);
      setIngredients(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !selectedIngredientId || !quantity) return;

    try {
      setAddingIngredient(true);
      await RecipeService.addIngredient({
        product_id: product.id,
        ingredient_id: parseInt(selectedIngredientId),
        quantity: parseFloat(quantity)
      });
      toast.success('Ingredient added');
      setSelectedIngredientId('');
      setQuantity('1');
      fetchRecipe();
    } catch (error) {
      toast.error('Failed to add ingredient');
    } finally {
      setAddingIngredient(false);
    }
  };

  const handleRemoveIngredient = async (id: number) => {
    try {
      await RecipeService.removeIngredient(id);
      toast.success('Ingredient removed');
      fetchRecipe();
    } catch (error) {
      toast.error('Failed to remove ingredient');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recipe Management</h2>
              <p className="text-sm text-slate-500">Define Bill of Materials for <span className="text-teal-600 font-semibold">{product?.name}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
          {/* Add Ingredient Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Plus size={16} />
              Add Component Ingredient
            </h3>
            <form onSubmit={handleAddIngredient} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Select Ingredient</label>
                <select 
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
                  required
                >
                  <option value="">Select a product...</option>
                  {allProducts
                    .filter(p => p.id !== product?.id)
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</option>
                    ))
                  }
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Quantity</label>
                <input 
                  type="number"
                  step="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <button 
                  type="submit"
                  disabled={addingIngredient}
                  className="w-full py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center transition-all shadow-md shadow-teal-500/10"
                >
                  {addingIngredient ? <Loader2 size={16} className="animate-spin" /> : <Plus size={20} />}
                </button>
              </div>
            </form>
          </div>

          {/* Ingredients List */}
          <div className="flex-1 overflow-hidden flex flex-col bg-white border border-slate-200 rounded-xl overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-600 text-[10px] uppercase tracking-wider">Ingredient Item</th>
                  <th className="px-4 py-3 font-bold text-slate-600 text-[10px] uppercase tracking-wider text-center">Unit Qty</th>
                  <th className="px-4 py-3 font-bold text-slate-600 text-[10px] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
                    </td>
                  </tr>
                ) : ingredients.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} strokeWidth={1} />
                        <p>No ingredients defined for this recipe</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ingredients.map((ing) => {
                    const ingProduct = allProducts.find(p => p.id === ing.ingredient_id);
                    return (
                      <tr key={ing.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{ingProduct?.name || 'Unknown Item'}</div>
                          <div className="text-[10px] text-slate-500 italic">Deducted on each sale</div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-teal-600 bg-teal-50/30">
                          {ing.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleRemoveIngredient(ing.id)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info skip for now or add small note */}
        <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Note: When this finished product is sold, the system will automatically deduct the specified unit quantity from each ingredient's stock instead of the main product's stock.
          </p>
        </div>
      </div>
    </div>
  );
}
