import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import AuthService from "@/lib/auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface LogEntry {
  type: string;
  message: string;
  timestamp: string;
}

export default function History() {
  const currentUser = AuthService.getUser()?.username ?? null;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: logs = [], isLoading, error, refetch } = useQuery<LogEntry[]>({
    queryKey: ["/api/logs"],
    queryFn: async () => {
      const res = await fetch("/api/logs", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  // WebSocket integration for real-time updates
  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      console.log("History page received WebSocket message:", message);
      console.log("Message type:", message.type);
      console.log("Message data:", message.data);
      
      if (message.type === "device_added" || 
          message.type === "device_deleted" || 
          message.type === "device_updated" ||
          message.type === "access_request_created" ||
          message.type === "access_request_updated" ||
          message.type === "devices_updated") {
        console.log("Refreshing logs due to:", message.type);
        // Refresh logs when any device or access request changes
        refetch();
      } else {
        console.log("Message type not handled:", message.type);
      }
    },
    onConnect: () => {
      console.log("WebSocket connected in History page");
    },
    onError: (error) => {
      console.error("WebSocket error in History page:", error);
    }
  });

  const deviceStats = { total: 0, online: 0, inUse: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 text-slate-50 font-inter antialiased">
      <Header deviceStats={deviceStats} currentUser={currentUser} onLogout={() => { AuthService.logout(); window.location.reload(); }} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Recent Activity</h1>
          <Button 
            onClick={() => refetch()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Refresh
          </Button>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          {isLoading ? (
            <div className="text-slate-400">Loading...</div>
          ) : error ? (
            <div className="text-red-400">Failed to load logs</div>
          ) : logs.length === 0 ? (
            <div className="text-slate-400">No recent activity</div>
          ) : (
            <ul className="divide-y divide-slate-700">
              {logs.map((log, idx) => (
                <li key={idx} className="py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{log.message}</span>
                  <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 text-xs text-slate-500">
          Debug: {logs.length} logs loaded, WebSocket: {isConnected ? "Connected" : "Disconnected"}
        </div>
      </main>
    </div>
  );
}


