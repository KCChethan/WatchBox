import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertDeviceSchema, updateDeviceStatusSchema, insertAccessRequestSchema, accessRequestStatusEnum } from "@shared/schema";
import { SSHService, MockSSHService } from "./services/ssh";

const USE_MOCK_FALLBACK = (process.env.SSH_USE_MOCK_FALLBACK || 'false').toLowerCase() === 'true';

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

  // Logs endpoint - recent 50
  app.get("/api/logs", async (_req, res) => {
    const logs = await storage.getRecentLogs(50);
    res.json(logs);
  });

  app.post("/api/devices", async (req, res) => {
    try {
      const validatedData = insertDeviceSchema.parse(req.body);
      const result = await storage.createDevice(validatedData);
      
      if ('error' in result) {
        // For duplicate device errors, return 409 Conflict
        if (result.error.includes('already in use') || result.error.includes('already exists')) {
          return res.status(409).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }
      
      // Fetch device info via SSH with safe fallback to mock
      let sshResult = await SSHService.fetchDeviceInfo(validatedData.ip);
      if (!sshResult.success && USE_MOCK_FALLBACK) {
        sshResult = await MockSSHService.fetchDeviceInfo(validatedData.ip);
      }
      if (sshResult.success) {
        await storage.updateDevice(result.id, {
          version: sshResult.data.version ?? null,
          kernel: sshResult.data.kernel,
          build: sshResult.data.build,
          commit: sshResult.data.commit,
          description: sshResult.data.description,
          timestamp: sshResult.data.timestamp,
          uptime: sshResult.data.uptime ?? null,
          isOnline: sshResult.data.isOnline,
          // initialize usage timer only if duration provided by user
          usageStartTime: validatedData.usageDuration ? new Date() : null,
        });
      } else {
        await storage.updateDevice(result.id, { isOnline: 0, version: null, uptime: null });
      }

      const updatedDevice = await storage.getDevice(result.id);
      
      // Broadcast to WebSocket clients
      broadcastToClients('device_added', updatedDevice);
      
      res.json(updatedDevice);
    } catch (error) {
      console.error("Error creating device:", error);
      res.status(400).json({ error: "Invalid device data" });
    }
  });

  app.put("/api/devices/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const statusData = updateDeviceStatusSchema.parse(req.body);
      
      // Ensure currentUser is present for statuses that require a user
      if ((statusData.status === "using" || statusData.status === "dnd") && !statusData.currentUser) {
        return res.status(400).json({ message: "currentUser is required when setting status to using or dnd" });
      }

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
      const { deletedBy } = req.body; // Get the username from request body
      
      // Check if user is authenticated (you can implement proper auth middleware later)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const deleted = await storage.deleteDevice(id, deletedBy);
      if (!deleted) {
        return res.status(404).json({ error: "Device not found" });
      }
      
      // Broadcast to WebSocket clients
      broadcastToClients('device_deleted', { id });
      
      res.json({ message: "Device deleted successfully" });
    } catch (error) {
      console.error("Error deleting device:", error);
      res.status(500).json({ error: "Failed to delete device" });
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
      const parsed = accessRequestStatusEnum.safeParse(status);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const request = await storage.updateAccessRequest(id, { status });
      if (!request) {
        return res.status(404).json({ message: "Access request not found" });
      }

      // If approved, update device status
      if (status === "approved") {
        const device = await storage.getDevice(request.deviceId);
        if (!device) {
          return res.status(404).json({ message: "Device not found for request" });
        }
        if (device.status === "using" && device.currentUser && device.currentUser !== request.requesterName) {
          return res.status(409).json({ message: `Device is already in use by ${device.currentUser}` });
        }
        await storage.updateDeviceStatus(request.deviceId, { status: "using", currentUser: request.requesterName });
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

      let sshResult = await SSHService.fetchDeviceInfo(device.ip);
      if (!sshResult.success && USE_MOCK_FALLBACK) {
        sshResult = await MockSSHService.fetchDeviceInfo(device.ip);
      }
      if (sshResult.success) {
        const updatedDevice = await storage.updateDevice(id, {
          version: sshResult.data.version ?? null,
          kernel: sshResult.data.kernel,
          build: sshResult.data.build,
          commit: sshResult.data.commit,
          description: sshResult.data.description,
          timestamp: sshResult.data.timestamp,
          uptime: sshResult.data.uptime ?? null,
          isOnline: sshResult.data.isOnline
        });

        // Broadcast to WebSocket clients
        broadcastToClients('device_updated', updatedDevice);
        
        res.json(updatedDevice);
      } else {
        const updatedDevice = await storage.updateDevice(id, { isOnline: 0 });
        broadcastToClients('device_updated', updatedDevice);
        res.status(500).json({ message: sshResult.error || "Failed to fetch device info" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh device info" });
    }
  });

  // SSH Session routes
  app.post("/api/ssh/sessions", async (req, res) => {
    try {
      const { deviceId, ip } = req.body;
      
      if (!deviceId || !ip) {
        return res.status(400).json({ message: "deviceId and ip are required" });
      }

      const session = await SSHService.createSession(deviceId, ip);
      if (session.success) {
        // Broadcast to WebSocket clients
        broadcastToClients('ssh_session_created', session.data);
        res.json(session.data);
      } else {
        res.status(500).json({ message: session.error || "Failed to create SSH session" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create SSH session" });
    }
  });

  app.post("/api/ssh/sessions/:sessionId/execute", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { command } = req.body;
      
      if (!command) {
        return res.status(400).json({ message: "command is required" });
      }

      const result = await SSHService.executeCommand(sessionId, command);
      if (result.success) {
        // Broadcast to WebSocket clients
        broadcastToClients('ssh_command_executed', result.data);
        res.json(result.data);
      } else {
        res.status(500).json({ message: result.error || "Failed to execute command" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to execute command" });
    }
  });

  app.get("/api/ssh/sessions", async (req, res) => {
    try {
      const sessions = SSHService.getActiveSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SSH sessions" });
    }
  });

  app.delete("/api/ssh/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await SSHService.closeSession(sessionId);
      
      if (result.success) {
        // Broadcast to WebSocket clients
        broadcastToClients('ssh_session_closed', { sessionId });
        res.json({ message: "Session closed successfully" });
      } else {
        res.status(500).json({ message: result.error || "Failed to close session" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to close SSH session" });
    }
  });

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected. Total clients:', clients.size + 1);
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected. Total clients:', clients.size);
    });

    // Send initial data
    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
  });

  function broadcastToClients(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    console.log(`Broadcasting WebSocket message: ${type}`, { data });
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
        let sshResult = await SSHService.fetchDeviceInfo(device.ip);
        if (!sshResult.success && USE_MOCK_FALLBACK) {
          sshResult = await MockSSHService.fetchDeviceInfo(device.ip);
        }
        if (sshResult.success) {
          await storage.updateDevice(device.id, {
            version: sshResult.data.version ?? null,
            kernel: sshResult.data.kernel,
            build: sshResult.data.build,
            commit: sshResult.data.commit,
            description: sshResult.data.description,
            timestamp: sshResult.data.timestamp,
            uptime: sshResult.data.uptime ?? null,
            isOnline: sshResult.data.isOnline
          });
        } else {
          await storage.updateDevice(device.id, { isOnline: 0 });
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
