// Mock SSH service - in production this would use the ssh2 library
export interface SSHResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class MockSSHService {
  private static readonly SSH_USERNAME = process.env.SSH_USERNAME || "admin";
  private static readonly SSH_PASSWORD = process.env.SSH_PASSWORD || "password";

  static async fetchDeviceVersion(ip: string): Promise<SSHResult> {
    // Simulate SSH connection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock version data
    const versions = ["v2.4.1", "v2.4.2", "v2.3.8", "v2.4.0"];
    const randomVersion = versions[Math.floor(Math.random() * versions.length)];
    
    return {
      success: true,
      data: randomVersion
    };
  }

  static async fetchDeviceUptime(ip: string): Promise<SSHResult> {
    // Simulate SSH connection delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock uptime data
    const uptimes = ["1d 16h", "2d 8h", "5d 12h", "12d 4h", "3h 45m"];
    const randomUptime = uptimes[Math.floor(Math.random() * uptimes.length)];
    
    return {
      success: true,
      data: randomUptime
    };
  }

  static async checkDeviceConnection(ip: string): Promise<SSHResult> {
    // Simulate SSH connection attempt
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock connection result (95% success rate)
    const isOnline = Math.random() > 0.05;
    
    return {
      success: isOnline,
      data: isOnline ? 1 : 0,
      error: isOnline ? undefined : "Connection timeout"
    };
  }

  static async fetchDeviceInfo(ip: string): Promise<SSHResult> {
    const [versionResult, uptimeResult, connectionResult] = await Promise.all([
      this.fetchDeviceVersion(ip),
      this.fetchDeviceUptime(ip),
      this.checkDeviceConnection(ip)
    ]);

    if (!connectionResult.success) {
      return connectionResult;
    }

    return {
      success: true,
      data: {
        version: versionResult.success ? versionResult.data : null,
        uptime: uptimeResult.success ? uptimeResult.data : null,
        isOnline: connectionResult.data
      }
    };
  }
}
