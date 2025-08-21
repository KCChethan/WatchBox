import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Send, AlertCircle, RefreshCcw, ExternalLink, User, Info, Clock, Tag } from "lucide-react";
import { Header } from "@/components/layout/header";
import { AddDeviceModal } from "@/components/add-device-modal";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { RequestAccessModal } from "@/components/request-access-modal";
import { NotificationToast } from "@/components/notification-toast";
import { AuthModal } from "@/components/auth-modal";
import { DeviceInfoModal } from "@/components/device-info-modal";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { deviceApi, accessRequestApi } from "@/lib/api";
import type { Device, AccessRequest } from "@shared/schema";
import AuthService from "@/lib/auth";

// SSH Connections Modal Component
function SSHConnectionsModal({ isOpen, onClose, device }: {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}) {
  if (!isOpen || !device) return null;

  // Device-specific SSH connections data - in real implementation this would come from API
  const getDeviceSSHConnections = (deviceIP: string) => {
    // Mock data - each device has its own SSH connection history
    const deviceSSHData: { [key: string]: Array<{ timestamp: string; ip: string }> } = {
      "10.141.1.30": [
        { timestamp: "Aug 01 17:57:27", ip: "10.86.40.90:59385" },
        { timestamp: "Aug 01 15:57:08", ip: "10.86.40.80:55191" },
        { timestamp: "Aug 01 13:59:53", ip: "10.86.40.80:50638" },
        { timestamp: "Aug 01 09:59:46", ip: "10.86.40.90:53922" },
        { timestamp: "Aug 01 07:56:01", ip: "10.86.40.80:50638" },
      ],
      "10.141.1.31": [
        { timestamp: "Aug 01 17:57:27", ip: "10.86.40.80:59150" },
        { timestamp: "Aug 01 15:57:08", ip: "10.86.40.70:63381" },
        { timestamp: "Aug 01 13:59:53", ip: "10.86.40.60:61584" },
        { timestamp: "Aug 01 11:49:31", ip: "10.86.40.60:61584" },
        { timestamp: "Aug 01 09:48:27", ip: "10.86.40.90:61142" },
        { timestamp: "Aug 01 07:47:13", ip: "10.86.40.90:61142" },
        { timestamp: "Jul 31 07:00:41", ip: "10.141.1.254:62940" },
      ],
      "10.141.1.32": [
        { timestamp: "Aug 01 17:52:31", ip: "10.86.40.70:63381" },
        { timestamp: "Aug 01 15:55:08", ip: "10.86.40.90:54178" },
        { timestamp: "Aug 01 13:50:43", ip: "10.86.40.60:53632" },
        { timestamp: "Aug 01 11:49:31", ip: "10.86.40.60:61584" },
        { timestamp: "Aug 01 09:48:27", ip: "10.86.40.90:56812" },
        { timestamp: "Aug 01 07:47:13", ip: "10.86.40.90:61142" },
      ],
      "10.141.1.33": [
        { timestamp: "Aug 01 17:57:27", ip: "10.86.40.90:59385" },
        { timestamp: "Aug 01 15:57:08", ip: "10.86.40.80:59150" },
        { timestamp: "Aug 01 13:59:53", ip: "10.86.40.80:50638" },
        { timestamp: "Aug 01 11:49:31", ip: "10.86.40.60:61584" },
        { timestamp: "Aug 01 09:59:46", ip: "10.86.40.90:53922" },
        { timestamp: "Aug 01 07:56:01", ip: "10.86.40.80:50638" },
        { timestamp: "Aug 01 05:54:51", ip: "10.86.40.60:50519" },
        { timestamp: "Aug 01 03:53:30", ip: "10.86.40.60:55465" },
        { timestamp: "Aug 01 01:55:17", ip: "10.86.40.70:50039" },
        { timestamp: "Jul 31 23:52:45", ip: "10.86.40.70:55951" },
      ],
    };

    // Return device-specific data or empty array if device not found
    return deviceSSHData[deviceIP] || [];
  };

  const sshConnections = getDeviceSSHConnections(device.ip);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent SSH Connections</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </Button>
        </div>
        
        <div className="mb-4">
          <p className="text-slate-300 text-sm">Device: <span className="text-blue-400 font-medium">{device.ip}</span></p>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sshConnections.length > 0 ? (
            sshConnections.map((connection, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300 text-sm">{connection.timestamp}</span>
                <span className="text-blue-400 text-sm font-mono">{connection.ip}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No SSH connections found</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// Creative Device Component - Box design with colored headers
function CreativeDeviceBox({ device, currentUser, onSetDND, onRequestAccess, onRemoveDevice, onRefreshDevice, onShowDeviceInfo }: {
  device: Device;
  currentUser: string | null;
  onSetDND: (deviceId: string) => void;
  onRequestAccess: (deviceId: string) => void;
  onRemoveDevice: (deviceId: string) => void;
  onRefreshDevice: (deviceId: string) => void;
  onShowDeviceInfo: (device: Device) => void;
}) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "using":
        return {
          headerColor: "from-red-500 to-red-600",
          bodyColor: "from-red-500/10 to-red-600/5",
          border: "border-red-500/30",
          pulse: "bg-red-500",
          textColor: "text-red-400",
          headerText: "text-white"
        };
      case "idle":
        return {
          headerColor: "from-emerald-500 to-emerald-600",
          bodyColor: "from-emerald-500/10 to-emerald-600/5",
          border: "border-emerald-500/30",
          pulse: "bg-emerald-500",
          textColor: "text-emerald-400",
          headerText: "text-white"
        };
      case "dnd":
        return {
          headerColor: "from-amber-500 to-amber-600",
          bodyColor: "from-amber-500/10 to-amber-600/5",
          border: "border-amber-500/30",
          pulse: "bg-amber-500",
          textColor: "text-amber-400",
          headerText: "text-white"
        };
      default:
        return {
          headerColor: "from-slate-500 to-slate-600",
          bodyColor: "from-slate-500/10 to-slate-600/5",
          border: "border-slate-500/30",
          pulse: "bg-slate-500",
          textColor: "text-slate-400",
          headerText: "text-white"
        };
    }
  };

  const config = getStatusConfig(device.status);
  const isOnline = device.isOnline === 1;

  return (
    <div className="relative group hover:scale-105 transition-all duration-300">
      {/* Box Container */}
      <div 
        className={`relative w-full max-w-sm bg-slate-800/30 backdrop-blur-sm border ${config.border} rounded-2xl overflow-hidden hover:scale-105 hover:shadow-xl hover:shadow-${config.pulse}/10 transition-all duration-300`}
        data-testid={`device-box-${device.id}`}
      >
        {/* Colored Header with IP Address */}
        <div className={`bg-gradient-to-r ${config.headerColor} px-6 py-4 relative`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className={`text-xl font-bold ${config.headerText}`} data-testid={`device-ip-${device.id}`}>
                {device.ip}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="w-7 h-7 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full p-0 transition-all duration-200"
                onClick={() => window.open(`http://${device.ip}`, '_blank')}
                data-testid={`button-open-ip-${device.id}`}
                title={`Open ${device.ip} in new tab`}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

          </div>
          
          {/* Action buttons in header */}
          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="sm"
              variant="ghost"
              className="w-7 h-7 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full p-0"
              onClick={() => onShowDeviceInfo(device)}
              data-testid={`button-device-info-${device.id}`}
              title="Device Information"
            >
              <Info className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-7 h-7 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full p-0"
              onClick={() => onRefreshDevice(device.id)}
              data-testid={`button-refresh-${device.id}`}
              title="Refresh device info"
            >
              <RefreshCcw className="w-3 h-3" />
            </Button>
            {device.status === "using" && (
              <Button
                size="sm"
                variant="ghost"
                className="w-7 h-7 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full p-0"
                onClick={() => onRequestAccess(device.id)}
                data-testid={`button-request-${device.id}`}
              >
                <Send className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="w-7 h-7 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full p-0"
              onClick={() => onRemoveDevice(device.id)}
              data-testid={`button-remove-${device.id}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Body Content */}
        <div className={`bg-gradient-to-br ${config.bodyColor} px-6 py-4`}>
          {/* Status */}
          <div className="mb-6 flex items-center justify-between">
            <div className={`text-base font-semibold ${config.textColor}`} data-testid={`device-status-${device.id}`}>
              {device.status === "using" && "In Use"}
              {device.status === "idle" && (() => {
                if (device.usageStartTime && device.usageDuration) {
                  const [h, m] = device.usageDuration.split(":");
                  const plannedMs = (parseInt(h || '0', 10) * 60 + parseInt(m || '0', 10)) * 60 * 1000;
                  const startMs = new Date(device.usageStartTime).getTime();
                  const isFree = Date.now() - startMs >= plannedMs;
                  return isFree ? "Available" : "Not Free";
                }
                return "Available";
              })()}
              {device.status === "dnd" && "Do Not Disturb"}
            </div>
            <div className={`text-sm px-3 py-1.5 rounded-full ${config.bodyColor} border ${config.border} font-medium`}>
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>

          {/* Device Info - compact, with icons */}
          <div className="text-sm text-slate-300 space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400"><Tag className="w-3.5 h-3.5" /> Version</span>
              <span className="font-mono text-slate-200">{device.version ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400"><Clock className="w-3.5 h-3.5" /> Uptime</span>
              <span className="text-slate-200">{device.uptime ?? '-'}</span>
            </div>

            {/* Description Field */}
            {device.description && (
              <div className="flex items-start justify-between">
                <span className="flex items-center gap-2 text-slate-400"><Info className="w-3.5 h-3.5" /> Image</span>
                <span className="max-w-[200px] two-line-ellipsis text-[11px] text-right" title={device.description}>
                  {device.description}
                </span>
              </div>
            )}


          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mb-3">
            {device.status === "dnd" && (
              <div className="flex-1 bg-slate-600/30 text-slate-400 border border-slate-600/50 py-3 text-sm rounded-xl flex items-center justify-center font-medium">
                <AlertCircle className="w-4 h-4 mr-2" />
                Long Test Running
              </div>
            )}
          </div>

          {/* SSH button removed per request */}


        </div>
      </div>
    </div>
  );
}

export default function Devices() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  // Removed SSH modal state per request
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDeviceInfoModalOpen, setIsDeviceInfoModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Auto-open auth modal if coming from header
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'open') {
      setIsAuthModalOpen(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Restore auth state from localStorage on mount and keep in sync
  useEffect(() => {
    const storedUser = AuthService.getUser();
    setCurrentUser(storedUser?.username ?? null);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'device_monitor_user' || e.key === 'device_monitor_token') {
        const user = AuthService.getUser();
        setCurrentUser(user?.username ?? null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
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
      // Check if it's a 409 conflict (duplicate device) - show as warning
      if (error.message && (error.message.includes('already in use') || error.message.includes('already exists'))) {
        toast({
          title: "Device Already Exists",
          description: error.message,
          variant: "default", // Use default variant for warnings
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add device",
          variant: "destructive",
        });
      }
    },
  });

  const removeDeviceMutation = useMutation({
    mutationFn: ({ id, deletedBy }: { id: string; deletedBy?: string }) => deviceApi.delete(id, deletedBy),
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
  const handleAddDevice = async (deviceData: {
    ip: string;
    addedBy: string;
    criticality: string;
    note: string;
    usageDuration: string;
  }) => {
    await addDeviceMutation.mutateAsync(deviceData);
  };


  const handleRefreshDevice = async (deviceId: string) => {
    try {
      await deviceApi.refresh(deviceId);
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({ title: "Refreshed", description: "Device info updated" });
    } catch (e: any) {
      toast({ title: "Refresh failed", description: e?.message || "Unable to refresh device", variant: "destructive" });
    }
  };

  // Removed SSH modal opener

  const handleShowDeviceInfo = (device: Device) => {
    setSelectedDevice(device);
    setIsDeviceInfoModalOpen(true);
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await AuthService.login({ username, password });
      setCurrentUser(response.user.username);
      toast({
        title: "Success",
        description: `Welcome back, ${response.user.username}!`,
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSignup = async (username: string, password: string) => {
    try {
      const response = await AuthService.signup({ username, password });
      setCurrentUser(response.user.username);
      toast({
        title: "Success",
        description: `Account created for ${response.user.username}!`,
      });
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Account creation failed",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
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
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete devices",
        variant: "destructive",
      });
      return;
    }

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
    if (confirmationModal.deviceId && currentUser) {
      removeDeviceMutation.mutate({ 
        id: confirmationModal.deviceId, 
        deletedBy: currentUser 
      });
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
      <Header deviceStats={deviceStats} currentUser={currentUser} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          {currentUser && devices.length > 0 && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white flex items-center space-x-2 px-6 py-3 rounded-xl shadow-lg"
              data-testid="button-add-device"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Device</span>
            </Button>
          )}
        </div>

        {/* Device Grid */}
        {isLoading ? (
          <div className="text-center text-slate-400 py-20" data-testid="loading-devices">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            Loading devices...
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-20" data-testid="no-devices">
            <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-700">
              <Plus className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-300 mb-3">No devices yet</h3>
            <p className="text-slate-500 mb-8 text-lg">Start by adding your first network device</p>
            {currentUser ? (
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 text-lg rounded-xl shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Device
              </Button>
            ) : (
              <Button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 text-lg rounded-xl shadow-lg"
              >
                <User className="w-5 h-5 mr-2" />
                Sign In to Add Device
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="device-grid">
            {devices.map((device) => (
              <CreativeDeviceBox
                key={device.id}
                device={device}
                currentUser={currentUser}
                onSetDND={handleSetDND}
                onRequestAccess={handleRequestAccess}
                onRemoveDevice={handleRemoveDevice}
                onRefreshDevice={handleRefreshDevice}
                onShowDeviceInfo={handleShowDeviceInfo}
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
        currentUser={currentUser || ""}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
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

      {/* SSH modal removed */}

      <DeviceInfoModal
        isOpen={isDeviceInfoModalOpen}
        device={selectedDevice}
        onClose={() => {
          setIsDeviceInfoModalOpen(false);
          setSelectedDevice(null);
        }}
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
