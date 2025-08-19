import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { DeviceCard } from "@/components/device-card";
import { AddDeviceModal } from "@/components/add-device-modal";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { RequestAccessModal } from "@/components/request-access-modal";
import { NotificationToast } from "@/components/notification-toast";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { deviceApi, accessRequestApi } from "@/lib/api";
import type { Device, AccessRequest } from "@shared/schema";

export default function Dashboard() {
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
    // In a real app, you might want to mark as read instead of updating status
    updateAccessRequestMutation.mutate({ id: requestId, status: "dismissed" });
  };

  // Filter pending requests for notifications
  const pendingRequests = accessRequests.filter(req => req.status === "pending");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-inter antialiased">
      <Header deviceStats={deviceStats} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-slate-50">Device Overview</h2>
            <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1">
              <span className="text-xs text-slate-400">Last updated:</span>
              <span className="text-sm font-medium ml-1" data-testid="last-updated">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          {/* Add Device Button */}
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center space-x-2"
            data-testid="button-add-device"
          >
            <Plus className="w-4 h-4" />
            <span>Add Device</span>
          </Button>
        </div>

        {/* Device Grid */}
        {isLoading ? (
          <div className="text-center text-slate-400 py-12" data-testid="loading-devices">
            Loading devices...
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center text-slate-400 py-12" data-testid="no-devices">
            No devices found. Add your first device to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="device-grid">
            {devices.map((device) => (
              <DeviceCard
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
