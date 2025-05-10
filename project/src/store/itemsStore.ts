import { create } from 'zustand';
import { Item, ItemStatus } from '../types';
import { api } from '../api';

interface ItemsState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
  
  // Additional operations
  updateItemStatus: (id: string, status: ItemStatus, assignedTo?: string) => Promise<Item>;
  getItemsByStatus: (status: ItemStatus) => Item[];
  getItemById: (id: string) => Item | undefined;
}

export const useItemsStore = create<ItemsState>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('items/');
      set({ items: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addItem: async (itemData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('items/', itemData);
      set(state => ({ items: [...state.items, response.data], isLoading: false }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateItem: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`items/${id}/`, updates);
      set(state => ({
        items: state.items.map(item => item.id === id ? response.data : item),
        isLoading: false
      }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteItem: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`items/${id}/`);
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateItemStatus: async (id, status, assignedTo) => {
    return get().updateItem(id, { status, assigned_to: assignedTo });
  },

  getItemsByStatus: (status) => {
    return get().items.filter(item => item.status === status);
  },

  getItemById: (id) => {
    return get().items.find(item => item.id === id);
  }
}));