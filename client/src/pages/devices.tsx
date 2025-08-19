import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Send, Play, Pause, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Header } from "@/components/layout/header";
import { AddDeviceModal } from "@/components/add-device-modal";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { RequestAccessModal } from "@/components/request-access-modal";
import { NotificationToast } from "@/components/notification-toast";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { deviceApi, accessRequestApi } from "@/lib/api";
import type { Device, AccessRequest } from "@shared/schema";

// Creative Device Component - Hexagonal design
function CreativeDeviceBox({ device, onUseDevice, onSetDND, onRequestAccess, onRemoveDevice }: {
  device: Device;
  onUseDevice: (deviceId: string) => void;
  onSetDND: (deviceId: string) => void;
  onRequestAccess: (deviceId: string) => void;
  onRemoveDevice: (deviceId: string) => void;
}) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "using":
        return {
          color: "from-red-500/30 to-red-600/20",
          border: "border-red-500/50",
          glow: "shadow-red-500/30",
          pulse: "bg-red-500",
          textColor: "text-red-400"
        };
      case "idle":
        return {
          color: "from-emerald-500/30 to-emerald-600/20",
          border: "border-emerald-500/50",
          glow: "shadow-emerald-500/30",
          pulse: "bg-emerald-500",
          textColor: "text-emerald-400"
        };
      case "dnd":
        return {
          color: "from-amber-500/30 to-amber-600/20",
          border: "border-amber-500/50",
          glow: "shadow-amber-500/30",
          pulse: "bg-amber-500",
          textColor: "text-amber-400"
        };
      default:
        return {
          color: "from-slate-500/30 to-slate-600/20",
          border: "border-slate-500/50",
          glow: "shadow-slate-500/30",
          pulse: "bg-slate-500",
          textColor: "text-slate-400"
        };
    }
  };

  const config = getStatusConfig(device.status);
  const isOnline = device.isOnline === 1;

  return (
    <div className={`relative group hover:scale-105 transition-all duration-300`}>
      {/* Hexagonal Shape */}
      <div
        className={`relative w-64 h-48 bg-gradient-to-br ${config.color} backdrop-blur-sm border ${config.border} hover:shadow-2xl hover:${config.glow} transition-all duration-300`}
        style={{
          clipPath: "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
          filter: "drop-shadow(0 8px 32px rgba(0, 0, 0, 0.3))"
        }}
        data-testid={`device-box-${device.id}`}
      >
        {/* Content inside hexagon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
          {/* Status indicator */}
          <div className="flex items-center justify-center mb-3">
            <div className={`w-4 h-4 rounded-full ${config.pulse} animate-pulse shadow-lg`}></div>
            <div className="ml-2 flex items-center space-x-1">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>

          {/* IP Address */}
          <h3 className="text-lg font-bold text-slate-50 mb-2" data-testid={`device-ip-${device.id}`}>
            {device.ip}
          </h3>

          {/* Status */}
          <div className={`text-sm font-medium ${config.textColor} mb-3`} data-testid={`device-status-${device.id}`}>
            {device.status === "using" && "In Use"}
            {device.status === "idle" && "Available"}
            {device.status === "dnd" && "Do Not Disturb"}
          </div>

          {/* Device Info */}
          <div className="text-xs text-slate-400 text-center space-y-1">
            <div>v{device.version || "Unknown"}</div>
            <div>{device.uptime || "N/A"}</div>
            {device.currentUser && (
              <div className={`${config.textColor} font-medium`}>{device.currentUser}</div>
            )}
          </div>
        </div>

        {/* Action buttons overlay */}
        <div className="absolute -top-4 -right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {device.status === "using" && (
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/50 rounded-full"
              onClick={() => onRequestAccess(device.id)}
              data-testid={`button-request-${device.id}`}
            >
              <Send className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="w-8 h-8 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/50 rounded-full"
            onClick={() => onRemoveDevice(device.id)}
            data-testid={`button-remove-${device.id}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Quick Action Bar Below */}
      <div className="mt-4 flex justify-center space-x-2">
        {device.status === "idle" && (
          <>
            <Button
              size="sm"
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 px-4 py-2 text-xs transition-colors"
              onClick={() => onUseDevice(device.id)}
              data-testid={`button-use-${device.id}`}
            >
              <Play className="w-3 h-3 mr-1" />
              Use Now
            </Button>
            <Button
              size="sm"
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/50 px-4 py-2 text-xs transition-colors"
              onClick={() => onSetDND(device.id)}
              data-testid={`button-dnd-${device.id}`}
            >
              <Pause className="w-3 h-3 mr-1" />
              DND
            </Button>
          </>
        )}
        {device.status === "using" && (
          <Button
            size="sm"
            className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/50 px-4 py-2 text-xs transition-colors"
            onClick={() => onRequestAccess(device.id)}
            data-testid={`button-request-access-${device.id}`}
          >
            <Send className="w-3 h-3 mr-1" />
            Request Access
          </Button>
        )}
        {device.status === "dnd" && (
          <div className="bg-slate-600/30 text-slate-500 border border-slate-600/50 px-4 py-2 text-xs rounded-lg flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            Long Test Running
          </div>
        )}
      </div>
    </div>
  );
}

export default function Devices() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    deviceId: string | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    deviceId: null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch devices
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["/api/devices"],
    queryFn: deviceApi.getAll,
  });

  // Fetch access requests
  const { data: accessRequests = [] } = useQuery({
    queryKey: ["/api/access-requests"],
    queryFn: accessRequestApi.getAll,
  });

  // WebSocket connection
  useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case "device_added":
        case "device_updated":
        case "device_deleted":
        case "devices_updated":
          queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
          break;
        case "access_request_created":
        case "access_request_updated":
          queryClient.invalidateQueries({ queryKey: ["/api/access-requests"] });
          if (message.type === "access_request_created") {
            toast({
              title: "New Access Request",
              description: `${message.data.requesterName} wants to use a device`,
            });
          }
          break;
      }
    },
  });

  // Mutations
  const addDeviceMutation = useMutation({
    mutationFn: deviceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({
        title: "Success",
        description: "Device added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add device",
        variant: "destructive",
      });
    },
  });

  const removeDeviceMutation = useMutation({
    mutationFn: deviceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({
        title: "Success",
        description: "Device removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove device",
        variant: "destructive",
      });
    },
  });

  const updateDeviceStatusMutation = useMutation({
    mutationFn: ({ id, ...status }: { id: string; status: string; currentUser?: string }) =>
      deviceApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update device status",
        variant: "destructive",
      });
    },
  });

  const createAccessRequestMutation = useMutation({
    mutationFn: accessRequestApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-requests"] });
      toast({
        title: "Success",
        description: "Access request sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send access request",
        variant: "destructive",
      });
    },
  });

  const updateAccessRequestMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      accessRequestApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
    },
  });

  // Calculate stats
  const deviceStats = {
    total: devices.length,
    online: devices.filter(d => d.isOnline === 1).length,
    inUse: devices.filter(d => d.status === "using").length,
  };

  // Event handlers
  const handleAddDevice = async (ip: string) => {
    await addDeviceMutation.mutateAsync({ ip });
  };

  const handleUseDevice = (deviceId: string) => {
    const username = prompt("Enter your username:");
    if (username) {
      updateDeviceStatusMutation.mutate({
        id: deviceId,
        status: "using",
        currentUser: username.trim(),
      });
    }
  };

  const handleSetDND = (deviceId: string) => {
    const username = prompt("Enter your username:");
    if (username) {
      updateDeviceStatusMutation.mutate({
        id: deviceId,
        status: "dnd",
        currentUser: username.trim(),
      });
    }
  };

  const handleRequestAccess = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      setSelectedDevice(device);
      setIsRequestModalOpen(true);
    }
  };

  const handleSubmitAccessRequest = async (deviceId: string, requesterName: string, message: string) => {
    await createAccessRequestMutation.mutateAsync({
      deviceId,
      requesterName,
      message,
    });
  };

  const handleRemoveDevice = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      setConfirmationModal({
        isOpen: true,
        title: "Remove Device",
        message: `Are you sure you want to remove ${device.ip}? This action cannot be undone.`,
        deviceId,
      });
    }
  };

  const handleConfirmRemoval = () => {
    if (confirmationModal.deviceId) {
      removeDeviceMutation.mutate(confirmationModal.deviceId);
    }
    setConfirmationModal(prev => ({ ...prev, isOpen: false, deviceId: null }));
  };

  const handleApproveRequest = (requestId: string) => {
    updateAccessRequestMutation.mutate({ id: requestId, status: "approved" });
  };

  const handleDenyRequest = (requestId: string) => {
    updateAccessRequestMutation.mutate({ id: requestId, status: "denied" });
  };

  const handleDismissRequest = (requestId: string) => {
    updateAccessRequestMutation.mutate({ id: requestId, status: "dismissed" });
  };

  // Filter pending requests for notifications
  const pendingRequests = accessRequests.filter(req => req.status === "pending");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 text-slate-50 font-inter antialiased">
      <Header deviceStats={deviceStats} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Device Management
            </h1>
            <p className="text-slate-400">Manage your network devices with creative controls</p>
          </div>
          
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white flex items-center space-x-2 px-6 py-3 rounded-xl shadow-lg"
            data-testid="button-add-device"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Device</span>
          </Button>
        </div>

        {/* Device Grid */}
        {isLoading ? (
          <div className="text-center text-slate-400 py-20" data-testid="loading-devices">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            Loading devices...
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-20" data-testid="no-devices">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No devices found</h3>
            <p className="text-slate-500 mb-6">Add your first device to start monitoring</p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Add First Device
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 place-items-center" data-testid="device-grid">
            {devices.map((device) => (
              <CreativeDeviceBox
                key={device.id}
                device={device}
                onUseDevice={handleUseDevice}
                onSetDND={handleSetDND}
                onRequestAccess={handleRequestAccess}
                onRemoveDevice={handleRemoveDevice}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDevice}
      />

      <RequestAccessModal
        isOpen={isRequestModalOpen}
        device={selectedDevice}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedDevice(null);
        }}
        onSubmit={handleSubmitAccessRequest}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={handleConfirmRemoval}
        onCancel={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        isLoading={removeDeviceMutation.isPending}
      />

      {/* Notification Toasts */}
      <div className="fixed top-20 right-4 z-50 space-y-2" data-testid="notification-container">
        {pendingRequests.map((request) => (
          <NotificationToast
            key={request.id}
            request={request}
            onApprove={handleApproveRequest}
            onDeny={handleDenyRequest}
            onDismiss={handleDismissRequest}
          />
        ))}
      </div>
    </div>
  );
}
