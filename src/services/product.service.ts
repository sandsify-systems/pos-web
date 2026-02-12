
import apiClient from '../lib/api';
import { Product, Category } from '../types/pos';

export const ProductService = {
  getProducts: async (categoryId?: string): Promise<Product[]> => {
    const url = categoryId ? `/products?category_id=${categoryId}` : '/products';
    const res = await apiClient.get(url);
    return res.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories');
    return res.data;
  },

  searchProducts: async (query: string): Promise<Product[]> => {
    const res = await apiClient.get(`/products?search=${encodeURIComponent(query)}`);
    return res.data;
  },

  createProduct: async (data: FormData): Promise<Product> => {
    const res = await apiClient.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updateProduct: async (id: number, data: FormData): Promise<Product> => {
    const res = await apiClient.put(`/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  createCategory: async (name: string): Promise<Category> => {
    const res = await apiClient.post('/categories', { name });
    return res.data;
  },

  updateCategory: async (id: number, name: string): Promise<Category> => {
    const res = await apiClient.put(`/categories/${id}`, { name });
    return res.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  }
};
