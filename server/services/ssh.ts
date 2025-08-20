import { Client, ClientChannel } from "ssh2";

export interface SSHResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface SSHSession {
  id: string;
  deviceId: string;
  ip: string;
  username: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  commands: SSHCommand[];
}

export interface SSHCommand {
  id: string;
  command: string;
  output: string;
  error?: string;
  timestamp: Date;
  executionTime: number;
}

export class SSHService {
  static get SSH_USERNAME() { return process.env.SSH_USERNAME || "admin"; }
  static get SSH_PASSWORD() { return process.env.SSH_PASSWORD || "password"; }
  static get SSH_TIMEOUT_MS() { return Number(process.env.SSH_TIMEOUT_MS || 5000); }
  static get SSH_PORT() { return Number(process.env.SSH_PORT || 22); }
  
  // Store active SSH sessions
  private static activeSessions = new Map<string, SSHSession>();
  private static sshConnections = new Map<string, Client>();

  private static execCommand(ip: string, command: string): Promise<{ stdout: string; stderr: string }>
  {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let settled = false;

      const onDone = (err?: Error, stdout = "", stderr = "") => {
        if (settled) return;
        settled = true;
        try { conn.end(); } catch {}
        if (err) return reject(err);
        resolve({ stdout, stderr });
      };

      const timer = setTimeout(() => onDone(new Error("SSH timeout")), this.SSH_TIMEOUT_MS);

      conn
        .on("ready", () => {
          conn.exec(command, (err: Error | undefined, stream: ClientChannel) => {
            if (err) return onDone(err);
            let stdout = "";
            let stderr = "";
            stream
              .on("close", () => {
                clearTimeout(timer);
                onDone(undefined, stdout.trim(), stderr.trim());
              })
              .on("data", (data: Buffer) => {
                stdout += data.toString();
              })
              .stderr.on("data", (data: Buffer) => {
                stderr += data.toString();
              });
          });
        })
        .on("keyboard-interactive", (_name, _instructions, _lang, _prompts, finish) => {
          try { finish([this.SSH_PASSWORD]); } catch {}
        })
        .on("error", (err: any) => {
          clearTimeout(timer);
          const message = typeof err?.message === 'string' ? err.message : String(err);
          const friendly = /authentication/i.test(message) ? "Authentication failed" : message;
          onDone(new Error(friendly));
        })
        .connect({
          host: ip,
          port: this.SSH_PORT,
          username: this.SSH_USERNAME,
          password: this.SSH_PASSWORD,
          readyTimeout: this.SSH_TIMEOUT_MS,
          tryKeyboard: true,
        });
    });
  }

  static async fetchDeviceInfo(ip: string): Promise<SSHResult> {
    try {
      // Read version from /version and uptime from /proc/uptime if available
      const [versionRes, uptimeRes] = await Promise.all([
        this.execCommand(ip, "cat /version || echo '{}'"),
        this.execCommand(ip, "cat /proc/uptime || uptime -p || echo 0 0"),
      ]);

      // Parse version - handle both JSON and plain text formats
      let version: any = null;
      let kernel: string | null = null;
      let build: string | null = null;
      let commit: string | null = null;
      let description: string | null = null;
      let timestamp: string | null = null;

      try {
        // Try to parse as JSON first
        const versionText = versionRes.stdout.trim();
        if (versionText && versionText !== '{}') {
          const versionData = JSON.parse(versionText);
          version = versionData.version || null;
          kernel = versionData.kernel || null;
          build = versionData.build || null;
          commit = versionData.commit || null;
          description = versionData.description || null;
          timestamp = versionData.timestamp || null;
        }
      } catch (parseError) {
        // If JSON parsing fails, fall back to plain text
        version = versionRes.stdout.split(/\r?\n/)[0]?.trim() || null;
      }

      // Parse uptime
      let uptime: string | null = null;
      const uptimeLine = uptimeRes.stdout.split(/\r?\n/)[0]?.trim() || "";
      if (/^\d+\.?\d*\s+\d+\.?\d*/.test(uptimeLine)) {
        // /proc/uptime format: "12345.67 89012.34" -> convert seconds to "Xd Yh"
        const seconds = Math.floor(parseFloat(uptimeLine.split(" ")[0]));
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        uptime = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
      } else if (uptimeLine) {
        uptime = uptimeLine;
      }

      return { 
        success: true, 
        data: { 
          version, 
          kernel,
          build,
          commit,
          description,
          timestamp,
          uptime, 
          isOnline: 1 
        } 
      };
    } catch (error: any) {
      return { success: false, error: error?.message || "SSH error", data: { isOnline: 0 } };
    }
  }

  // New method: Create SSH session
  static async createSession(deviceId: string, ip: string): Promise<SSHResult> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const conn = new Client();
      
      const session: SSHSession = {
        id: sessionId,
        deviceId,
        ip,
        username: this.SSH_USERNAME,
        startTime: new Date(),
        lastActivity: new Date(),
        isActive: true,
        commands: []
      };

      return new Promise((resolve, reject) => {
        conn.on("ready", () => {
          this.activeSessions.set(sessionId, session);
          this.sshConnections.set(sessionId, conn);
          resolve({ success: true, data: session });
        });

        conn.on("keyboard-interactive", (_name, _instructions, _lang, _prompts, finish) => {
          try { finish([this.SSH_PASSWORD]); } catch {}
        });

        conn.on("error", (err: any) => {
          const message = typeof err?.message === 'string' ? err.message : String(err);
          const friendly = /authentication/i.test(message) ? "Authentication failed" : message;
          reject({ success: false, error: friendly });
        });

        conn.connect({
          host: ip,
          port: this.SSH_PORT,
          username: this.SSH_USERNAME,
          password: this.SSH_PASSWORD,
          readyTimeout: this.SSH_TIMEOUT_MS,
          tryKeyboard: true,
        });
      });
    } catch (error: any) {
      return { success: false, error: error?.message || "Failed to create SSH session" };
    }
  }

  // New method: Execute command in session
  static async executeCommand(sessionId: string, command: string): Promise<SSHResult> {
    try {
      const session = this.activeSessions.get(sessionId);
      const conn = this.sshConnections.get(sessionId);
      
      if (!session || !conn) {
        return { success: false, error: "Session not found or inactive" };
      }

      const startTime = Date.now();
      
      return new Promise((resolve, reject) => {
        conn.exec(command, (err: Error | undefined, stream: ClientChannel) => {
          if (err) {
            reject({ success: false, error: err.message });
            return;
          }

          let stdout = "";
          let stderr = "";

          stream.on("close", () => {
            const executionTime = Date.now() - startTime;
            const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const sshCommand: SSHCommand = {
              id: commandId,
              command,
              output: stdout.trim(),
              error: stderr.trim() || undefined,
              timestamp: new Date(),
              executionTime
            };

            session.commands.push(sshCommand);
            session.lastActivity = new Date();
            
            resolve({ 
              success: true, 
              data: { 
                command: sshCommand,
                session: session 
              } 
            });
          });

          stream.on("data", (data: Buffer) => {
            stdout += data.toString();
          });

          stream.stderr.on("data", (data: Buffer) => {
            stderr += data.toString();
          });
        });
      });
    } catch (error: any) {
      return { success: false, error: error?.message || "Failed to execute command" };
    }
  }

  // New method: Get active sessions
  static getActiveSessions(): SSHSession[] {
    return Array.from(this.activeSessions.values());
  }

  // New method: Get session by ID
  static getSession(sessionId: string): SSHSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  // New method: Close session
  static async closeSession(sessionId: string): Promise<SSHResult> {
    try {
      const session = this.activeSessions.get(sessionId);
      const conn = this.sshConnections.get(sessionId);
      
      if (!session || !conn) {
        return { success: false, error: "Session not found" };
      }

      conn.end();
      session.isActive = false;
      
      this.activeSessions.delete(sessionId);
      this.sshConnections.delete(sessionId);
      
      return { success: true, data: { message: "Session closed successfully" } };
    } catch (error: any) {
      return { success: false, error: error?.message || "Failed to close session" };
    }
  }
}

