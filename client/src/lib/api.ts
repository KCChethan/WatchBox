import { apiRequest } from "./queryClient";
import type { Device, InsertDevice, UpdateDeviceStatus, AccessRequest, InsertAccessRequest } from "@shared/schema";

export const deviceApi = {
  getAll: async (): Promise<Device[]> => {
    const response = await apiRequest("GET", "/api/devices");
    return response.json();
  },

  create: async (device: InsertDevice): Promise<Device> => {
    const response = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(device),
      credentials: "include"
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create device');
    }
    
    if ('error' in result) {
      throw new Error(result.error);
    }
    
    return result;
  },

  updateStatus: async (id: string, status: UpdateDeviceStatus): Promise<Device> => {
    const response = await apiRequest("PUT", `/api/devices/${id}/status`, status);
    return response.json();
  },

  delete: async (id: string, deletedBy?: string): Promise<void> => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/devices/${id}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ deletedBy }),
      credentials: "include"
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to delete device');
    }
  },

  refresh: async (id: string): Promise<Device> => {
    const response = await apiRequest("POST", `/api/devices/${id}/refresh`);
    return response.json();
  }
};

export const accessRequestApi = {
  getAll: async (): Promise<AccessRequest[]> => {
    const response = await apiRequest("GET", "/api/access-requests");
    return response.json();
  },

  create: async (request: InsertAccessRequest): Promise<AccessRequest> => {
    const response = await apiRequest("POST", "/api/access-requests", request);
    return response.json();
  },

  update: async (id: string, updates: { status: string }): Promise<AccessRequest> => {
    const response = await apiRequest("PUT", `/api/access-requests/${id}`, updates);
    return response.json();
  }
};
