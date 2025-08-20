import { useQuery } from "@tanstack/react-query";
import { Server, Monitor, Wifi, WifiOff, User, Activity, TrendingUp, Clock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { useWebSocket } from "@/hooks/use-websocket";
import { deviceApi } from "@/lib/api";
import { Link } from "wouter";

export default function Dashboard() {
  // Fetch devices
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["/api/devices"],
    queryFn: deviceApi.getAll,
  });

  // WebSocket connection for real-time updates
  useWebSocket({
    onMessage: (message) => {
      // Handle real-time updates if needed
    },
  });

  // Calculate stats
  const deviceStats = {
    total: devices.length,
    online: devices.filter(d => d.isOnline === 1).length,
    offline: devices.filter(d => d.isOnline === 0).length,
    inUse: devices.filter(d => d.status === "using").length,
    idle: devices.filter(d => d.status === "idle").length,
    dnd: devices.filter(d => d.status === "dnd").length,
  };

  const recentActivity = devices
    .filter(d => d.lastUpdated)
    .sort((a, b) => new Date(b.lastUpdated!).getTime() - new Date(a.lastUpdated!).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50 font-inter antialiased">
      <Header deviceStats={deviceStats} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Device Monitor Dashboard
          </h1>
          <p className="text-slate-400">Monitor and manage your network devices in real-time</p>
        </div>

        {/* Compact Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* Total Devices */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Server className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400" data-testid="stat-total">{deviceStats.total}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
            </div>
          </div>

          {/* Online */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-4 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Wifi className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400" data-testid="stat-online">{deviceStats.online}</div>
                <div className="text-xs text-slate-400">Online</div>
              </div>
            </div>
          </div>

          {/* Offline */}
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-4 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <WifiOff className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400" data-testid="stat-offline">{deviceStats.offline}</div>
                <div className="text-xs text-slate-400">Offline</div>
              </div>
            </div>
          </div>

          {/* In Use */}
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-4 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <User className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-400" data-testid="stat-in-use">{deviceStats.inUse}</div>
                <div className="text-xs text-slate-400">In Use</div>
              </div>
            </div>
          </div>

          {/* Idle */}
          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-4 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Monitor className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400" data-testid="stat-idle">{deviceStats.idle}</div>
                <div className="text-xs text-slate-400">Idle</div>
              </div>
            </div>
          </div>

          {/* DND */}
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-4 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-400" data-testid="stat-dnd">{deviceStats.dnd}</div>
                <div className="text-xs text-slate-400">DND</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* System Status */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-50 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>System Overview</span>
                </h3>
                <Link href="/devices">
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors" data-testid="view-all-devices">
                    View All Devices →
                  </button>
                </Link>
              </div>
              
              {/* Status Visualization */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Network Health</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
                        style={{ width: `${deviceStats.total > 0 ? (deviceStats.online / deviceStats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-400">{deviceStats.total > 0 ? Math.round((deviceStats.online / deviceStats.total) * 100) : 0}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Device Utilization</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-400 rounded-full transition-all duration-500"
                        style={{ width: `${deviceStats.total > 0 ? (deviceStats.inUse / deviceStats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-400">{deviceStats.total > 0 ? Math.round((deviceStats.inUse / deviceStats.total) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 flex space-x-3">
                <Link href="/devices">
                  <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg px-4 py-2 text-sm font-medium transition-colors" data-testid="manage-devices">
                    Manage Devices
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-50 flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-purple-400" />
              <span>Recent Activity</span>
            </h3>
            
            {isLoading ? (
              <div className="text-center text-slate-400 py-4" data-testid="loading-activity">
                Loading...
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center text-slate-400 py-4" data-testid="no-activity">
                No recent activity
              </div>
            ) : (
              <div className="space-y-3" data-testid="activity-list">
                {recentActivity.map((device, index) => (
                  <div key={device.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      device.status === "using" ? "bg-red-500" :
                      device.status === "idle" ? "bg-emerald-500" :
                      device.status === "dnd" ? "bg-amber-500" : "bg-slate-500"
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-300">{device.ip}</div>
                      <div className="text-xs text-slate-500">
                        {device.status === "using" && device.currentUser ? `Used by ${device.currentUser}` :
                         device.status === "idle" ? "Available" :
                         device.status === "dnd" ? "Do Not Disturb" : "Unknown"}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {device.lastUpdated ? new Date(device.lastUpdated).toLocaleTimeString() : "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
