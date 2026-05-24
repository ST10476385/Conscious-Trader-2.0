import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import backendClient from "@/api/backendClient";
import { khanyisa } from "@/api/khanyisaClient";
import { Wallet, TrendingUp, BarChart3, Shield, Activity } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import EquityChart from "@/components/dashboard/EquityChart";
import RecentTradesTable from "@/components/dashboard/RecentTradesTable";
import ActiveSignals from "@/components/dashboard/ActiveSignals";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: () => khanyisa.entities.Trade.list("-created_date", 50),
  });

  const { data: signals = [] } = useQuery({
    queryKey: ["signals"],
    queryFn: () => khanyisa.entities.TradeSignal.list("-created_date", 20),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => khanyisa.entities.TradingSettings.list(),
  });

  const { data: mt5AccountData, error: mt5Error, isFetching: mt5Loading } = useQuery({
    queryKey: ["mt5Account"],
    queryFn: () => backendClient.mt5.getAccount(),
    retry: false,
    staleTime: 10000,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const currentSettings = settings[0] || { current_balance: 10000, initial_balance: 10000, mode: "paper" };
  const hasMT5Account = Boolean(mt5AccountData?.account);
  const dashboardMode = hasMT5Account ? "demo" : currentSettings.mode || "paper";
  const dashboardBalance = hasMT5Account ? mt5AccountData.account.balance : currentSettings.current_balance || 10000;
  const dashboardSubtitle = hasMT5Account
    ? `MT5 demo account (${mt5AccountData.account.server})`
    : mt5Error
      ? `MT5 bridge unavailable — ${mt5Error.message}`
      : undefined;

  const openTrades = trades.filter((t) => (t).status === "open");
  const closedTrades = trades.filter((t) => (t).status === "closed");
  const totalPnL = closedTrades.reduce((sum, t) => sum + ((t).pnl || 0), 0);
  const winRate = closedTrades.length > 0
    ? (closedTrades.filter((t) => ((t).pnl || 0) > 0).length / closedTrades.length * 100).toFixed(1)
    : "0.0";

  const approveSignal = useMutation({
    mutationFn: async (signal) => {
      await khanyisa.entities.TradeSignal.update(signal.id, { status: "approved" });
      await khanyisa.entities.Trade.create({
        pair: signal.pair,
        direction: signal.signal,
        entry_price: signal.entry,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        confidence: signal.confidence,
        risk_score: signal.risk_score,
        status: "open",
        position_size: 0.01,
        mode: currentSettings.mode || "paper",
      });
      return signal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success("Trade opened from signal");
    },
  });

  const rejectSignal = useMutation({
    mutationFn: (signal) => {
      return khanyisa.entities.TradeSignal.update(signal.id, { status: "rejected" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.info("Signal rejected");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Trading overview — <span className="text-primary font-mono text-xs">{dashboardMode.toUpperCase()} MODE</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-profit animate-pulse-glow" />
          <span className="text-xs text-muted-foreground">Markets Open</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Balance"
          value={formatCurrency(dashboardBalance)}
          icon={Wallet}
          subtitle={dashboardSubtitle}
          trend={totalPnL >= 0 ? "up" : "down"}
          trendValue={`${totalPnL >= 0 ? "+" : ""}${formatCurrency(totalPnL)}`}
        />
        <StatCard
          title="Open Trades"
          value={openTrades.length}
          subtitle={`of ${currentSettings.max_open_trades || 3} max`}
          icon={Activity}
        />
        <StatCard
          title="Win Rate"
          value={`${winRate}%`}
          subtitle={`${closedTrades.length} closed trades`}
          icon={BarChart3}
          trend={parseFloat(winRate) >= 50 ? "up" : "down"}
          trendValue={`${closedTrades.filter(t => (t.pnl || 0) > 0).length}W / ${closedTrades.filter(t => (t.pnl || 0) <= 0).length}L`}
        />
        <StatCard
          title="Risk Level"
          value={`${currentSettings.max_risk_per_trade || 2}%`}
          subtitle="per trade limit"
          icon={Shield}
        />
      </div>

      {/* Charts & Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EquityChart
            trades={trades}
            initialBalance={currentSettings.initial_balance || 10000}
            currentBalance={dashboardBalance}
          />
        </div>
        <ActiveSignals
          signals={signals}
          onApprove={(s) => approveSignal.mutate(s)}
          onReject={(s) => rejectSignal.mutate(s)}
        />
      </div>

      {/* Recent Trades */}
      <RecentTradesTable trades={trades} />
    </div>
  );
}