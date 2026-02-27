'use client';

import React, { useEffect, useState, use } from 'react';
import { ProductService } from '@/services/product.service';
import { Product, Category } from '@/types/pos';
import { Search, Loader2, Info, Utensils } from 'lucide-react';

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency || 'NGN',
  }).format(price);
};

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

  // Group products by category for the classic menu look
  const productsByCategory = data?.categories
    .filter(cat => !selectedCategory || cat.id === selectedCategory)
    .map(cat => ({
      category: cat,
      items: filteredProducts.filter(p => p.category_id === cat.id),
    }))
    .filter(group => group.items.length > 0) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <Utensils className="w-6 h-6 text-teal-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-6 text-teal-800 font-serif text-lg italic">Preparing your menu...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-stone-50">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2 font-serif">Menu Unavailable</h1>
        <p className="text-gray-600 mb-6">{error || "We couldn't find the menu you're looking for."}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-teal-600 text-white rounded-full font-semibold shadow-lg hover:bg-teal-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ─── Elegant Paper Header ─── */}
      <div className="relative bg-teal-800 overflow-hidden">
        {/* Decorative corner ornaments */}
        <div className="absolute top-0 left-0 w-24 h-24 opacity-10">
          <svg viewBox="0 0 100 100" fill="currentColor" className="text-white w-full h-full">
            <path d="M0,0 Q50,0 50,50 Q0,50 0,0 Z M10,10 Q40,10 40,40 Q10,40 10,10 Z" fillRule="evenodd"/>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 transform scale-x-[-1]">
          <svg viewBox="0 0 100 100" fill="currentColor" className="text-white w-full h-full">
            <path d="M0,0 Q50,0 50,50 Q0,50 0,0 Z M10,10 Q40,10 40,40 Q10,40 10,10 Z" fillRule="evenodd"/>
          </svg>
        </div>

        <div className="relative z-10 px-6 pt-10 pb-8 text-center">
          {/* Ornamental top line */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-px bg-teal-400/50"></div>
            <Utensils className="w-5 h-5 text-teal-300" />
            <div className="w-12 h-px bg-teal-400/50"></div>
          </div>

          <p className="text-teal-300 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Welcome to</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
            {data.business.name}
          </h1>

          {/* Ornamental divider */}
          <div className="flex items-center justify-center gap-3 mt-4 mb-2">
            <div className="w-8 h-px bg-teal-400/40"></div>
            <div className="w-2 h-2 border border-teal-400/60 rotate-45"></div>
            <div className="text-teal-300 text-[10px] font-bold uppercase tracking-[0.25em]">Menu</div>
            <div className="w-2 h-2 border border-teal-400/60 rotate-45"></div>
            <div className="w-8 h-px bg-teal-400/40"></div>
          </div>
        </div>
      </div>

      {/* ─── Sticky Search & Filter Bar ─── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-200/60 shadow-sm">
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search the menu..."
              className="w-full pl-9 pr-4 py-2.5 bg-amber-50/80 border border-amber-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all font-medium text-gray-700 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === null
                  ? 'bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/20'
                  : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'
              }`}
            >
              All Items
            </button>
            {data.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/20'
                    : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Classic Paper Menu Body ─── */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-8">
        {productsByCategory.length > 0 ? (
          productsByCategory.map(({ category, items }) => (
            <section key={category.id} className="relative">
              {/* Category Header — classic style */}
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 h-px bg-teal-300/40"></div>
                <h2 className="text-center font-serif text-xl font-bold text-teal-800 tracking-wide whitespace-nowrap">
                  {category.name}
                </h2>
                <div className="flex-1 h-px bg-teal-300/40"></div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                {items.map((product, idx) => (
                  <div
                    key={product.id}
                    className="group py-3 px-1 transition-all hover:bg-teal-50/50 rounded-lg"
                  >
                    <div className="flex items-baseline gap-2">
                      {/* Item name */}
                      <h3 className="font-semibold text-gray-900 text-[15px] group-hover:text-teal-700 transition-colors">
                        {product.name}
                      </h3>
                      {/* Dotted line filler — classic paper menu style */}
                      <div className="flex-1 border-b border-dotted border-gray-300 translate-y-[-3px] min-w-[20px]"></div>
                      {/* Price */}
                      <span className="font-bold text-teal-700 text-[15px] whitespace-nowrap tabular-nums">
                        {formatPrice(product.price, data.business.currency)}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-gray-500 mt-1 pl-0.5 italic leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="py-20 text-center text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium font-serif italic">No items found matching your search</p>
          </div>
        )}

        {/* ─── Ornamental Footer ─── */}
        {productsByCategory.length > 0 && (
          <div className="pt-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-16 h-px bg-teal-300/40"></div>
              <div className="w-2 h-2 border border-teal-300/60 rotate-45"></div>
              <div className="w-16 h-px bg-teal-300/40"></div>
            </div>
            <p className="text-xs text-gray-400 italic font-serif">
              Prices are inclusive of all applicable taxes.
            </p>
          </div>
        )}
      </div>

      {/* ─── Fixed Bottom Branding Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent pointer-events-none">
        <div className="bg-teal-800 text-white px-5 py-3 rounded-2xl flex items-center justify-between shadow-2xl shadow-teal-900/30 pointer-events-auto max-w-md mx-auto border border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-teal-100" />
            </div>
            <div>
              <p className="text-[9px] text-teal-300 font-bold uppercase tracking-[0.2em]">Powered By</p>
              <p className="font-bold text-xs tracking-tight text-white">BetadayPOS Digital Menu</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-teal-300 tracking-widest bg-teal-700/50 px-3 py-1.5 rounded-full border border-teal-600/30">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            Live
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
        }
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
