import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { khanyisa } from "@/api/khanyisaClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Trades() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: () => khanyisa.entities.Trade.list("-created_date", 100),
  });

  const closeTrade = useMutation({
    mutationFn: async (trade) => {
      const pnl = trade.direction === "BUY"
        ? ((trade.current_price || trade.entry_price) - trade.entry_price) * (trade.position_size || 1) * 10000
        : (trade.entry_price - (trade.current_price || trade.entry_price)) * (trade.position_size || 1) * 10000;
      
      await khanyisa.entities.Trade.update(trade.id, {
        status: "closed",
        close_price: trade.current_price || trade.entry_price,
        close_reason: "manual",
        pnl: parseFloat(pnl.toFixed(2)),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Trade closed");
    },
  });

  const filtered = filter === "all" ? trades : trades.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trade Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monitor and manage your positions</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All ({trades.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({trades.filter(t => t.status === "open").length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({trades.filter(t => t.status === "closed").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">No trades found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Pair</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Side</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Entry</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">SL</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">TP</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Size</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">PnL</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((trade) => (
                  <tr key={trade.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{trade.pair}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn(
                        "font-mono text-[10px]",
                        trade.direction === "BUY" ? "text-profit border-profit/30" : "text-loss border-loss/30"
                      )}>
                        {trade.direction}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {trade.entry_price?.toFixed(trade.pair?.includes("BTC") ? 1 : 4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-loss">
                      {trade.stop_loss?.toFixed(4) || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-profit">
                      {trade.take_profit?.toFixed(4) || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {trade.position_size || "—"}
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-right font-mono text-xs font-bold",
                      (trade.pnl || 0) >= 0 ? "text-profit" : "text-loss"
                    )}>
                      {(trade.pnl || 0) >= 0 ? "+" : ""}{(trade.pnl || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        trade.status === "open" ? "text-primary border-primary/30" :
                        trade.status === "closed" ? "text-muted-foreground" :
                        "text-loss border-loss/30"
                      )}>
                        {trade.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {trade.created_date ? format(new Date(trade.created_date), "MMM d, HH:mm") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {trade.status === "open" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] text-loss border-loss/20 hover:bg-loss/10"
                          onClick={() => closeTrade.mutate(trade)}
                        >
                          <X className="w-3 h-3 mr-1" /> Close
                        </Button>
                      )}
                      {trade.close_reason && (
                        <span className="text-[10px] text-muted-foreground font-mono">{trade.close_reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}