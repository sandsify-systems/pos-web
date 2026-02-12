import apiClient from './api.service';

export const RecipeService = {
  getRecipe: async (productId: number) => {
    const response = await apiClient.get(`/recipes/${productId}`);
    return response.data;
  },

  addIngredient: async (data: { product_id: number; ingredient_id: number; quantity: number }) => {
    const response = await apiClient.post('/recipes', data);
    return response.data;
  },

  removeIngredient: async (id: number) => {
    const response = await apiClient.delete(`/recipes/${id}`);
    return response.data;
  }
};
