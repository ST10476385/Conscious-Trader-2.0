import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import backendClient from "@/api/backendClient";
import { khanyisa } from "@/api/khanyisaClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Loader2 } from "lucide-react";
import SignalCard from "@/components/signals/SignalCard";
import { useMarketData } from "@/hooks/useMarketData";
import { generateVerifiedSignal, generateTradeSignal } from "@/services/tradeAnalysisEngine";
import { useState } from "react";
import { toast } from "sonner";

export default function Signals() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [generating, setGenerating] = useState(false);
  const pairs = ["EUR/USD", "GBP/USD", "BTC/USD", "ETH/USD", "USD/JPY"];
  const [selectedPair, setSelectedPair] = useState(pairs[0]);

  const marketData = useMarketData(selectedPair, "1h");

  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["signals"],
    queryFn: () => khanyisa.entities.TradeSignal.list("-created_date", 100),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => khanyisa.entities.TradingSettings.list(),
  });

  const currentSettings = settings[0] || { mode: "paper" };
  const [sendingSignalId, setSendingSignalId] = useState(null);
  const hasOHLC = Array.isArray(marketData.ohlcData) && marketData.ohlcData.length > 0;

  const generateSignal = async () => {
    setGenerating(true);

    try {
      if (marketData.isLoading) {
        toast.error("Waiting for market data to load before generating a signal.");
        return;
      }

      if (!marketData.ohlcData || marketData.ohlcData.length === 0) {
        toast.error(`No OHLC data available for ${selectedPair}.`);
        return;
      }

      let result = generateVerifiedSignal(selectedPair, marketData.ohlcData, marketData.news || []);
      console.debug("Signal engine result", { pair: selectedPair, ohlcLength: marketData.ohlcData.length, result });
      if (!result) {
        const closes = marketData.ohlcData.map((candle) => candle.close).filter((v) => typeof v === 'number');
        console.debug("Fallback to generateTradeSignal", { closesLength: closes.length });
        const fallback = generateTradeSignal({ closes });
        if (fallback) {
          const currentPrice = fallback.currentPrice || closes[closes.length - 1];
          const rangeMultiplier = selectedPair.includes('BTC') || selectedPair.includes('ETH') ? 0.015 : 0.01;
          const stopPct = rangeMultiplier * 0.5;
          result = {
            ...fallback,
            entry: currentPrice,
            stop_loss: fallback.signal === 'BUY'
              ? currentPrice * (1 - stopPct)
              : fallback.signal === 'SELL'
                ? currentPrice * (1 + stopPct)
                : currentPrice,
            take_profit: fallback.signal === 'BUY'
              ? currentPrice * (1 + rangeMultiplier)
              : fallback.signal === 'SELL'
                ? currentPrice * (1 - rangeMultiplier)
                : currentPrice,
            risk_score: 0.5,
            reasoning: `Fallback trade signal generated for ${selectedPair}.`,
          };
        }
      }

      if (!result) {
        toast.error("Could not generate a verified signal for current market conditions.");
        return;
      }

      await khanyisa.entities.TradeSignal.create({
        pair: selectedPair,
        ...result,
        status: "pending",
      });

      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success(`New ${result.signal} signal generated for ${selectedPair}`);
    } catch (error) {
      console.error("Signal generation failed:", error);
      toast.error(error?.message || "Failed to generate signal. Check console for details.");
    } finally {
      setGenerating(false);
    }
  };

  const approveSignal = useMutation({
    mutationFn: async (signal) => {
      await khanyisa.entities.TradeSignal.update(signal.id, { status: "approved" });
      await khanyisa.entities.Trade.create({
        pair: signal.pair,
        direction: signal.signal,
        entry_price: signal.entry,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        confidence: signal.confidence,
        risk_score: signal.risk_score,
        status: "open",
        position_size: 0.01,
        mode: currentSettings.mode || "paper",
      });
      return signal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.success("Signal approved — trade opened");
    },
  });

  const rejectSignal = useMutation({
    mutationFn: (signal) => {
      return khanyisa.entities.TradeSignal.update(signal.id, { status: "rejected" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      toast.info("Signal rejected");
    },
  });

  const sendToMT5 = useMutation({
    mutationFn: async (signal) => {
      setSendingSignalId(signal.id);
      const result = await backendClient.trades.sendToMT5(signal);
      return result;
    },
    onSuccess: () => {
      toast.success("Signal sent to MT5 bridge successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send to MT5 bridge");
    },
    onSettled: () => {
      setSendingSignalId(null);
    },
  });

  const filtered = filter === "all" ? signals : signals.filter((s) => s.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trade Signals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Verified signals using market data, news, and team rules.</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Pair: {selectedPair}</span>
            <span>News: {marketData.news?.length ?? 0} items</span>
            <span>OHLC: {marketData.ohlcData?.length ?? 0} bars</span>
            {marketData.price != null && <span>Price: {marketData.price.toFixed(4)}</span>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-[140px]">
            <label className="block text-[10px] text-muted-foreground mb-1">Selected market</label>
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {pairs.map((pair) => (
                <option key={pair} value={pair}>{pair}</option>
              ))}
            </select>
          </div>
          <Button
            onClick={generateSignal}
            disabled={generating || marketData.isLoading || !!marketData.error || !hasOHLC}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Generate Signal
          </Button>
        </div>
      </div>
      {marketData.error && (
        <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
          Warning: Market data could not be loaded. Signal generation may be delayed.
        </div>
      )}
      {marketData.isLoading && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          Loading market data and news for {selectedPair}…
        </div>
      )}

      {!marketData.isLoading && !marketData.error && !hasOHLC && (
        <div className="rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
          No OHLC bars loaded yet for {selectedPair}. Check your market data API key or try another pair.
        </div>
      )}

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All ({signals.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({signals.filter((s) => s.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({signals.filter((s) => s.status === "approved").length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({signals.filter((s) => s.status === "rejected").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Zap className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No signals found</p>
          <p className="text-xs mt-1">Click "Generate Signal" to create one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onApprove={(s) => approveSignal.mutate(s)}
              onReject={(s) => rejectSignal.mutate(s)}
              onSendToMT5={(s) => sendToMT5.mutate(s)}
              isSending={sendingSignalId === signal.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}