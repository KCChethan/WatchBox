import { useState } from "react";
import { X, User, Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthService, { LoginCredentials, SignupCredentials } from "@/lib/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onSignup: (username: string, password: string) => Promise<void>;
}

export function AuthModal({ isOpen, onClose, onLogin, onSignup }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Username validation
    const usernameValidation = AuthService.validateUsername(username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.errors[0];
    }
    
    // Password validation
    const passwordValidation = AuthService.validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
    
    // Email validation (optional for signup)
    if (!isLogin && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await onLogin(username.trim(), password.trim());
      } else {
        await onSignup(username.trim(), password.trim());
      }
      setUsername("");
      setPassword("");
      setEmail("");
      setError("");
      setValidationErrors({});
      onClose();
    } catch (error: any) {
      setError(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUsername("");
    setPassword("");
    setEmail("");
    setError("");
    setValidationErrors({});
    onClose();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setUsername("");
    setPassword("");
    setEmail("");
    setError("");
    setValidationErrors({});
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 p-6 w-full max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-slate-50">
              {isLogin ? "Sign In" : "Sign Up"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-300 p-0 h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full pl-10 bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:border-blue-400 ${
                  validationErrors.username ? 'border-red-500' : ''
                }`}
              />
            </div>
            {validationErrors.username && (
              <p className="text-sm text-red-400 mt-1">{validationErrors.username}</p>
            )}
          </div>
          
          {!isLogin && (
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email (Optional)
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:border-blue-400 ${
                    validationErrors.email ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {validationErrors.email && (
                <p className="text-sm text-red-400 mt-1">{validationErrors.email}</p>
              )}
            </div>
          )}
          
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 bg-slate-700 border-slate-600 text-slate-50 placeholder-slate-400 focus:border-blue-400 ${
                  validationErrors.password ? 'border-red-500' : ''
                }`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 p-0 h-6 w-6"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {validationErrors.password && (
              <p className="text-sm text-red-400 mt-1">{validationErrors.password}</p>
            )}
            {!isLogin && (
              <div className="mt-2 text-xs text-slate-400">
                Password must be at least 8 characters with uppercase, lowercase, number, and special character.
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!username.trim() || !password.trim() || isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (isLogin ? "Signing In..." : "Signing Up...") : (isLogin ? "Sign In" : "Sign Up")}
            </Button>
          </div>
          
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
