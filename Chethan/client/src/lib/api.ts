import { apiRequest } from "./queryClient";
import type { Device, InsertDevice, UpdateDeviceStatus, AccessRequest, InsertAccessRequest } from "@shared/schema";

export const deviceApi = {
  getAll: async (): Promise<Device[]> => {
    const response = await apiRequest("GET", "/api/devices");
    return response.json();
  },

  create: async (device: InsertDevice): Promise<Device> => {
    const response = await apiRequest("POST", "/api/devices", device);
    return response.json();
  },

  updateStatus: async (id: string, status: UpdateDeviceStatus): Promise<Device> => {
    const response = await apiRequest("PUT", `/api/devices/${id}/status`, status);
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/devices/${id}`);
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
