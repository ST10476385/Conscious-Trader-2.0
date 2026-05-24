import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RecentTradesTable({ trades }) {
  const recentTrades = (trades || []).slice(0, 6);

  if (recentTrades.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Trades</h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">No trades yet</p>
          <p className="text-xs mt-1">Approve a signal to start trading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Recent Trades</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="pb-2 text-left font-medium">Pair</th>
              <th className="pb-2 text-left font-medium">Side</th>
              <th className="pb-2 text-right font-medium">Entry</th>
              <th className="pb-2 text-right font-medium">PnL</th>
              <th className="pb-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTrades.map((trade) => (
              <tr key={trade.id} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 font-mono font-medium text-foreground">{trade.pair}</td>
                <td className="py-2.5">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] font-mono",
                      trade.direction === "BUY" ? "border-profit/30 text-profit" : "border-loss/30 text-loss"
                    )}
                  >
                    {trade.direction}
                  </Badge>
                </td>
                <td className="py-2.5 text-right font-mono text-muted-foreground">
                  {trade.entry_price?.toFixed(trade.pair?.includes("BTC") ? 1 : 4)}
                </td>
                <td className={cn(
                  "py-2.5 text-right font-mono font-medium",
                  (trade.pnl || 0) >= 0 ? "text-profit" : "text-loss"
                )}>
                  {(trade.pnl || 0) >= 0 ? "+" : ""}{(trade.pnl || 0).toFixed(2)}
                </td>
                <td className="py-2.5 text-right">
                  <span className={cn(
                    "inline-block w-1.5 h-1.5 rounded-full",
                    trade.status === "open" ? "bg-primary animate-pulse-glow" : "bg-muted-foreground"
                  )} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}