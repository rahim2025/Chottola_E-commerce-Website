import api from './api';

export const categoryService = {
  // Get all public categories
  getCategories: async (params = {}) => {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  // Get single category
  getCategory: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Get category by slug
  getCategoryBySlug: async (slug) => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response.data;
  },

  // Get featured categories
  getFeaturedCategories: async () => {
    const response = await api.get('/categories', { 
      params: { 
        isActive: true,
        isFeatured: true 
      } 
    });
    return response.data;
  },

  // Get main categories (no parent)
  getMainCategories: async () => {
    const response = await api.get('/categories', { 
      params: { 
        isActive: true,
        parent: 'null' 
      } 
    });
    return response.data;
  },

  // Get categories with product count
  getCategoriesWithCount: async () => {
    const response = await api.get('/categories', { 
      params: { 
        isActive: true,
        includeCount: true 
      } 
    });
    return response.data;
  }
};