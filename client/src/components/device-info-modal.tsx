import { useState, useEffect } from "react";
import { X, User, Clock, MessageSquare, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Device } from "@shared/schema";

interface DeviceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export function DeviceInfoModal({ isOpen, onClose, device }: DeviceInfoModalProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !device?.usageStartTime) return;

    const updateTimer = () => {
      const startTime = new Date(device.usageStartTime).getTime();
      const now = Date.now();
      const elapsed = now - startTime;
      
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
      
      setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isOpen, device?.usageStartTime]);

  // Determine if device is free based on elapsed vs planned duration
  const isFreeByTimer = (() => {
    if (!device?.usageStartTime || !device?.usageDuration) return true;
    const startTime = new Date(device.usageStartTime).getTime();
    const [h, m] = device.usageDuration.split(":");
    const plannedMs = (parseInt(h || '0', 10) * 60 + parseInt(m || '0', 10)) * 60 * 1000;
    return Date.now() - startTime >= plannedMs;
  })();

  if (!isOpen || !device) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleString();
  };

  const getCriticalityColor = (criticality: string | null) => {
    switch (criticality) {
      case 'long run': return 'text-orange-400';
      case 'dnd': return 'text-red-400';
      default: return 'text-green-400';
    }
  };

  const getCriticalityIcon = (criticality: string | null) => {
    switch (criticality) {
      case 'long run': return <Clock className="w-4 h-4" />;
      case 'dnd': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800/95 border-slate-700 p-5 w-full max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-lg font-semibold text-slate-50">
              Device Information
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300 p-0 h-7 w-7"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Device IP */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-400 mb-2">{device.ip}</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                device.isOnline === 1 ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}></div>
              <span className="text-sm text-slate-300">
                {device.isOnline === 1 ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-slate-700/50 rounded-lg p-4 grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-400" />
              <h4 className="text-sm font-semibold text-slate-200">Added By</h4>
            </div>
            <p className="text-blue-400 font-medium col-span-2">{device.addedBy || 'Unknown'}</p>
          </div>

          {/* Criticality Level */}
          <div className="bg-slate-700/50 rounded-lg p-4 grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              {getCriticalityIcon(device.criticality)}
              <h4 className="text-sm font-semibold text-slate-200">Criticality</h4>
            </div>
            <p className={`font-medium col-span-2 ${getCriticalityColor(device.criticality)}`}>
              {device.criticality || 'testing'}
            </p>
          </div>

          {/* Usage Timer */}
          {device.usageStartTime && device.usageDuration && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-green-400" />
                <h4 className="text-sm font-semibold text-slate-200">Usage Timer</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Started:</span>
                  <span className="text-slate-300">{formatDate(device.usageStartTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Elapsed:</span>
                  <span className="text-green-400 font-mono text-base">{elapsedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Planned Duration:</span>
                  <span className="text-slate-300">{device.usageDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Will use for next:</span>
                  <span className="text-orange-400 font-mono text-base">
                    {(() => {
                      const plannedHours = parseInt(device.usageDuration.split(':')[0]);
                      const plannedMinutes = parseInt(device.usageDuration.split(':')[1]);
                      const plannedTotal = plannedHours * 60 + plannedMinutes;
                      
                      const elapsedHours = parseInt(elapsedTime.split(':')[0]);
                      const elapsedMinutes = parseInt(elapsedTime.split(':')[1]);
                      const elapsedTotal = elapsedHours * 60 + elapsedMinutes;
                      
                      const remaining = plannedTotal - elapsedTotal;
                      
                      if (remaining <= 0) {
                        return <span className="text-red-400">Time exceeded</span>;
                      }
                      
                      const remainingHours = Math.floor(remaining / 60);
                      const remainingMinutes = remaining % 60;
                      return `${remainingHours.toString().padStart(2, '0')}h:${remainingMinutes.toString().padStart(2, '0')}m`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Note for Others */}
          {device.note && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="w-5 h-5 text-yellow-400" />
                <h4 className="text-md font-semibold text-slate-200">Note for Others</h4>
              </div>
              <p className="text-slate-300 italic">"{device.note}"</p>
            </div>
          )}

          {/* Current Status */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h4 className="text-sm font-semibold text-slate-200">Current Status</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`font-medium ${
                  device.status === 'using' ? 'text-red-400' :
                  device.status === 'dnd' ? 'text-orange-400' :
                  (!isFreeByTimer ? 'text-yellow-400' : 'text-green-400')
                }`}>
                  {device.status === "using" && "In Use"}
                  {device.status === "idle" && (!isFreeByTimer ? "Not Free" : "Available")}
                  {device.status === "dnd" && "Do Not Disturb"}
                </span>
              </div>
              {device.currentUser && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Current User:</span>
                  <span className="text-slate-300">{device.currentUser}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Last Updated:</span>
                <span className="text-slate-300">{formatDate(device.lastUpdated)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
