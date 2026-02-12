
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Loader2, 
  Package,
  Upload,
  X,
  BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProductService } from '@/services/product.service';
import { Product, Category } from '@/types/pos';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { CategoriesModal } from '@/components/dashboard/CategoriesModal';
import { RecipeModal } from '@/components/dashboard/RecipeModal';

export default function InventoryPage() {
  const { business } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    categoryId: '',
    minStockLevel: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        ProductService.getProducts(),
        ProductService.getCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        categoryId: product.category_id.toString(),
        minStockLevel: (product.min_stock_level || 0).toString()
      });
      setImagePreview(product.image_url || null);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', stock: '', categoryId: '', minStockLevel: '' });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category_id', formData.categoryId);
      if (formData.minStockLevel) data.append('min_stock_level', formData.minStockLevel);
      
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, data);
        toast.success('Product updated');
      } else {
        await ProductService.createProduct(data);
        toast.success('Product created');
      }
      
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await ProductService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleOpenRecipe = (product: Product) => {
    setRecipeProduct(product);
    setIsRecipeModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500">Manage your products, stock levels, and prices</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCategoriesModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
          >
            <Filter size={20} />
            Categories
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-all"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <div className="flex gap-2">
           {/* Placeholder for category filter if needed */}
           <button className="px-4 py-2 flex items-center gap-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
             <Filter size={18} />
             Filters
           </button>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-slate-500 font-semibold text-xs">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                               {product.image_url ? (
                                 <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                               ) : (
                                 <ImageIcon size={20} className="text-slate-400" />
                               )}
                            </div>
                            <div>
                               <p className="font-semibold text-slate-900">{product.name}</p>
                               <p className="text-xs text-slate-500">SKU: {product.sku || `PROD-${product.id}`}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                           {categories.find(c => c.id === product.category_id)?.name || 'Uncategorized'}
                         </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatCurrency(product.price, business?.currency)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold",
                          product.stock > 10 ? "bg-teal-50 text-teal-700" : 
                          product.stock > 0 ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        )}>
                           {product.stock} in stock
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {business?.active_modules?.includes('RECIPE_MANAGEMENT') && (
                              <button 
                                 onClick={() => handleOpenRecipe(product)}
                                 className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                 title="Manage Recipe (BOM)"
                              >
                                 <BookOpen size={16} />
                              </button>
                            )}
                            <button 
                               onClick={() => handleOpenModal(product)}
                               className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                               title="Edit"
                            >
                               <Edit size={16} />
                            </button>
                            <button 
                               onClick={() => handleDelete(product.id)}
                               className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                               title="Delete"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                   <X size={20} />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6">
                <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
                   {/* Image Upload */}
                   <div className="flex justify-center mb-6">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                         <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden hover:border-teal-500 transition-colors">
                            {imagePreview ? (
                              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center">
                                 <Upload size={24} className="text-slate-400 mb-1" />
                                 <span className="text-[10px] text-slate-500">Upload</span>
                              </div>
                            )}
                         </div>
                         <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit size={20} className="text-white" />
                         </div>
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            className="hidden" 
                            accept="image/*"
                         />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                         <input 
                           type="text"
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
                           placeholder="e.g. Wireless Mouse"
                           required
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                            <input 
                              type="number"
                              value={formData.price}
                              onChange={(e) => setFormData({...formData, price: e.target.value})}
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
                              placeholder="0.00"
                              step="0.01"
                              required
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                            <input 
                              type="number"
                              value={formData.stock}
                              onChange={(e) => setFormData({...formData, stock: e.target.value})}
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
                              placeholder="0"
                              required
                            />
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                         <select 
                           value={formData.categoryId}
                           onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                           className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white text-slate-900"
                           required
                         >
                            <option value="">Select Category</option>
                            {categories.map(c => (
                               <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                         </select>
                      </div>
                      
                      {/* Advanced options toggle could go here */}
                   </div>
                </form>
             </div>

             <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                  type="button"
                >
                   Cancel
                </button>
                <button 
                   type="submit" 
                   form="productForm"
                   disabled={modalLoading}
                   className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 shadow-lg shadow-teal-500/20 disabled:opacity-70 flex items-center gap-2"
                >
                   {modalLoading && <Loader2 size={16} className="animate-spin" />}
                   {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
             </div>
           </div>
        </div>
      )}

      {/* Categories Modal */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categories}
        onRefresh={fetchData}
      />

      {/* Recipe Modal */}
      <RecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        product={recipeProduct}
        allProducts={products}
        businessCurrency={business?.currency}
      />
    </div>
  );
}
