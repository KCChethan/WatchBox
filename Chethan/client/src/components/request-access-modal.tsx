import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Device } from "@shared/schema";

interface RequestAccessModalProps {
  isOpen: boolean;
  device: Device | null;
  onClose: () => void;
  onSubmit: (deviceId: string, requesterName: string, message: string) => Promise<void>;
}

export function RequestAccessModal({ isOpen, device, onClose, onSubmit }: RequestAccessModalProps) {
  const [requesterName, setRequesterName] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !requesterName.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(device.id, requesterName.trim(), message.trim());
      setRequesterName("");
      setMessage("");
      onClose();
    } catch (error) {
      console.error("Failed to send access request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRequesterName("");
    setMessage("");
    onClose();
  };

  if (!device) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 p-6 w-full max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-slate-50">
              Request Device Access
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-300 p-0 h-6 w-6"
              data-testid="button-close-request-access"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="device-info" className="block text-sm font-medium text-slate-300 mb-2">
              Device
            </Label>
            <Input
              id="device-info"
              type="text"
              value={`${device.ip} (${device.currentUser || "Available"})`}
              className="w-full bg-slate-700 border-slate-600 text-slate-400"
              disabled
              data-testid="input-device-info"
            />
          </div>

          <div>
            <Label htmlFor="requester-name" className="block text-sm font-medium text-slate-300 mb-2">
              Your Name
            </Label>
            <Input
              id="requester-name"
              type="text"
              placeholder="Enter your name"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:border-blue-400"
              data-testid="input-requester-name"
            />
          </div>
          
          <div>
            <Label htmlFor="request-message" className="block text-sm font-medium text-slate-300 mb-2">
              Message (Optional)
            </Label>
            <Textarea
              id="request-message"
              rows={3}
              placeholder="I need to use this device for testing..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:border-blue-400 resize-none"
              data-testid="textarea-request-message"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600"
              onClick={handleClose}
              data-testid="button-cancel-request-access"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!requesterName.trim() || isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              data-testid="button-submit-request-access"
            >
              {isLoading ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