// Fallback mock for development/testing if real SSH is not reachable
export class MockSSHService {
  static async fetchDeviceInfo(ip: string): Promise<SSHResult> {
    await new Promise((r) => setTimeout(r, 200));
    const versions = ["104.157.234.53", "104.157.234.54", "104.157.234.55", "104.157.234.56"];
    const kernels = ["4.9.67", "4.9.68", "4.9.69", "4.9.70"];
    const builds = ["Debug", "Release", "Debug", "Release"];
    const commits = ["7e485ba59703b3c5fc720908c629480b73714436", "8f596cb6a814b4c4d831919d629591c84825547", "9g607dc7b925c5d5e942a20e730a02d95936658", "0h718ed8c036d6d6f053b31f841b13e06047769"];
    const descriptions = ["heads/master-0-g7e485ba597-dirty", "heads/master-1-g8f596cb6a814-dirty", "heads/master-2-g9g607dc7b925-dirty", "heads/master-3-g0h718ed8c036-dirty"];
    const timestamps = ["08/14/2025 19:22:54", "08/15/2025 20:33:45", "08/16/2025 21:44:36", "08/17/2025 22:55:27"];
    const uptimes = ["1d 16h", "2d 8h", "5d 12h", "12d 4h", "3h 45m"];
    const isOnline = Math.random() > 0.05;
    
    const randomIndex = Math.floor(Math.random() * versions.length);
    
    return {
      success: isOnline,
      data: { 
        version: versions[randomIndex], 
        kernel: kernels[randomIndex],
        build: builds[randomIndex],
        commit: commits[randomIndex],
        description: descriptions[randomIndex],
        timestamp: timestamps[randomIndex],
        uptime: uptimes[Math.floor(Math.random() * uptimes.length)], 
        isOnline: isOnline ? 1 : 0 
      },
      error: isOnline ? undefined : "Connection timeout",
    };
  }
}
