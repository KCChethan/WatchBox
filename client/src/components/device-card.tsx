import { Server, Play, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Device } from "@shared/schema";

interface DeviceCardProps {
  device: Device;
  onUseDevice: (deviceId: string) => void;
  onSetDND: (deviceId: string) => void;
  onRequestAccess: (deviceId: string) => void;
  onRemoveDevice: (deviceId: string) => void;
}

export function DeviceCard({ 
  device, 
  onUseDevice, 
  onSetDND, 
  onRequestAccess, 
  onRemoveDevice 
}: DeviceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "using":
        return "text-red-400";
      case "idle":
        return "text-emerald-400";
      case "dnd":
        return "text-amber-400";
      default:
        return "text-slate-400";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "using":
        return "bg-red-500 shadow-[0_0_8px_theme(colors.red.500)]";
      case "idle":
        return "bg-emerald-500 shadow-[0_0_8px_theme(colors.emerald.500)]";
      case "dnd":
        return "bg-amber-500 shadow-[0_0_8px_theme(colors.amber.500)]";
      default:
        return "bg-slate-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "using":
        return "In Use";
      case "idle":
        return "Idle";
      case "dnd":
        return "Do Not Disturb";
      default:
        return "Unknown";
    }
  };

  const getServerIconColor = (status: string, isOnline: boolean) => {
    if (!isOnline) return "text-slate-500";
    switch (status) {
      case "using":
        return "text-slate-400";
      case "idle":
        return "text-emerald-400";
      case "dnd":
        return "text-amber-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-all duration-300 animate-[slide-in_0.3s_ease-out]" data-testid={`device-card-${device.id}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusDot(device.status)}`}></div>
          <span className={`text-sm font-medium ${getStatusColor(device.status)}`} data-testid={`device-status-${device.id}`}>
            {getStatusText(device.status)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {device.status === "using" && (
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-slate-300 p-1 h-6 w-6"
              onClick={() => onRequestAccess(device.id)}
              data-testid={`button-request-${device.id}`}
            >
              <Send className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:text-red-400 p-1 h-6 w-6"
            onClick={() => onRemoveDevice(device.id)}
            data-testid={`button-remove-${device.id}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="text-center mb-3">
        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-2">
          <Server className={`w-5 h-5 ${getServerIconColor(device.status, device.isOnline === 1)}`} />
        </div>
        <h3 className="font-semibold text-slate-50" data-testid={`device-ip-${device.id}`}>
          {device.ip}
        </h3>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Version:</span>
          <span className="text-slate-300" data-testid={`device-version-${device.id}`}>
            {device.version || "Unknown"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Uptime:</span>
          <span className="text-slate-300" data-testid={`device-uptime-${device.id}`}>
            {device.uptime || "Unknown"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">User:</span>
          <span className={`font-medium ${device.currentUser ? getStatusColor(device.status) : "text-slate-500"}`} data-testid={`device-user-${device.id}`}>
            {device.currentUser || "Available"}
          </span>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-3 flex space-x-1">
        {device.status === "using" && (
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-2 py-1 text-xs transition-colors"
            onClick={() => onRequestAccess(device.id)}
            data-testid={`button-request-access-${device.id}`}
          >
            Request
          </Button>
        )}
        {device.status === "idle" && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-2 py-1 text-xs transition-colors"
              onClick={() => onUseDevice(device.id)}
              data-testid={`button-use-device-${device.id}`}
            >
              Use Now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-2 py-1 text-xs transition-colors"
              onClick={() => onSetDND(device.id)}
              data-testid={`button-set-dnd-${device.id}`}
            >
              DND
            </Button>
          </>
        )}
        {device.status === "dnd" && (
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 bg-slate-600/50 text-slate-500 px-2 py-1 text-xs cursor-not-allowed"
            disabled
            data-testid={`button-dnd-disabled-${device.id}`}
          >
            Long Test Running
          </Button>
        )}
      </div>
    </div>
  );
}
