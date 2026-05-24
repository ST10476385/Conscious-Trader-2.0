import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function SignalCard({ signal, onApprove, onReject, onSendToMT5, isSending = false, showActions = true }) {
  const signalColor = signal.signal === "BUY" ? "profit" : signal.signal === "SELL" ? "loss" : "warn";
  const trendIcon = signal.trend === "bullish" ? TrendingUp : signal.trend === "bearish" ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            signal.signal === "BUY" ? "bg-profit/10" : signal.signal === "SELL" ? "bg-loss/10" : "bg-warn/10"
          )}>
            <TrendIcon className={cn(
              "w-5 h-5",
              signal.signal === "BUY" ? "text-profit" : signal.signal === "SELL" ? "text-loss" : "text-warn"
            )} />
          </div>
          <div>
            <h3 className="font-mono font-bold text-foreground">{signal.pair}</h3>
            <p className="text-[10px] text-muted-foreground">
              {signal.created_date ? format(new Date(signal.created_date), "MMM d, HH:mm") : "Just now"}
            </p>
          </div>
        </div>
        <Badge className={cn(
          "font-mono font-bold text-xs px-3",
          signal.signal === "BUY" ? "bg-profit/10 text-profit border-profit/20" :
          signal.signal === "SELL" ? "bg-loss/10 text-loss border-loss/20" :
          "bg-warn/10 text-warn border-warn/20"
        )} variant="outline">
          {signal.signal}
        </Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground mb-0.5">Confidence</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all" 
                style={{ width: `${(signal.confidence || 0) * 100}%` }} 
              />
            </div>
            <span className="text-xs font-mono font-bold text-foreground">
              {((signal.confidence || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground mb-0.5">Risk Score</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  (signal.risk_score || 0) > 0.7 ? "bg-loss" : (signal.risk_score || 0) > 0.4 ? "bg-warn" : "bg-profit"
                )}
                style={{ width: `${(signal.risk_score || 0) * 100}%` }} 
              />
            </div>
            <span className="text-xs font-mono font-bold text-foreground">
              {((signal.risk_score || 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Levels */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Entry</p>
          <p className="font-mono text-sm font-bold text-foreground">{signal.entry?.toFixed(4) || "—"}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Stop Loss</p>
          <p className="font-mono text-sm font-bold text-loss">{signal.stop_loss?.toFixed(4) || "—"}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Take Profit</p>
          <p className="font-mono text-sm font-bold text-profit">{signal.take_profit?.toFixed(4) || "—"}</p>
        </div>
      </div>

      {/* Indicators */}
      {(signal.rsi || signal.ma9 || signal.ma21) && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {signal.rsi && (
            <Badge variant="outline" className="text-[10px] font-mono">
              RSI: {signal.rsi.toFixed(1)}
            </Badge>
          )}
          {signal.ma9 && (
            <Badge variant="outline" className="text-[10px] font-mono">
              MA9: {signal.ma9.toFixed(4)}
            </Badge>
          )}
          {signal.ma21 && (
            <Badge variant="outline" className="text-[10px] font-mono">
              MA21: {signal.ma21.toFixed(4)}
            </Badge>
          )}
          {signal.trend && (
            <Badge variant="outline" className={cn(
              "text-[10px] font-mono",
              signal.trend === "bullish" ? "text-profit border-profit/30" :
              signal.trend === "bearish" ? "text-loss border-loss/30" :
              "text-warn border-warn/30"
            )}>
              {signal.trend}
            </Badge>
          )}
        </div>
      )}

      {/* Reasoning */}
      {signal.reasoning && (
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{signal.reasoning}</p>
      )}

      {/* Decision Score Breakdown */}
      {signal.reasoning && signal.reasoning.includes('Final Score:') && (
        <div className="bg-secondary/30 rounded-lg p-3 mb-4">
          <p className="text-[10px] font-semibold text-foreground mb-2">Decision Engine Breakdown</p>
          <div className="space-y-1">
            {signal.reasoning.split('. ').map((part, index) => {
              if (part.includes('engine:') || part.includes('Final Score:')) {
                const [engine, score] = part.split(' (');
                const scoreValue = score ? score.replace(')', '') : '';
                return (
                  <div key={index} className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground">{engine.replace(' engine:', '').replace('Final Score:', 'Total')}</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] px-1.5 py-0.5",
                      scoreValue.startsWith('+') ? "text-profit border-profit/30" :
                      scoreValue.startsWith('-') ? "text-loss border-loss/30" :
                      "text-muted-foreground"
                    )}>
                      {scoreValue}
                    </Badge>
                  </div>
                );
              }
              return null;
            }).filter(Boolean)}
          </div>
        </div>
      )}

      {/* Risk Warning */}
      {(signal.risk_score || 0) > 0.7 && (
        <div className="flex items-center gap-2 p-2 bg-loss/5 rounded-lg mb-4 border border-loss/10">
          <AlertTriangle className="w-3.5 h-3.5 text-loss flex-shrink-0" />
          <p className="text-[10px] text-loss">High risk signal — proceed with caution</p>
        </div>
      )}

      {/* Actions */}
      {showActions && signal.status === "pending" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-profit/10 text-profit hover:bg-profit/20 border border-profit/20"
            variant="outline"
            onClick={() => onApprove(signal)}
          >
            <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-loss/10 text-loss hover:bg-loss/20 border border-loss/20"
            variant="outline"
            onClick={() => onReject(signal)}
          >
            <X className="w-3.5 h-3.5 mr-1.5" /> Reject
          </Button>
        </div>
      )}

      {showActions && signal.status === "approved" && onSendToMT5 && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            variant="outline"
            onClick={() => onSendToMT5(signal)}
            disabled={isSending}
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Sending
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-3.5 h-3.5" /> Send to MT5
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Status badge for non-pending */}
      {signal.status && signal.status !== "pending" && (
        <Badge className={cn(
          "w-full justify-center text-xs py-1",
          signal.status === "approved" ? "bg-profit/10 text-profit border-profit/20" :
          signal.status === "rejected" ? "bg-loss/10 text-loss border-loss/20" :
          "bg-muted text-muted-foreground"
        )} variant="outline">
          {signal.status.toUpperCase()}
        </Badge>
      )}
    </div>
  );
}