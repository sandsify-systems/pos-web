import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, Check, Loader2 } from 'lucide-react';
import { Category } from '@/types/pos';
import { ProductService } from '@/services/product.service';
import { toast } from 'react-hot-toast';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onRefresh: () => void;
}

export function CategoriesModal({ isOpen, onClose, categories, onRefresh }: CategoriesModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    try {
      await ProductService.createCategory(newCategoryName);
      toast.success('Category created');
      setNewCategoryName('');
      onRefresh();
    } catch (error) {
      toast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;

    setLoading(true);
    try {
      await ProductService.updateCategory(id, editName);
      toast.success('Category updated');
      setEditingId(null);
      onRefresh();
    } catch (error) {
      toast.error('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure? This might affect products in this category.')) return;

    setLoading(true);
    try {
      await ProductService.deleteCategory(id);
      toast.success('Category deleted');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Manage Categories</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !newCategoryName.trim()}
              className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No categories found. Add one above.
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors">
                  {editingId === category.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-teal-500 rounded text-sm text-slate-900"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdate(category.id)}
                        disabled={loading}
                        className="p-1.5 text-teal-600 hover:bg-teal-50 rounded"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={loading}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-slate-700">{category.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(category)}
                          className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
