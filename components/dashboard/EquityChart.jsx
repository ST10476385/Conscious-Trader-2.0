import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

const mockEquityData = [
  { date: "Jan", equity: 10000 },
  { date: "Feb", equity: 10250 },
  { date: "Mar", equity: 10180 },
  { date: "Apr", equity: 10520 },
  { date: "May", equity: 10380 },
  { date: "Jun", equity: 10750 },
  { date: "Jul", equity: 10900 },
  { date: "Aug", equity: 11200 },
  { date: "Sep", equity: 11050 },
  { date: "Oct", equity: 11480 },
  { date: "Nov", equity: 11320 },
  { date: "Dec", equity: 11750 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-mono font-bold text-foreground">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function EquityChart({ trades, initialBalance = 10000, currentBalance }) {
  const closedTrades = trades?.filter((t) => t.status === "closed") || [];
  const sortedTrades = closedTrades.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const data = sortedTrades.length > 0
    ? sortedTrades.reduce((acc, trade) => {
        const prev = acc.length > 0 ? acc[acc.length - 1].equity : initialBalance;
        acc.push({
          date: new Date(trade.created_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          equity: prev + (trade.pnl || 0),
        });
        return acc;
      }, [{ date: "Start", equity: initialBalance }])
    : typeof currentBalance === "number"
      ? [
          { date: "Start", equity: initialBalance },
          { date: "Now", equity: currentBalance },
        ]
      : mockEquityData;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Equity Curve</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Portfolio performance over time</p>
        </div>
        <div className="flex gap-2">
          {["1W", "1M", "3M", "ALL"].map(period => (
            <button
              key={period}
              className="px-2.5 py-1 text-[10px] font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(168, 80%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(168, 80%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
              tickFormatter={(val) => `$${(val/1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="hsl(168, 80%, 50%)"
              strokeWidth={2}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}