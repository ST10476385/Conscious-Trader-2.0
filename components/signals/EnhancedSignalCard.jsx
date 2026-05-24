import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, TrendingUp, TrendingDown, Minus, AlertTriangle, DollarSign, TrendingDownIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

/**
 * Enhanced SignalCard component with trade approval workflow
 * Displays trade signal with risk metrics and approval actions
 */
export default function EnhancedSignalCard({
  signal,
  onApprove,
  onReject,
  onExecute,
  showActions = true,
  showRiskMetrics = true,
  tradeStatus = null,
}) {
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const signalColor = signal.signal === "BUY" ? "profit" : signal.signal === "SELL" ? "loss" : "warn";
  const trendIcon = signal.trend === "bullish" ? TrendingUp : signal.trend === "bearish" ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  // Determine if this is a pending approval, approved, or executed trade
  const isPendingApproval = !tradeStatus || tradeStatus === "pending_approval";
  const isApproved = tradeStatus === "approved";
  const isExecuted = tradeStatus === "executed";
  const isRejected = tradeStatus === "rejected";

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all duration-300 group",
      isRejected && "opacity-60 border-loss/30",
      isApproved && "border-primary/50 bg-primary/5",
      isExecuted && "border-profit/50 bg-profit/5"
    )}>
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
        <div className="flex gap-2 items-center">
          <Badge className={cn(
            "font-mono font-bold text-xs px-3",
            signal.signal === "BUY" ? "bg-profit/10 text-profit border-profit/20" :
            signal.signal === "SELL" ? "bg-loss/10 text-loss border-loss/20" :
            "bg-warn/10 text-warn border-warn/20"
          )} variant="outline">
            {signal.signal}
          </Badge>
          {tradeStatus && (
            <Badge variant="outline" className={cn(
              "text-[10px] font-mono",
              isApproved && "bg-primary/10 text-primary border-primary/20",
              isExecuted && "bg-profit/10 text-profit border-profit/20",
              isRejected && "bg-loss/10 text-loss border-loss/20"
            )}>
              {tradeStatus.replace("_", " ").toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Confidence */}
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground mb-0.5">Confidence</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all" 
                style={{ width: `${signal.confidence || 50}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground">{signal.confidence || 50}%</span>
          </div>
        </div>

        {/* Risk Percentage */}
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground mb-0.5">Risk</p>
          <p className="text-sm font-semibold text-foreground">
            {signal.riskPercentage || 1}%
          </p>
        </div>

        {/* Entry Price */}
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground mb-0.5">Entry</p>
          <p className="text-sm font-mono font-semibold text-foreground">
            ${(signal.entryPrice || 0).toFixed(signal.pair?.includes("BTC") ? 1 : 4)}
          </p>
        </div>

        {/* Stop Loss */}
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground mb-0.5">Stop Loss</p>
          <p className="text-sm font-mono font-semibold text-loss">
            ${(signal.stopLossPrice || 0).toFixed(signal.pair?.includes("BTC") ? 1 : 4)}
          </p>
        </div>

        {/* Take Profit */}
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground mb-0.5">Take Profit</p>
          <p className="text-sm font-mono font-semibold text-profit">
            ${(signal.takeProfitPrice || 0).toFixed(signal.pair?.includes("BTC") ? 1 : 4)}
          </p>
        </div>

        {/* Risk/Reward */}
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[10px] text-muted-foreground mb-0.5">R:R Ratio</p>
          <p className="text-sm font-semibold text-foreground">
            1:{(signal.riskRewardRatio || 2).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Risk Metrics Section */}
      {showRiskMetrics && signal.riskMetrics && (
        <div className="bg-secondary/30 rounded-lg p-3 mb-4 border border-border/50">
          <p className="text-xs font-semibold text-foreground mb-2">Risk Assessment</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Potential Loss:</span>
              <span className="font-semibold text-loss">{formatCurrency(signal.riskMetrics.potentialLoss || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Potential Profit:</span>
              <span className="font-semibold text-profit">{formatCurrency(signal.riskMetrics.potentialProfit || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingDownIcon className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Position Size:</span>
              <span className="font-semibold text-foreground">{(signal.riskMetrics.positionSize || 0).toFixed(2)} units</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Market:</span>
              <span className="font-semibold text-foreground capitalize">{signal.marketCondition || "neutral"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Indicators Section */}
      {signal.indicators && (
        <div className="mb-4 border-t border-border pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Technical Indicators</p>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="bg-secondary/50 p-1.5 rounded">
              <p className="text-muted-foreground">RSI</p>
              <p className="font-semibold">{(signal.indicators.rsi || 50).toFixed(1)}</p>
            </div>
            <div className="bg-secondary/50 p-1.5 rounded">
              <p className="text-muted-foreground">SMA20</p>
              <p className="font-semibold">${(signal.indicators.sma20 || 0).toFixed(2)}</p>
            </div>
            <div className="bg-secondary/50 p-1.5 rounded">
              <p className="text-muted-foreground">SMA50</p>
              <p className="font-semibold">${(signal.indicators.sma50 || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Approval Notes */}
      {showNotes && (
        <div className="mb-4">
          <textarea
            className="w-full text-xs p-2 rounded border border-border bg-secondary/50 text-foreground placeholder-muted-foreground"
            placeholder="Add approval notes (optional)..."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            rows="2"
          />
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-2 justify-between">
          {isPendingApproval && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={() => setShowNotes(!showNotes)}
              >
                {showNotes ? "Hide Notes" : "Notes"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 h-8 text-xs"
                onClick={() => onReject?.(signal.id)}
              >
                <X className="w-3 h-3 mr-1" /> Reject
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-profit hover:bg-profit/90"
                onClick={() => onApprove?.(signal.id, approvalNotes)}
              >
                <Check className="w-3 h-3 mr-1" /> Approve
              </Button>
            </>
          )}

          {isApproved && (
            <Button
              size="sm"
              className="w-full h-8 text-xs bg-primary hover:bg-primary/90"
              onClick={() => onExecute?.(signal.id)}
            >
              Execute Trade
            </Button>
          )}

          {isExecuted && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs cursor-default"
              disabled
            >
              ✓ Executing...
            </Button>
          )}

          {isRejected && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs cursor-default"
              disabled
            >
              ✗ Rejected
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
