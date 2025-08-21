import { type Device, type InsertDevice, type UpdateDeviceStatus, type AccessRequest, type InsertAccessRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Device methods
  getDevices(): Promise<Device[]>;
  getDevice(id: string): Promise<Device | undefined>;
  getDeviceByIp(ip: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device | { error: string }>;
  updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined>;
  updateDeviceStatus(id: string, updates: UpdateDeviceStatus): Promise<Device | undefined>;
  deleteDevice(id: string, deletedBy?: string): Promise<boolean>;
  
  // Access request methods
  getAccessRequests(): Promise<AccessRequest[]>;
  getAccessRequestsByDevice(deviceId: string): Promise<AccessRequest[]>;
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  updateAccessRequest(id: string, updates: Partial<AccessRequest>): Promise<AccessRequest | undefined>;

  // Logs
  addLog(entry: LogEntry): void;
  getRecentLogs(limit: number): Promise<LogEntry[]>;
}

export class MemStorage implements IStorage {
  private devices: Map<string, Device>;
  private accessRequests: Map<string, AccessRequest>;
  private logs: LogEntry[];

  constructor() {
    this.devices = new Map();
    this.accessRequests = new Map();
    this.logs = [];

    // Do not seed default devices by default. Enable only if explicitly requested.
    const shouldSeed = (process.env.SEED_DEVICES || "false").toLowerCase() === "true";
    if (shouldSeed) {
      this.initializeDefaultDevices();
    }
  }

  private async initializeDefaultDevices() {
    const defaultDevices = [
      { 
        ip: "10.141.1.30", 
        status: "using", 
        currentUser: "john.doe",
        description: "heads/SB2-7263-port-slate-ts-generation-tool-from-gen1-to-gen2-0-g19992c3729-dirty"
      },
      { 
        ip: "10.141.1.31", 
        status: "idle", 
        currentUser: null,
        description: "heads/master-0-g7e485ba597-dirty"
      },
      { 
        ip: "10.141.1.32", 
        status: "dnd", 
        currentUser: "jane.smith",
        description: "heads/master-1-g8f596cb6a814-dirty"
      },
      { 
        ip: "10.141.1.33", 
        status: "idle", 
        currentUser: null,
        description: "heads/master-2-g9g607dc7b925-dirty"
      },
    ];

    for (const deviceData of defaultDevices) {
      await this.createDevice({ 
        ip: deviceData.ip,
        addedBy: "system",
        criticality: "testing"
      });
      const device = await this.getDeviceByIp(deviceData.ip);
      if (device) {
        await this.updateDevice(device.id, {
          status: deviceData.status,
          currentUser: deviceData.currentUser,
          description: deviceData.description,
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

  async isDeviceIpExists(ip: string): Promise<boolean> {
    return this.devices.has(Array.from(this.devices.values()).find(device => device.ip === ip)?.id || '');
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device | { error: string }> {
    // Check if device IP already exists
    const existingDevice = await this.getDeviceByIp(insertDevice.ip);
    if (existingDevice) {
      if (existingDevice.currentUser) {
        return { error: `Device already in use by ${existingDevice.currentUser}` };
      } else {
        return { error: `Device ${insertDevice.ip} already exists` };
      }
    }

    const id = randomUUID();
    const device: Device = {
      ...insertDevice,
      id,
      status: "idle",
      version: null,
      kernel: null,
      build: null,
      commit: null,
      description: null,
      timestamp: null,
      uptime: null,
      currentUser: null,
      isOnline: 0,
      lastUpdated: new Date(),
      usageStartTime: null,
      criticality: insertDevice.criticality || "testing",
      note: insertDevice.note || null,
      usageDuration: insertDevice.usageDuration || null,
    };
    this.devices.set(id, device);
    this.addLog({ type: "device_created", message: `Device ${device.ip} added by ${insertDevice.addedBy}`, timestamp: new Date() });
    return device;
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...updates, lastUpdated: new Date() };
    this.devices.set(id, updatedDevice);
    // Remove update logging - only log status changes
    return updatedDevice;
  }

  async updateDeviceStatus(id: string, updates: UpdateDeviceStatus): Promise<Device | undefined> {
    const result = await this.updateDevice(id, updates as Partial<Device>);
    if (result) {
      // Only log when device status actually changes to using/idle
      if (updates.status === 'using' && updates.currentUser) {
        this.addLog({ type: "status_changed", message: `Device ${result.ip} in use by ${updates.currentUser}`, timestamp: new Date() });
      } else if (updates.status === 'idle') {
        this.addLog({ type: "status_changed", message: `Device ${result.ip} released`, timestamp: new Date() });
      }
    }
    return result;
  }

  async deleteDevice(id: string, deletedBy?: string): Promise<boolean> {
    const device = this.devices.get(id);
    const deleted = this.devices.delete(id);
    if (deleted && device) {
      // Use the actual username who is deleting the device, fallback to original creator if not provided
      const deleterName = deletedBy || device.addedBy;
      this.addLog({ type: "device_deleted", message: `Device ${device.ip} deleted by ${deleterName}`, timestamp: new Date() });
    }
    return deleted;
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
      message: insertRequest.message || null,
      createdAt: new Date(),
    };
    this.accessRequests.set(id, request);
    this.addLog({ type: "access_request_created", message: `Access request for device ${request.deviceId}`, timestamp: new Date() });
    return request;
  }

  async updateAccessRequest(id: string, updates: Partial<AccessRequest>): Promise<AccessRequest | undefined> {
    const request = this.accessRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...updates };
    this.accessRequests.set(id, updatedRequest);
    this.addLog({ type: "access_request_updated", message: `Access request ${id} -> ${updatedRequest.status}`, timestamp: new Date() });
    return updatedRequest;
  }

  // Logs
  addLog(entry: LogEntry): void {
    this.logs.unshift(entry);
    if (this.logs.length > 1000) this.logs.length = 1000;
  }

  async getRecentLogs(limit: number): Promise<LogEntry[]> {
    return this.logs.slice(0, limit);
  }
}

export const storage = new MemStorage();

// Shared log type
export interface LogEntry {
  type: string;
  message: string;
  timestamp: Date;
}
