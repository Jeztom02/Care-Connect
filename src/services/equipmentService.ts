import api from './api';

export interface Equipment {
  _id: string;
  name: string;
  description?: string;
  category: string;
  condition: 'New' | 'Used';
  price: number;
  status: 'Available' | 'Sold' | 'Pending' | 'Reserved';
  sellerId: string | { _id: string; name: string; role: string };
  sellerType: 'Hospital' | 'Patient' | 'Admin';
  images?: string[];
  isVerified: boolean;
  location?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentFilters {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerType?: string;
  search?: string;
}

export const equipmentService = {
  getAll: async (filters?: EquipmentFilters) => {
    const response = await api.get<Equipment[]>('/equipment', { params: filters });
    return response.data;
  },

  getMyListings: async () => {
    const response = await api.get<Equipment[]>('/equipment/my-listings');
    return response.data;
  },

  getPending: async () => {
    const response = await api.get<Equipment[]>('/equipment/pending');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Equipment>(`/equipment/${id}`);
    return response.data;
  },

  create: async (data: Partial<Equipment>) => {
    const response = await api.post<Equipment>('/equipment', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Equipment>) => {
    const response = await api.put<Equipment>(`/equipment/${id}`, data);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.put<Equipment>(`/equipment/${id}/approve`);
    return response.data;
  },

  buy: async (id: string) => {
    const response = await api.post<{ message: string; transaction: any }>(`/equipment/${id}/buy`);
    return response.data;
  },

  // Admin endpoints
  getTransactions: async (params?: Record<string, any>) => {
    const response = await api.get<any[]>('/equipment/admin/transactions', { params });
    return response.data;
  },

  getUsedSales: async () => {
    const response = await api.get<any[]>('/equipment/admin/sales');
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/equipment/${id}`);
  }
};
