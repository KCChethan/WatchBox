import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertDeviceSchema, updateDeviceStatusSchema, insertAccessRequestSchema } from "@shared/schema";
import { MockSSHService } from "./services/ssh";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Device routes
  app.get("/api/devices", async (req, res) => {
    try {
      const devices = await storage.getDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  app.post("/api/devices", async (req, res) => {
    try {
      const deviceData = insertDeviceSchema.parse(req.body);
      
      // Check if device already exists
      const existingDevice = await storage.getDeviceByIp(deviceData.ip);
      if (existingDevice) {
        return res.status(409).json({ message: "Device with this IP already exists" });
      }

      const device = await storage.createDevice(deviceData);
      
      // Fetch device info via SSH
      const sshResult = await MockSSHService.fetchDeviceInfo(deviceData.ip);
      if (sshResult.success) {
        await storage.updateDevice(device.id, {
          version: sshResult.data.version,
          uptime: sshResult.data.uptime,
          isOnline: sshResult.data.isOnline
        });
      }

      const updatedDevice = await storage.getDevice(device.id);
      
      // Broadcast to WebSocket clients
      broadcastToClients('device_added', updatedDevice);
      
      res.json(updatedDevice);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create device" });
    }
  });

  app.put("/api/devices/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const statusData = updateDeviceStatusSchema.parse(req.body);
      
      const device = await storage.updateDeviceStatus(id, statusData);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      // Broadcast to WebSocket clients
      broadcastToClients('device_updated', device);
      
      res.json(device);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update device" });
    }
  });

  app.delete("/api/devices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteDevice(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Device not found" });
      }

      // Broadcast to WebSocket clients
      broadcastToClients('device_deleted', { id });
      
      res.json({ message: "Device deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // Access request routes
  app.get("/api/access-requests", async (req, res) => {
    try {
      const requests = await storage.getAccessRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access requests" });
    }
  });

  app.post("/api/access-requests", async (req, res) => {
    try {
      const requestData = insertAccessRequestSchema.parse(req.body);
      const request = await storage.createAccessRequest(requestData);
      
      // Broadcast to WebSocket clients
      broadcastToClients('access_request_created', request);
      
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create access request" });
    }
  });

  app.put("/api/access-requests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const request = await storage.updateAccessRequest(id, { status });
      if (!request) {
        return res.status(404).json({ message: "Access request not found" });
      }

      // If approved, update device status
      if (status === "approved") {
        await storage.updateDeviceStatus(request.deviceId, {
          status: "using",
          currentUser: request.requesterName
        });
      }

      // Broadcast to WebSocket clients
      broadcastToClients('access_request_updated', request);
      
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update access request" });
    }
  });

  // Refresh device info endpoint
  app.post("/api/devices/:id/refresh", async (req, res) => {
    try {
      const { id } = req.params;
      const device = await storage.getDevice(id);
      
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      const sshResult = await MockSSHService.fetchDeviceInfo(device.ip);
      if (sshResult.success) {
        const updatedDevice = await storage.updateDevice(id, {
          version: sshResult.data.version,
          uptime: sshResult.data.uptime,
          isOnline: sshResult.data.isOnline
        });

        // Broadcast to WebSocket clients
        broadcastToClients('device_updated', updatedDevice);
        
        res.json(updatedDevice);
      } else {
        res.status(500).json({ message: sshResult.error || "Failed to fetch device info" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh device info" });
    }
  });

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });

    // Send initial data
    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
  });

  function broadcastToClients(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Periodic device updates
  setInterval(async () => {
    try {
      const devices = await storage.getDevices();
      for (const device of devices) {
        if (device.isOnline) {
          const sshResult = await MockSSHService.fetchDeviceInfo(device.ip);
          if (sshResult.success) {
            await storage.updateDevice(device.id, {
              version: sshResult.data.version,
              uptime: sshResult.data.uptime,
              isOnline: sshResult.data.isOnline
            });
          }
        }
      }
      
      const updatedDevices = await storage.getDevices();
      broadcastToClients('devices_updated', updatedDevices);
    } catch (error) {
      console.error('Error updating devices:', error);
    }
  }, 30000); // Update every 30 seconds

  return httpServer;
}
