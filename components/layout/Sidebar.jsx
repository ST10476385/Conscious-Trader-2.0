import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Zap, 
  TrendingUp, 
  Newspaper, 
  Settings, 
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
  Plug
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import backendClient from "@/api/backendClient";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Zap, label: "Signals", path: "/signals" },
  { icon: TrendingUp, label: "Trades", path: "/trades" },
  { icon: BarChart3, label: "Analysis", path: "/analysis" },
  { icon: Newspaper, label: "News", path: "/news" },
  { icon: Shield, label: "Risk", path: "/risk" },
  { icon: Plug, label: "Integrations", path: "/integrations" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const { data: mt5AccountData, error: mt5Error, isFetching: mt5Loading } = useQuery({
    queryKey: ["sidebarMt5Account"],
    queryFn: () => backendClient.mt5.getAccount(),
    retry: false,
    staleTime: 10000,
  });

  const sidebarModeText = mt5AccountData?.account
    ? `MT5 DEMO (${mt5AccountData.account.server})`
    : mt5Error
      ? "MT5 ERROR"
      : mt5Loading
        ? "MT5 LOADING..."
        : "PAPER MODE";

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-foreground text-sm tracking-tight">Conscious Trader</h1>
            <p className="text-[10px] text-muted-foreground font-mono">v1.0 • {sidebarModeText}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}