import { useQuery } from "@tanstack/react-query";
import { khanyisa } from "@/api/khanyisaClient";
import { Shield, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function Risk() {
  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: () => khanyisa.entities.Trade.list("-created_date", 100),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => khanyisa.entities.TradingSettings.list(),
  });

  const s = settings[0] || { current_balance: 10000, initial_balance: 10000, max_risk_per_trade: 2, max_daily_loss: 5, max_open_trades: 3 };
  const openTrades = trades.filter(t => t.status === "open");
  const closedTrades = trades.filter(t => t.status === "closed");
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const todayTrades = closedTrades.filter(t => {
    const d = new Date(t.created_date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const todayPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const dailyLossPercent = Math.abs(Math.min(todayPnL, 0)) / (s.current_balance || 10000) * 100;
  const openRatio = openTrades.length / (s.max_open_trades || 3) * 100;
  const drawdown = s.initial_balance > 0 ? Math.max(0, (s.initial_balance - (s.current_balance || s.initial_balance)) / s.initial_balance * 100) : 0;

  const winCount = closedTrades.filter(t => (t.pnl || 0) > 0).length;
  const lossCount = closedTrades.filter(t => (t.pnl || 0) <= 0).length;
  const avgWin = winCount > 0 ? closedTrades.filter(t => (t.pnl || 0) > 0).reduce((s, t) => s + t.pnl, 0) / winCount : 0;
  const avgLoss = lossCount > 0 ? Math.abs(closedTrades.filter(t => (t.pnl || 0) <= 0).reduce((s, t) => s + t.pnl, 0) / lossCount) : 0;
  const profitFactor = avgLoss > 0 ? (avgWin * winCount) / (avgLoss * lossCount) : 0;

  const riskChecks = [
    {
      label: "Daily loss within limit",
      status: dailyLossPercent < (s.max_daily_loss || 5),
      detail: `${dailyLossPercent.toFixed(1)}% / ${s.max_daily_loss || 5}% max`
    },
    {
      label: "Open positions within limit",
      status: openTrades.length <= (s.max_open_trades || 3),
      detail: `${openTrades.length} / ${s.max_open_trades || 3} max`
    },
    {
      label: "All trades have stop loss",
      status: openTrades.every(t => t.stop_loss),
      detail: `${openTrades.filter(t => t.stop_loss).length} / ${openTrades.length} have SL`
    },
    {
      label: "Drawdown acceptable",
      status: drawdown < 10,
      detail: `${drawdown.toFixed(1)}% drawdown`
    },
  ];

  const allGood = riskChecks.every(c => c.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Risk Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Protect your capital</p>
        </div>
        <Badge className={cn(
          "text-sm px-4 py-1.5",
          allGood ? "bg-profit/10 text-profit border-profit/20" : "bg-loss/10 text-loss border-loss/20"
        )} variant="outline">
          <Shield className="w-4 h-4 mr-2" />
          {allGood ? "All Clear" : "Warnings Active"}
        </Badge>
      </div>

      {/* Risk Checks */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Risk Checks</h3>
        <div className="space-y-3">
          {riskChecks.map((check, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                {check.status ? (
                  <CheckCircle className="w-4 h-4 text-profit" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-loss" />
                )}
                <span className="text-sm text-foreground">{check.label}</span>
              </div>
              <span className={cn("text-xs font-mono", check.status ? "text-muted-foreground" : "text-loss")}>
                {check.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Loss</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Used</span>
              <span className="font-mono text-foreground">{dailyLossPercent.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(dailyLossPercent / (s.max_daily_loss || 5) * 100, 100)} className="h-2" />
            <p className="text-[10px] text-muted-foreground">Max daily loss: {s.max_daily_loss || 5}%</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Position Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Open</span>
              <span className="font-mono text-foreground">{openTrades.length} / {s.max_open_trades || 3}</span>
            </div>
            <Progress value={openRatio} className="h-2" />
            <p className="text-[10px] text-muted-foreground">Max open trades: {s.max_open_trades || 3}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Drawdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Current</span>
              <span className="font-mono text-foreground">{drawdown.toFixed(1)}%</span>
            </div>
            <Progress value={drawdown * 10} className="h-2" />
            <p className="text-[10px] text-muted-foreground">Warning at 10%</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Profit Factor</h3>
          <div className="space-y-3">
            <p className="text-3xl font-mono font-bold text-foreground">{profitFactor.toFixed(2)}</p>
            <div className="flex gap-4 text-xs">
              <span className="text-profit">Avg Win: ${avgWin.toFixed(2)}</span>
              <span className="text-loss">Avg Loss: ${avgLoss.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Target: above 1.5</p>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Performance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Trades</p>
            <p className="text-xl font-mono font-bold text-foreground mt-1">{closedTrades.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</p>
            <p className="text-xl font-mono font-bold text-foreground mt-1">
              {closedTrades.length > 0 ? (winCount / closedTrades.length * 100).toFixed(1) : "0.0"}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total PnL</p>
            <p className={cn("text-xl font-mono font-bold mt-1", totalPnL >= 0 ? "text-profit" : "text-loss")}>
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Today PnL</p>
            <p className={cn("text-xl font-mono font-bold mt-1", todayPnL >= 0 ? "text-profit" : "text-loss")}>
              {todayPnL >= 0 ? "+" : ""}${todayPnL.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}