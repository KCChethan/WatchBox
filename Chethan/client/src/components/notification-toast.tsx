import { Send, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AccessRequest } from "@shared/schema";

interface NotificationToastProps {
  request: AccessRequest;
  onApprove: (requestId: string) => void;
  onDeny: (requestId: string) => void;
  onDismiss: (requestId: string) => void;
}

export function NotificationToast({ request, onApprove, onDeny, onDismiss }: NotificationToastProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-lg max-w-sm animate-[slide-in_0.3s_ease-out]" data-testid={`notification-${request.id}`}>
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Send className="text-blue-400 w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-50" data-testid={`notification-title-${request.id}`}>
            Access Request
          </p>
          <p className="text-xs text-slate-400 mt-1" data-testid={`notification-message-${request.id}`}>
            {request.requesterName} wants to use {request.deviceId}
          </p>
          {request.message && (
            <p className="text-xs text-slate-500 mt-1 italic" data-testid={`notification-details-${request.id}`}>
              "{request.message}"
            </p>
          )}
          <div className="flex space-x-2 mt-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-2 py-1 h-6"
              onClick={() => onApprove(request.id)}
              data-testid={`button-approve-${request.id}`}
            >
              <Check className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2 py-1 h-6"
              onClick={() => onDeny(request.id)}
              data-testid={`button-deny-${request.id}`}
            >
              <X className="w-3 h-3 mr-1" />
              Deny
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-slate-400 hover:text-slate-300 flex-shrink-0 p-0 h-4 w-4"
          onClick={() => onDismiss(request.id)}
          data-testid={`button-dismiss-${request.id}`}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
