import axios from 'axios';
import type { 
  ScanResult, 
  UserProfile, 
  BasketAnalysis, 
  DashboardData, 
  Product,
  SmartBasketPlanRequest,
  SmartBasketRecommendationResponse,
  IndianFoodItem,
  ShoppingList,
  ShoppingListItem
} from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Auth Bearer token into all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('foodlens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async register(name: string, email: string, password: string) {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data.access_token) {
      localStorage.setItem('foodlens_token', res.data.access_token);
    }
    return res.data;
  },

  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('foodlens_token', res.data.access_token);
    }
    return res.data;
  },

  async getMe(): Promise<UserProfile> {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('foodlens_token');
  }
};

export const profileService = {
  async updateProfile(data: { age_range?: string; dietary_goal?: string; preferences?: string[]; allergies?: string[] }): Promise<UserProfile> {
    const res = await api.put('/profile', data);
    return res.data;
  }
};

export const scanService = {
  async scanBarcode(barcode: string): Promise<ScanResult> {
    const res = await api.post('/scan/barcode', { barcode });
    return res.data;
  },

  async scanLabelImage(file: File): Promise<ScanResult> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/scan/label', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export const productService = {
  async getProduct(productId: number): Promise<Product> {
    const res = await api.get(`/products/${productId}`);
    return res.data;
  },

  async getAlternatives(productId: number): Promise<Product[]> {
    const res = await api.get(`/products/${productId}/alternatives`);
    return res.data;
  },

  async compareProducts(productIds: number[]) {
    const res = await api.post('/products/compare', { product_ids: productIds });
    return res.data;
  }
};

export const basketService = {
  async getBasket(): Promise<BasketAnalysis> {
    const res = await api.get('/baskets');
    return res.data;
  },

  async addItem(productId: number, quantity: number = 1) {
    const res = await api.post('/baskets/items', { product_id: productId, quantity });
    return res.data;
  },

  async removeItem(itemId: number) {
    const res = await api.delete(`/baskets/items/${itemId}`);
    return res.data;
  }
};

export const historyService = {
  async getHistory(): Promise<ScanResult[]> {
    const res = await api.get('/history');
    return res.data;
  }
};

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const res = await api.get('/dashboard');
    return res.data;
  }
};

export const smartBasketService = {
  async getRecommendations(plan: SmartBasketPlanRequest): Promise<SmartBasketRecommendationResponse> {
    const res = await api.post('/smart-basket/recommend', plan);
    return res.data;
  },

  async getCatalogue(category?: string, search?: string): Promise<IndianFoodItem[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    const res = await api.get(`/smart-basket/catalogue?${params.toString()}`);
    return res.data;
  },

  async createShoppingList(data: any): Promise<ShoppingList> {
    const res = await api.post('/smart-basket/lists', data);
    return res.data;
  },

  async getShoppingLists(): Promise<ShoppingList[]> {
    const res = await api.get('/smart-basket/lists');
    return res.data;
  },

  async getShoppingList(id: number): Promise<ShoppingList> {
    const res = await api.get(`/smart-basket/lists/${id}`);
    return res.data;
  },

  async updateShoppingList(id: number, data: any): Promise<ShoppingList> {
    const res = await api.put(`/smart-basket/lists/${id}`, data);
    return res.data;
  },

  async addItemToList(listId: number, item: any): Promise<ShoppingListItem> {
    const res = await api.post(`/smart-basket/lists/${listId}/items`, item);
    return res.data;
  },

  async updateListItem(listId: number, itemId: number, data: any): Promise<ShoppingListItem> {
    const res = await api.patch(`/smart-basket/lists/${listId}/items/${itemId}`, data);
    return res.data;
  },

  async removeItemFromList(listId: number, itemId: number): Promise<void> {
    await api.delete(`/smart-basket/lists/${listId}/items/${itemId}`);
  },

  async deleteShoppingList(listId: number): Promise<void> {
    await api.delete(`/smart-basket/lists/${listId}`);
  }
};

