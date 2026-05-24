import { AlertTriangle, TrendingUp, TrendingDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

/**
 * Trade Monitoring Dashboard Component
 * Displays open trades with real-time monitoring and alerts
 */
export default function TradeMonitoringDashboard({
  openTrades = [],
  marketPrices = {},
  onCloseTrade,
  onModifyTrade,
}) {
  if (openTrades.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Active Trades</h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <p className="text-sm">No active trades</p>
          <p className="text-xs mt-1">Execute an approved trade to start monitoring</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Active Trades ({openTrades.length})
      </h3>

      <div className="space-y-3">
        {openTrades.map((trade) => (
          <TradeMonitoringCard
            key={trade.id}
            trade={trade}
            currentPrice={marketPrices[trade.pair]}
            onCloseTrade={onCloseTrade}
            onModifyTrade={onModifyTrade}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual Trade Monitoring Card
 */
function TradeMonitoringCard({
  trade,
  currentPrice,
  onCloseTrade,
  onModifyTrade,
}) {
  if (!currentPrice) {
    return null;
  }

  // Calculate metrics
  const priceDifference = currentPrice - (trade.executionPrice || trade.entryPrice);
  const unrealizedPnL =
    trade.signal === "BUY"
      ? priceDifference * trade.positionSize
      : -priceDifference * trade.positionSize;
  const unrealizedPnLPct =
    ((unrealizedPnL / ((trade.executionPrice || trade.entryPrice) * trade.positionSize)) * 100);

  // Check stop/profit levels
  let levelStatus = null;
  let levelMessage = null;

  if (trade.signal === "BUY") {
    if (currentPrice <= trade.stopLossPrice) {
      levelStatus = "stop_loss_hit";
      levelMessage = "Stop Loss Hit";
    } else if (trade.takeProfitPrice && currentPrice >= trade.takeProfitPrice) {
      levelStatus = "take_profit_hit";
      levelMessage = "Take Profit Hit";
    }
  } else if (trade.signal === "SELL") {
    if (currentPrice >= trade.stopLossPrice) {
      levelStatus = "stop_loss_hit";
      levelMessage = "Stop Loss Hit";
    } else if (trade.takeProfitPrice && currentPrice <= trade.takeProfitPrice) {
      levelStatus = "take_profit_hit";
      levelMessage = "Take Profit Hit";
    }
  }

  // Distance to levels
  const distanceToSL = Math.abs(currentPrice - trade.stopLossPrice);
  const distanceToTP = trade.takeProfitPrice
    ? Math.abs(currentPrice - trade.takeProfitPrice)
    : null;

  // Health status
  let healthStatus = "healthy";
  if (unrealizedPnLPct < -5) {
    healthStatus = "critical";
  } else if (unrealizedPnLPct < -2) {
    healthStatus = "warning";
  } else if (unrealizedPnLPct > 5) {
    healthStatus = "profitable";
  }

  return (
    <div className={cn(
      "border border-border/50 rounded-lg p-4 transition-all duration-200",
      levelStatus === "stop_loss_hit" && "border-loss/50 bg-loss/5",
      levelStatus === "take_profit_hit" && "border-profit/50 bg-profit/5",
      healthStatus === "warning" && "border-warn/30",
      healthStatus === "critical" && "border-loss/30 bg-loss/5",
      healthStatus === "profitable" && "border-profit/30 bg-profit/5"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            trade.signal === "BUY" ? "bg-profit/10" : "bg-loss/10"
          )}>
            {trade.signal === "BUY" ? (
              <TrendingUp className="w-5 h-5 text-profit" />
            ) : (
              <TrendingDown className="w-5 h-5 text-loss" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-mono font-bold text-foreground">{trade.pair}</h4>
              <Badge variant="outline" className={cn(
                "text-[10px] font-mono h-5",
                trade.signal === "BUY" ? "bg-profit/10 text-profit border-profit/20" : "bg-loss/10 text-loss border-loss/20"
              )}>
                {trade.signal}
              </Badge>
              {levelStatus && (
                <Badge variant="outline" className="text-[10px] h-5 bg-warn/10 text-warn border-warn/20">
                  {levelMessage}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Opened: {format(new Date(trade.executedAt), "MMM d, HH:mm")}
            </p>
          </div>
        </div>
        {!levelStatus && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => onCloseTrade?.(trade.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-5 gap-2 mb-3 text-[10px]">
        <div className="bg-secondary/50 rounded p-2">
          <p className="text-muted-foreground mb-0.5">Entry</p>
          <p className="font-mono font-semibold text-foreground">
            ${(trade.executionPrice || trade.entryPrice).toFixed(4)}
          </p>
        </div>
        <div className="bg-secondary/50 rounded p-2">
          <p className="text-muted-foreground mb-0.5">Current</p>
          <p className={cn(
            "font-mono font-semibold",
            currentPrice > (trade.executionPrice || trade.entryPrice) ? "text-profit" : "text-loss"
          )}>
            ${currentPrice.toFixed(4)}
          </p>
        </div>
        <div className="bg-secondary/50 rounded p-2">
          <p className="text-muted-foreground mb-0.5">Stop Loss</p>
          <p className="font-mono font-semibold text-loss">
            ${trade.stopLossPrice.toFixed(4)}
          </p>
        </div>
        <div className="bg-secondary/50 rounded p-2">
          <p className="text-muted-foreground mb-0.5">Take Profit</p>
          <p className={cn(
            "font-mono font-semibold",
            trade.takeProfitPrice ? "text-profit" : "text-muted-foreground"
          )}>
            ${trade.takeProfitPrice?.toFixed(4) || "N/A"}
          </p>
        </div>
        <div className={cn(
          "rounded p-2",
          unrealizedPnLPct >= 0 ? "bg-profit/10" : "bg-loss/10"
        )}>
          <p className="text-muted-foreground mb-0.5">PnL</p>
          <p className={cn(
            "font-mono font-semibold",
            unrealizedPnLPct >= 0 ? "text-profit" : "text-loss"
          )}>
            {unrealizedPnLPct >= 0 ? "+" : ""}{unrealizedPnLPct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Distance to Levels */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-loss/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-loss"
              style={{
                width: `${Math.min(100, (distanceToSL / Math.abs(trade.stopLossPrice - (trade.executionPrice || trade.entryPrice))) * 100)}%`,
              }}
            />
          </div>
          <span className="text-muted-foreground">{distanceToSL.toFixed(2)} to SL</span>
        </div>
        {distanceToTP && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-profit/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-profit"
                style={{
                  width: `${Math.min(100, (distanceToTP / Math.abs((trade.takeProfitPrice || 0) - (trade.executionPrice || trade.entryPrice))) * 100)}%`,
                }}
              />
            </div>
            <span className="text-muted-foreground">{distanceToTP.toFixed(2)} to TP</span>
          </div>
        )}
      </div>

      {/* Alerts and Status */}
      {levelStatus && (
        <div className="bg-warn/10 border border-warn/20 rounded p-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-warn mb-1">{levelMessage}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px]"
                onClick={() => onModifyTrade?.(trade.id)}
              >
                Adjust
              </Button>
              <Button
                size="sm"
                className="h-6 text-[10px] bg-loss hover:bg-loss/90"
                onClick={() => onCloseTrade?.(trade.id, currentPrice)}
              >
                Close Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Health Indicator */}
      {!levelStatus && (
        <div className="flex items-center justify-between text-[10px] pt-2 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              healthStatus === "critical" ? "bg-loss animate-pulse" :
              healthStatus === "warning" ? "bg-warn animate-pulse" :
              healthStatus === "profitable" ? "bg-profit" :
              "bg-primary"
            )} />
            <span className="text-muted-foreground capitalize">{healthStatus}</span>
          </div>
          <span className="font-semibold text-muted-foreground">
            ${unrealizedPnL.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
