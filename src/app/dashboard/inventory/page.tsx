
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ProductService } from '@/services/product.service';
import { Product, Category } from '@/types/pos';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { RetailInventory } from '@/components/dashboard/inventory/RetailInventory';
import { BulkInventory } from '@/components/dashboard/inventory/BulkInventory';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const { business } = useAuth();
  const { hasModule } = useSubscription();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isLPG = business?.type?.includes('LPG_STATION');
  const hasBulkModule = hasModule('BULK_STOCK_MANAGEMENT');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData, summaryData] = await Promise.all([
        ProductService.getProducts(),
        ProductService.getCategories(),
        ProductService.getInventorySummary()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setSummary(summaryData);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'bulk' | 'retail'>('bulk');

  if (loading && products.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  // Determine which UI to show
  if (isLPG) {
    if (!hasBulkModule) {
      return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] gap-4 bg-white rounded-3xl border-2 border-dashed border-slate-200">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
             <Loader2 size={32} className="text-slate-300" />
           </div>
           <h2 className="text-xl font-bold text-slate-800">Bulk Inventory Required</h2>
           <p className="text-slate-500 text-center max-w-md">
             LPG stations require the Bulk Inventory module to manage stock efficiently. Please upgrade your subscription to access this feature.
           </p>
           <button 
             onClick={() => window.location.href = '/dashboard/subscription'}
             className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-teal-600/20 transition-all"
           >
             Add Bulk Inventory Add-on
           </button>
        </div>
      );
    }
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Tab Switcher */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('bulk')}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
              activeTab === 'bulk' ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Bulk Rounds
          </button>
          <button 
            onClick={() => setActiveTab('retail')}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
              activeTab === 'retail' ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            All Products
          </button>
        </div>

        {activeTab === 'bulk' ? (
          <BulkInventory 
            products={products}
            loading={loading}
            onRefresh={fetchData}
          />
        ) : (
          <RetailInventory 
            products={products}
            categories={categories}
            summary={summary}
            loading={loading}
            onRefresh={fetchData}
          />
        )}
      </div>
    );
  }

  // Otherwise show the standard retail UI
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <RetailInventory 
        products={products}
        categories={categories}
        summary={summary}
        loading={loading}
        onRefresh={fetchData}
      />
    </div>
  );
}
