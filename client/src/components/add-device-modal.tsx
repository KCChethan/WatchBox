import { useState } from "react";
import { X, Clock, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (deviceData: {
    ip: string;
    addedBy: string;
    criticality: string;
    note: string;
    usageDuration: string;
  }) => Promise<void>;
  currentUser: string;
}

export function AddDeviceModal({ isOpen, onClose, onAdd, currentUser }: AddDeviceModalProps) {
  const [ip, setIp] = useState("");
  const [criticality, setCriticality] = useState("testing");
  const [note, setNote] = useState("");
  const [usageDuration, setUsageDuration] = useState("02:00");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim() || !currentUser) return;

    setIsLoading(true);
    try {
      await onAdd({
        ip: ip.trim(),
        addedBy: currentUser,
        criticality,
        note: note.trim(),
        usageDuration,
      });
      setIp("");
      setCriticality("testing");
      setNote("");
      setUsageDuration("02:00");
      onClose();
    } catch (error) {
      console.error("Failed to add device:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIp("");
    setCriticality("testing");
    setNote("");
    setUsageDuration("02:00");
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

          <div>
            <Label htmlFor="device-criticality" className="block text-sm font-medium text-slate-300 mb-2">
              Criticality Level
            </Label>
            <Select value={criticality} onValueChange={setCriticality}>
              <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-slate-50 focus:border-blue-400">
                <SelectValue placeholder="Select criticality level" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 text-slate-50">
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="long run">Long Run</SelectItem>
                <SelectItem value="dnd">Do Not Disturb</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="device-duration" className="block text-sm font-medium text-slate-300 mb-2">
              <Clock className="inline w-4 h-4 mr-2" />
              Usage Duration (HH:MM)
            </Label>
            <Input
              id="device-duration"
              type="text"
              placeholder="02:00"
              value={usageDuration}
              onChange={(e) => setUsageDuration(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:border-blue-400"
              pattern="^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
            />
          </div>

          <div>
            <Label htmlFor="device-note" className="block text-sm font-medium text-slate-300 mb-2">
              <MessageSquare className="inline w-4 h-4 mr-2" />
              Note for Others
            </Label>
            <Textarea
              id="device-note"
              placeholder="Leave a note for other users..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:border-blue-400 resize-none"
              rows={3}
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              <strong>{currentUser}</strong> will use for next <strong>{usageDuration}</strong>
            </p>
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
              disabled={!ip.trim() || !currentUser || isLoading}
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
