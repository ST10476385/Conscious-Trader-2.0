import { AlertTriangle, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Risk Controls Panel Component
 * Displays daily loss limits, position sizing rules, and risk warnings
 */
export default function RiskControlsPanel({
  accountBalance = 0,
  dailyPnL = 0,
  dailyLossLimit = 2, // Percentage
  openPositions = 0,
  maxOpenPositions = 5,
  totalExposure = 0,
  maxExposurePercentage = 20,
  riskPerTradeLimit = 2,
  onStopAllTrades,
  onAdjustLimits,
}) {
  // Calculate metrics
  const dailyLossPercentage = accountBalance > 0 ? (Math.abs(dailyPnL) / accountBalance) * 100 : 0;
  const dailyLossLimitAmount = (dailyLossLimit / 100) * accountBalance;
  const remainingDailyRisk = dailyLossLimitAmount + dailyPnL;
  const dailyLimitExceeded = dailyPnL < -dailyLossLimitAmount;

  const exposurePercentage = accountBalance > 0 ? (totalExposure / accountBalance) * 100 : 0;
  const exposureLimitExceeded = exposurePercentage > maxExposurePercentage;

  const positionLimitExceeded = openPositions >= maxOpenPositions;

  return (
    <div className="space-y-4">
      {/* Daily Loss Limit */}
      <div className={cn(
        "bg-card border border-border rounded-xl p-5",
        dailyLimitExceeded && "border-loss/50 bg-loss/5"
      )}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Daily Loss Limit</h3>
          {dailyLimitExceeded && (
            <Badge variant="outline" className="bg-loss/10 text-loss border-loss/20">
              <AlertTriangle className="w-3 h-3 mr-1" />
              LIMIT EXCEEDED
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Today's PnL */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Today's P&L</p>
            <p className={cn(
              "text-base font-mono font-bold",
              dailyPnL >= 0 ? "text-profit" : "text-loss"
            )}>
              {dailyPnL >= 0 ? "+" : ""}{dailyPnL.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {dailyPnL >= 0 ? "+" : ""}{dailyLossPercentage.toFixed(2)}%
            </p>
          </div>

          {/* Daily Limit */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Daily Limit</p>
            <p className="text-base font-mono font-bold text-loss">
              -{dailyLossLimitAmount.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {dailyLossLimit}%
            </p>
          </div>

          {/* Remaining Risk */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Remaining</p>
            <p className={cn(
              "text-base font-mono font-bold",
              remainingDailyRisk >= 0 ? "text-foreground" : "text-loss"
            )}>
              {remainingDailyRisk >= 0 ? "+" : ""}{remainingDailyRisk.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Risk Available
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
          <div
            className={cn(
              "h-full transition-all rounded-full",
              dailyPnL >= 0
                ? "bg-primary"
                : dailyLimitExceeded
                ? "bg-loss"
                : "bg-warn"
            )}
            style={{
              width: `${Math.min(100, Math.abs((dailyPnL / dailyLossLimitAmount) * 100))}%`,
            }}
          />
        </div>

        <p className="text-[10px] text-muted-foreground">
          {dailyLimitExceeded
            ? "Daily loss limit exceeded. No new trades allowed."
            : `${((1 - Math.abs(dailyPnL) / dailyLossLimitAmount) * 100).toFixed(1)}% daily risk available`}
        </p>
      </div>

      {/* Exposure Limit */}
      <div className={cn(
        "bg-card border border-border rounded-xl p-5",
        exposureLimitExceeded && "border-warn/50 bg-warn/5"
      )}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Total Exposure</h3>
          {exposureLimitExceeded && (
            <Badge variant="outline" className="bg-warn/10 text-warn border-warn/20">
              <AlertCircle className="w-3 h-3 mr-1" />
              HIGH
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Current Exposure</p>
            <p className="text-base font-mono font-bold text-foreground">
              ${totalExposure.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {exposurePercentage.toFixed(1)}% of account
            </p>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Exposure Limit</p>
            <p className="text-base font-mono font-bold text-foreground">
              ${((maxExposurePercentage / 100) * accountBalance).toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {maxExposurePercentage}% of account
            </p>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Headroom</p>
            <p className={cn(
              "text-base font-mono font-bold",
              exposurePercentage <= maxExposurePercentage ? "text-profit" : "text-loss"
            )}>
              ${(((maxExposurePercentage / 100) * accountBalance) - totalExposure).toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Available
            </p>
          </div>
        </div>

        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all rounded-full",
              exposurePercentage <= maxExposurePercentage ? "bg-primary" : "bg-warn"
            )}
            style={{
              width: `${Math.min(100, (exposurePercentage / maxExposurePercentage) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Position Limits */}
      <div className={cn(
        "bg-card border border-border rounded-xl p-5",
        positionLimitExceeded && "border-loss/50 bg-loss/5"
      )}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Open Positions</h3>
          {positionLimitExceeded && (
            <Badge variant="outline" className="bg-loss/10 text-loss border-loss/20">
              <AlertTriangle className="w-3 h-3 mr-1" />
              LIMIT REACHED
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Open Positions</p>
            <p className={cn(
              "text-base font-mono font-bold",
              positionLimitExceeded ? "text-loss" : "text-foreground"
            )}>
              {openPositions}
            </p>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Max Allowed</p>
            <p className="text-base font-mono font-bold text-foreground">
              {maxOpenPositions}
            </p>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Remaining</p>
            <p className={cn(
              "text-base font-mono font-bold",
              maxOpenPositions - openPositions > 0 ? "text-profit" : "text-loss"
            )}>
              {Math.max(0, maxOpenPositions - openPositions)}
            </p>
          </div>
        </div>

        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all rounded-full",
              openPositions <= maxOpenPositions ? "bg-primary" : "bg-loss"
            )}
            style={{
              width: `${(openPositions / maxOpenPositions) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Risk Summary & Actions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Risk Status</h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Daily Loss Limit</span>
            <Badge variant="outline" className={cn(
              dailyLimitExceeded
                ? "bg-loss/10 text-loss border-loss/20"
                : "bg-primary/10 text-primary border-primary/20"
            )}>
              {dailyLimitExceeded ? "⛔ EXCEEDED" : "✓ OK"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Exposure Limit</span>
            <Badge variant="outline" className={cn(
              exposureLimitExceeded
                ? "bg-warn/10 text-warn border-warn/20"
                : "bg-primary/10 text-primary border-primary/20"
            )}>
              {exposureLimitExceeded ? "⚠️ HIGH" : "✓ OK"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Position Limit</span>
            <Badge variant="outline" className={cn(
              positionLimitExceeded
                ? "bg-loss/10 text-loss border-loss/20"
                : "bg-primary/10 text-primary border-primary/20"
            )}>
              {positionLimitExceeded ? "⛔ REACHED" : "✓ OK"}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          {(dailyLimitExceeded || exposureLimitExceeded || positionLimitExceeded) && (
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 h-8 text-xs"
              onClick={onStopAllTrades}
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Stop All Trades
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs"
            onClick={onAdjustLimits}
          >
            Adjust Limits
          </Button>
        </div>
      </div>
    </div>
  );
}
