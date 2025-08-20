import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Play, X, RefreshCw } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

interface SSHSessionModalProps {
  deviceId: string;
  deviceIp: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SSHCommand {
  id: string;
  command: string;
  output: string;
  error?: string;
  timestamp: Date;
  executionTime: number;
}

interface SSHSession {
  id: string;
  deviceId: string;
  ip: string;
  username: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  commands: SSHCommand[];
}

export function SSHSessionModal({ deviceId, deviceIp, isOpen, onClose }: SSHSessionModalProps) {
  const [session, setSession] = useState<SSHSession | null>(null);
  const [command, setCommand] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.type === 'ssh_session_created' && lastMessage.data.deviceId === deviceId) {
      setSession(lastMessage.data);
      setIsConnecting(false);
      toast({
        title: "SSH Session Created",
        description: `Connected to ${deviceIp}`,
      });
    }

    if (lastMessage?.type === 'ssh_command_executed' && session && lastMessage.data.session.id === session.id) {
      setSession(lastMessage.data.session);
      setIsExecuting(false);
    }

    if (lastMessage?.type === 'ssh_session_closed' && session && lastMessage.data.sessionId === session.id) {
      setSession(null);
      toast({
        title: "SSH Session Closed",
        description: `Disconnected from ${deviceIp}`,
      });
    }
  }, [lastMessage, deviceId, deviceIp, session, toast]);

  const createSession = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/ssh/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, ip: deviceIp }),
      });

      if (!response.ok) {
        throw new Error("Failed to create SSH session");
      }

      const sessionData = await response.json();
      setSession(sessionData);
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not establish SSH connection",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const executeCommand = async () => {
    if (!command.trim() || !session) return;

    setIsExecuting(true);
    try {
      const response = await fetch(`/api/ssh/sessions/${session.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to execute command");
      }

      setCommand("");
    } catch (error) {
      toast({
        title: "Command Failed",
        description: "Could not execute command",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const closeSession = async () => {
    if (!session) return;

    try {
      await fetch(`/api/ssh/sessions/${session.id}`, {
        method: "DELETE",
      });
      setSession(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to close session",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg w-4/5 h-4/5 max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold text-white">
              SSH Session - {deviceIp}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {!session ? (
            <div className="flex-1 flex items-center justify-center">
              <Button 
                onClick={createSession} 
                disabled={isConnecting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4 mr-2" />
                    Connect via SSH
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Session Info */}
              <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Connected as: {session.username}</span>
                  <span>Started: {new Date(session.startTime).toLocaleTimeString()}</span>
                  <span>Last Activity: {new Date(session.lastActivity).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Command Input */}
              <div className="flex space-x-2 mb-4">
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Enter command (e.g., ls -la, pwd, whoami)"
                  className="flex-1 bg-slate-800 border-slate-600 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
                />
                <Button 
                  onClick={executeCommand} 
                  disabled={!command.trim() || isExecuting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isExecuting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button 
                  onClick={closeSession}
                  variant="destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Command History */}
              <ScrollArea className="flex-1 bg-slate-800 rounded-lg p-4">
                <div className="space-y-4">
                  {session.commands.map((cmd) => (
                    <Card key={cmd.id} className="bg-slate-700 border-slate-600">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-300 flex items-center justify-between">
                          <span className="font-mono">$ {cmd.command}</span>
                          <span className="text-xs text-slate-400">
                            {new Date(cmd.timestamp).toLocaleTimeString()} 
                            ({cmd.executionTime}ms)
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {cmd.output && (
                          <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                            {cmd.output}
                          </pre>
                        )}
                        {cmd.error && (
                          <pre className="text-red-400 text-sm font-mono whitespace-pre-wrap">
                            {cmd.error}
                          </pre>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
