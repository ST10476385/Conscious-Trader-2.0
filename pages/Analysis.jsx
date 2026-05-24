import { useState } from "react";
import { khanyisa } from "@/api/khanyisaClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Loader2, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import { useOHLCData } from "@/hooks/useMarketData";

const pairs = ["EUR/USD", "GBP/USD", "BTC/USD", "ETH/USD", "USD/JPY", "AUD/USD"];

export default function Analysis() {
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [analysisData, setAnalysisData] = useState(null);
  
  // Get real OHLC data from market API
  const { data: ohlcData, isLoading: isLoadingPrice, refetch } = useOHLCData(selectedPair, '1h', 50);
  const loading = isLoadingPrice;

  // Calculate technical indicators from real OHLC data
  const calculateIndicators = (data) => {
    if (!data || data.length === 0) return null;

    const prices = data.map(d => d.close);
    
    // Calculate RSI (14 period)
    const rsi = calculateRSI(prices, 14);
    
    // Calculate Moving Averages
    const ma9 = calculateSMA(prices, 9);
    const ma21 = calculateSMA(prices, 21);
    
    // Determine trend
    const trend = ma9 > ma21 ? "bullish" : ma9 < ma21 ? "bearish" : "neutral";
    
    // Support and Resistance
    const lows = data.slice(-14).map(d => d.low);
    const highs = data.slice(-14).map(d => d.high);
    const support = Math.min(...lows);
    const resistance = Math.max(...highs);
    
    const currentPrice = prices[prices.length - 1];
    
    // Generate summary
    const summary = `${selectedPair} is trading at ${formatCurrency(currentPrice)} with a ${trend} trend. ` +
      `RSI: ${rsi.toFixed(1)}, MA9: ${ma9.toFixed(4)}, MA21: ${ma21.toFixed(4)}`;
    
    // Generate recommendation
    let recommendation = "HOLD";
    if (rsi < 30 && trend === "bullish") recommendation = "BUY";
    else if (rsi > 70 && trend === "bearish") recommendation = "SELL";
    else if (rsi < 40 && currentPrice < support) recommendation = "BUY";
    else if (rsi > 60 && currentPrice > resistance) recommendation = "SELL";
    
    return {
      current_price: currentPrice,
      rsi,
      ma9,
      ma21,
      trend,
      support,
      resistance,
      summary,
      recommendation,
      confidence: Math.min(95, 60 + Math.abs(rsi - 50) / 2),
      price_data: data.map((d, i) => ({
        period: i,
        price: d.close,
        ma9: calculateSMA(prices.slice(0, i + 1), 9),
        ma21: calculateSMA(prices.slice(0, i + 1), 21),
      })),
      rsi_data: data.map((d, i) => ({
        period: i,
        rsi: calculateRSI(prices.slice(0, i + 1), 14),
      })),
    };
  };

  // Calculate SMA
  const calculateSMA = (prices, period) => {
    if (prices.length < period) return prices[prices.length - 1];
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  };

  // Calculate RSI
  const calculateRSI = (prices, period = 14) => {
    if (prices.length < period + 1) return 50;
    
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  // Auto-calculate when OHLC data changes
  const analysis = ohlcData ? calculateIndicators(ohlcData) : analysisData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Analysis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time technical analysis with real market data</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPair} onValueChange={setSelectedPair}>
            <SelectTrigger className="w-40 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pairs.map(pair => (
                <SelectItem key={pair} value={pair}>{pair}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={refetch} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading real market data for {selectedPair}...</p>
        </div>
      )}

      {!loading && !analysis && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">Fetching market data...</p>
          <p className="text-xs mt-1">Real prices from Binance, Alpha Vantage, and other sources</p>
        </div>
      )}

      {!loading && analysis && (
        <div className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Price</p>
              <p className="text-lg font-mono font-bold text-foreground mt-1">{formatCurrency(analysis.current_price)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">RSI</p>
              <p className={cn("text-lg font-mono font-bold mt-1", 
                analysis.rsi > 70 ? "text-loss" : analysis.rsi < 30 ? "text-profit" : "text-foreground"
              )}>{analysis.rsi?.toFixed(1)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Trend</p>
              <div className="flex items-center gap-1.5 mt-1">
                <TrendingUp className={cn("w-4 h-4",
                  analysis.trend === "bullish" ? "text-profit" : analysis.trend === "bearish" ? "text-loss" : "text-warn"
                )} />
                <span className="text-sm font-medium capitalize text-foreground">{analysis.trend}</span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Support</p>
              <p className="text-sm font-mono font-bold text-profit mt-1">{analysis.support?.toFixed(4)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Resistance</p>
              <p className="text-sm font-mono font-bold text-loss mt-1">{analysis.resistance?.toFixed(4)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signal</p>
              <Badge className={cn("mt-1 font-mono",
                analysis.recommendation === "BUY" ? "bg-profit/10 text-profit border-profit/20" :
                analysis.recommendation === "SELL" ? "bg-loss/10 text-loss border-loss/20" :
                "bg-warn/10 text-warn border-warn/20"
              )} variant="outline">{analysis.recommendation}</Badge>
            </div>
          </div>

          {/* Price Chart */}
          {analysis.price_data && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Price Chart with Moving Averages</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.price_data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: 'hsl(222, 41%, 9%)', border: '1px solid hsl(222, 25%, 16%)', borderRadius: '8px', fontSize: '12px' }} />
                    {analysis.support && <ReferenceLine y={analysis.support} stroke="#22c55e" strokeDasharray="3 3" />}
                    {analysis.resistance && <ReferenceLine y={analysis.resistance} stroke="#ef4444" strokeDasharray="3 3" />}
                    <Line type="monotone" dataKey="price" stroke="hsl(210, 40%, 96%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ma9" stroke="hsl(168, 80%, 50%)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="ma21" stroke="hsl(38, 92%, 55%)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-foreground" /> Price</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-primary" /> MA9</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-warn" /> MA21</div>
              </div>
            </div>
          )}

          {/* RSI Chart */}
          {analysisData.rsi_data && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">RSI Indicator</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysisData.rsi_data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                    <Tooltip contentStyle={{ background: 'hsl(222, 41%, 9%)', border: '1px solid hsl(222, 25%, 16%)', borderRadius: '8px', fontSize: '12px' }} />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                    <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="rsi" stroke="hsl(262, 80%, 60%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
                <span>Overbought: 70+</span>
                <span>Oversold: 30-</span>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {analysisData.summary && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">AI Analysis Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{analysisData.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}