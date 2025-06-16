import { create } from 'zustand';
import { ItemModel, ItemStatus, IssuedItemModel } from '../models/item.model';
import { api } from '../api';
import { useAuthStore } from './authStore'; // Import useAuthStore

interface ItemsState {
  items: ItemModel[];
  issuedItems?: IssuedItemModel[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<ItemModel, 'id' | 'created_at' | 'updated_at'>) => Promise<ItemModel>;
  updateItem: (id: string, updates: Partial<ItemModel>) => Promise<ItemModel>;
  deleteItem: (id: string, reason?: string) => Promise<void>;
  
  // Additional operations
  updateItemStatus: (id: string, status: ItemStatus, assignedTo?: string) => Promise<ItemModel>;
  getItemsByStatus: (status: ItemStatus) => ItemModel[];
  getItemById: (id: string) => ItemModel | undefined;
  fetchIssuedItems: () => Promise<void>;
}

export const useItemsStore = create<ItemsState>()((set, get) => ({
  items: [] as ItemModel[],
  issuedItems: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('items/');
      console.log('API response for items:', response.data); // Debugging log
      set({ items: response.data, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching items:', error); // Debugging log
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

  deleteItem: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      // Soft delete: PATCH status to 'deleted' and send reason
      await api.patch(`items/${id}/`, { status: 'deleted', deletion_reason: reason });
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
    return get().updateItem(id, { status: status as ItemStatus, assignedTo });
  },

  getItemsByStatus: (status) => {
    return get().items.filter(item => item.status === status);
  },

  getItemById: (id) => {
    return get().items.find(item => item.id === id);
  },

  fetchIssuedItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('issued-items/'); // Use the new endpoint
      set({ issuedItems: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  }
}));