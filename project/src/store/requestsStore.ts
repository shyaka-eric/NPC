import { create } from 'zustand';
import { Request, RequestStatus, RequestType } from '../types';
import { api } from '../api';
import { useNotificationsStore } from './notificationsStore';
import { useItemsStore } from './itemsStore';
import { fetchNewItemRequests } from '../services/api';

interface RequestsState {
  requests: Request[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  fetchRequests: () => Promise<void>;
  fetchUserRequests: (userId: string) => Promise<Request[]>;
  addRequest: (request: Omit<Request, 'id' | 'requested_at' | 'status'>) => Promise<Request>;
  updateRequest: (id: string, updates: Partial<Request>) => Promise<Request>;
  deleteRequest: (id: string) => Promise<void>;
  
  // Additional operations
  approveRequest: (id: string, approverId: string, modifiedQuantity?: number) => Promise<Request>;
  denyRequest: (id: string, denierId: string, reason: string) => Promise<Request>;
  issueRequest: (id: string, issuerId: string) => Promise<Request>;
  getRequestById: (id: string) => Request | undefined;
  getPendingRequests: () => Request[];
  getRequestsByType: (type: RequestType) => Request[];
  getRequestsByStatus: (status: RequestStatus) => Request[];
}

export const useRequestsStore = create<RequestsState>()((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,

  fetchRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const newItemRequests = await fetchNewItemRequests();
      const repairRequestsResponse = await api.get('repair-requests/');
      const repairRequests = repairRequestsResponse.data;

      console.log('Fetched new item requests:', newItemRequests);
      console.log('Fetched repair requests:', repairRequests);

      const combinedRequests = [
        ...newItemRequests.map((req: any) => ({ ...req, type: 'new' })),
        ...repairRequests.map((req: any) => ({ ...req, type: 'repair' })),
      ];
      
      console.log('Combined requests:', combinedRequests);

      const mappedRequests = combinedRequests.map((req: any) => ({
        ...req,
        requestedAt: req.requested_at,
        requestedBy: req.requested_by, // camelCase for frontend
        requested_by: req.requested_by, // keep original for compatibility
        requestedByName: req.requested_by_name || '-',
      }));

      console.log('Mapped requests:', mappedRequests);

      set({ requests: mappedRequests, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchUserRequests: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('requests/', { params: { requested_by: userId } });
      set({ requests: response.data, isLoading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  addRequest: async (requestData) => {
    console.log('addRequest called with:', requestData);
    set({ isLoading: true, error: null });
    try {
      let response;
      // Support FormData for repair requests with images
      if (typeof FormData !== 'undefined' && requestData instanceof FormData) {
        response = await api.post('repair-requests/', requestData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (requestData.type === 'repair') {
        response = await api.post('repair-requests/', requestData);
      } else {
        response = await api.post('requests/', requestData);
      }
      set(state => ({ requests: [...state.requests, response.data], isLoading: false }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateRequest: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`requests/${id}/`, updates);
      set(state => ({
        requests: state.requests.map(request => request.id === id ? response.data : request),
        isLoading: false
      }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteRequest: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`requests/${id}/`);
      set(state => ({
        requests: state.requests.filter(request => request.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  approveRequest: async (id, approverId, modifiedQuantity) => {
    // Custom logic for approval, update status and optionally quantity
    return get().updateRequest(id, { status: 'approved', quantity: modifiedQuantity });
  },

  denyRequest: async (id, denierId, reason) => {
    // Custom logic for denial, update status and add reason
    return get().updateRequest(id, { status: 'denied', reason: reason });
  },

  issueRequest: async (id, issuerId) => {
    // Custom logic for issuing, update status
    return get().updateRequest(id, { status: 'issued' });
  },

  getRequestById: (id) => {
    return get().requests.find(request => request.id === id);
  },

  getPendingRequests: () => {
    return get().requests.filter(request => request.status === 'pending');
  },

  getRequestsByType: (type) => {
    return get().requests.filter(request => request.type === type);
  },

  getRequestsByStatus: (status) => {
    return get().requests.filter(request => request.status === status);
  }
}));