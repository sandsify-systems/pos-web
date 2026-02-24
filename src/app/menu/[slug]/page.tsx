'use client';

import React, { useEffect, useState, use } from 'react';
import { ProductService } from '@/services/product.service';
import { Product, Category } from '@/types/pos';
import { Search, ShoppingBag, ChevronRight, Loader2, Info } from 'lucide-react';

export default function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ business: any, categories: Category[], products: Product[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await ProductService.getPublicMenu(slug);
        setData(response);
      } catch (err: any) {
        console.error('Failed to fetch menu:', err);
        setError(err.response?.data?.error || 'Business not found');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [slug]);

  const filteredProducts = data?.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading Menu...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Oops! Menu Unavailable</h1>
        <p className="text-gray-600 mb-6">{error || "We couldn't find the menu you're looking for."}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner">
              {data.business.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{data.business.name}</h1>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Open for orders
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search dishes, drinks..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === null 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {data.categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="p-4 flex flex-col gap-4 pb-20">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <div 
              key={product.id}
              className="bg-white p-3 rounded-2xl shadow-sm flex gap-4 items-center active:scale-[0.98] transition-all border border-gray-100"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 truncate pr-2">{product.name}</h3>
                  <span className="text-blue-600 font-black text-sm whitespace-nowrap">
                    {data.business.currency || '₦'}{product.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {product.description || 'No description available for this item.'}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No items found matching your filter</p>
          </div>
        )}
      </div>

      {/* Bottom Floating Info */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-2xl pointer-events-auto max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">QR</div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Powered By</p>
              <p className="font-bold text-xs tracking-tight">BetadayPOS Digital Menu</p>
            </div>
          </div>
          <button className="text-[10px] font-black uppercase text-blue-400 tracking-widest bg-blue-400/10 px-3 py-1.5 rounded-full">
            Dine In
          </button>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
