import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, className }) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-5 relative overflow-hidden group hover:border-primary/20 transition-all duration-300",
      className
    )}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1.5 font-mono">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trendValue && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              isPositive && "text-profit",
              isNegative && "text-loss",
              !isPositive && !isNegative && "text-muted-foreground"
            )}>
              <span>{isPositive ? "↑" : isNegative ? "↓" : "→"}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}