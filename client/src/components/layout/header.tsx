import { Link, useLocation } from "wouter";
import { Server, Activity, List, Settings } from "lucide-react";

interface HeaderProps {
  deviceStats: {
    total: number;
    online: number;
    inUse: number;
  };
}

export function Header({ deviceStats }: HeaderProps) {
  const [location] = useLocation();

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500 rounded-lg p-2">
              <Server className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold text-slate-50">Device Monitor</h1>
          </div>
          
          {/* Compact Statistics */}
          <div className="flex items-center space-x-6">
            {/* Total Devices */}
            <div className="bg-slate-800 border border-slate-600 backdrop-blur-[10px] rounded-full px-3 py-1 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium" data-testid="stat-total">{deviceStats.total}</span>
              <span className="text-xs text-slate-400">Total</span>
            </div>
            
            {/* Online */}
            <div className="bg-slate-800 border border-slate-600 backdrop-blur-[10px] rounded-full px-3 py-1 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_theme(colors.emerald.500)] animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-400" data-testid="stat-online">{deviceStats.online}</span>
              <span className="text-xs text-slate-400">Online</span>
            </div>
            
            {/* In Use */}
            <div className="bg-slate-800 border border-slate-600 backdrop-blur-[10px] rounded-full px-3 py-1 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_theme(colors.red.500)] animate-pulse"></div>
              <span className="text-sm font-medium text-red-400" data-testid="stat-in-use">{deviceStats.inUse}</span>
              <span className="text-xs text-slate-400">In Use</span>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <Link href="/">
              <button className={`px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-2 ${
                location === "/" 
                  ? "text-blue-400 border-b-2 border-blue-400" 
                  : "text-slate-400 hover:text-slate-50"
              }`} data-testid="nav-dashboard">
                <Activity className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </Link>
            <Link href="/devices">
              <button className={`px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-2 ${
                location === "/devices" 
                  ? "text-blue-400 border-b-2 border-blue-400" 
                  : "text-slate-400 hover:text-slate-50"
              }`} data-testid="nav-devices">
                <List className="w-4 h-4" />
                <span>Devices</span>
              </button>
            </Link>
            <button className="text-slate-400 hover:text-slate-50 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-2" data-testid="nav-settings">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
