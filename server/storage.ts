import { type Device, type InsertDevice, type UpdateDeviceStatus, type AccessRequest, type InsertAccessRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Device methods
  getDevices(): Promise<Device[]>;
  getDevice(id: string): Promise<Device | undefined>;
  getDeviceByIp(ip: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined>;
  updateDeviceStatus(id: string, updates: UpdateDeviceStatus): Promise<Device | undefined>;
  deleteDevice(id: string): Promise<boolean>;
  
  // Access request methods
  getAccessRequests(): Promise<AccessRequest[]>;
  getAccessRequestsByDevice(deviceId: string): Promise<AccessRequest[]>;
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  updateAccessRequest(id: string, updates: Partial<AccessRequest>): Promise<AccessRequest | undefined>;
}

export class MemStorage implements IStorage {
  private devices: Map<string, Device>;
  private accessRequests: Map<string, AccessRequest>;

  constructor() {
    this.devices = new Map();
    this.accessRequests = new Map();
    
    // Initialize with default devices
    this.initializeDefaultDevices();
  }

  private async initializeDefaultDevices() {
    const defaultDevices = [
      { ip: "10.141.1.30", status: "using", currentUser: "john.doe" },
      { ip: "10.141.1.31", status: "idle", currentUser: null },
      { ip: "10.141.1.32", status: "dnd", currentUser: "jane.smith" },
      { ip: "10.141.1.33", status: "idle", currentUser: null },
    ];

    for (const deviceData of defaultDevices) {
      await this.createDevice({ ip: deviceData.ip });
      const device = await this.getDeviceByIp(deviceData.ip);
      if (device) {
        await this.updateDevice(device.id, {
          status: deviceData.status,
          currentUser: deviceData.currentUser,
          version: null,
          uptime: null,
          isOnline: 0,
        });
      }
    }
  }

  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: string): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async getDeviceByIp(ip: string): Promise<Device | undefined> {
    return Array.from(this.devices.values()).find(device => device.ip === ip);
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = randomUUID();
    const device: Device = {
      ...insertDevice,
      id,
      status: "idle",
      version: null,
      uptime: null,
      currentUser: null,
      isOnline: 0,
      lastUpdated: new Date(),
    };
    this.devices.set(id, device);
    return device;
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...updates, lastUpdated: new Date() };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  async updateDeviceStatus(id: string, updates: UpdateDeviceStatus): Promise<Device | undefined> {
    return this.updateDevice(id, updates);
  }

  async deleteDevice(id: string): Promise<boolean> {
    return this.devices.delete(id);
  }

  async getAccessRequests(): Promise<AccessRequest[]> {
    return Array.from(this.accessRequests.values());
  }

  async getAccessRequestsByDevice(deviceId: string): Promise<AccessRequest[]> {
    return Array.from(this.accessRequests.values()).filter(req => req.deviceId === deviceId);
  }

  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    const id = randomUUID();
    const request: AccessRequest = {
      ...insertRequest,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.accessRequests.set(id, request);
    return request;
  }

  async updateAccessRequest(id: string, updates: Partial<AccessRequest>): Promise<AccessRequest | undefined> {
    const request = this.accessRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...updates };
    this.accessRequests.set(id, updatedRequest);
    return updatedRequest;
  }
}

export const storage = new MemStorage();
