import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActiveSignals({ signals, onApprove, onReject }) {
  const pendingSignals = (signals || []).filter(s => s.status === "pending").slice(0, 3);

  if (pendingSignals.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Pending Signals</h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <span className="text-lg">📡</span>
          </div>
          <p className="text-sm">No pending signals</p>
          <p className="text-xs mt-1">Generate new signals from Analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Pending Signals</h3>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
          {pendingSignals.length} pending
        </Badge>
      </div>
      <div className="space-y-3">
        {pendingSignals.map((signal) => (
          <div key={signal.id} className="border border-border rounded-lg p-3 hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-foreground">{signal.pair}</span>
                <Badge className={cn(
                  "text-[10px] font-mono",
                  signal.signal === "BUY" ? "bg-profit/10 text-profit border-profit/20" :
                  signal.signal === "SELL" ? "bg-loss/10 text-loss border-loss/20" :
                  "bg-warn/10 text-warn border-warn/20"
                )} variant="outline">
                  {signal.signal}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {((signal.confidence || 0) * 100).toFixed(0)}% conf
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground mb-3">
              <div>
                <span className="block text-foreground font-mono">{signal.entry?.toFixed(4)}</span>
                Entry
              </div>
              <div>
                <span className="block text-loss font-mono">{signal.stop_loss?.toFixed(4)}</span>
                Stop Loss
              </div>
              <div>
                <span className="block text-profit font-mono">{signal.take_profit?.toFixed(4)}</span>
                Take Profit
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs bg-profit/10 text-profit hover:bg-profit/20 border border-profit/20"
                variant="outline"
                onClick={() => onApprove(signal)}
              >
                <Check className="w-3 h-3 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-xs bg-loss/10 text-loss hover:bg-loss/20 border border-loss/20"
                variant="outline"
                onClick={() => onReject(signal)}
              >
                <X className="w-3 h-3 mr-1" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}