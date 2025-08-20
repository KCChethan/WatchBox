import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isLoading = false 
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="bg-slate-800 border-slate-700 p-6 w-full max-w-sm">
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="text-red-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-50" data-testid="confirmation-title">
            {title}
          </h3>
          <p className="text-sm text-slate-400 mt-2" data-testid="confirmation-message">
            {message}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="button-cancel-confirmation"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="button-confirm-action"
          >
            {isLoading ? "Removing..." : "Remove"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
