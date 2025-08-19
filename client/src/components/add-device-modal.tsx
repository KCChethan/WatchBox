import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ip: string) => Promise<void>;
}

export function AddDeviceModal({ isOpen, onClose, onAdd }: AddDeviceModalProps) {
  const [ip, setIp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;

    setIsLoading(true);
    try {
      await onAdd(ip.trim());
      setIp("");
      onClose();
    } catch (error) {
      console.error("Failed to add device:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIp("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 p-6 w-full max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-slate-50">
              Add New Device
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-300 p-0 h-6 w-6"
              data-testid="button-close-add-device"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="device-ip" className="block text-sm font-medium text-slate-300 mb-2">
              IP Address
            </Label>
            <Input
              id="device-ip"
              type="text"
              placeholder="e.g., 10.141.1.35"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:border-blue-400"
              data-testid="input-device-ip"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600"
              onClick={handleClose}
              data-testid="button-cancel-add-device"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!ip.trim() || isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              data-testid="button-submit-add-device"
            >
              {isLoading ? "Adding..." : "Add Device"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
