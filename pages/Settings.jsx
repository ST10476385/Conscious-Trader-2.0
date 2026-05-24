import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { khanyisa } from "@/api/khanyisaClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import WebhooksSection from "@/components/settings/WebhooksSection";

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => khanyisa.entities.TradingSettings.list(),
  });

  const [form, setForm] = useState({
    mode: "paper",
    initial_balance: 10000,
    current_balance: 10000,
    max_risk_per_trade: 2,
    max_daily_loss: 5,
    max_open_trades: 3,
    auto_approve: false,
  });

  useEffect(() => {
    if (settings.length > 0) {
      setForm({
        mode: settings[0].mode || "paper",
        initial_balance: settings[0].initial_balance || 10000,
        current_balance: settings[0].current_balance || 10000,
        max_risk_per_trade: settings[0].max_risk_per_trade || 2,
        max_daily_loss: settings[0].max_daily_loss || 5,
        max_open_trades: settings[0].max_open_trades || 3,
        auto_approve: settings[0].auto_approve || false,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (settings.length > 0) {
        await khanyisa.entities.TradingSettings.update(settings[0].id, form);
      } else {
        await khanyisa.entities.TradingSettings.create(form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
  });

  const modeColors = {
    paper: "bg-profit/10 text-profit border-profit/20",
    demo: "bg-warn/10 text-warn border-warn/20",
    live: "bg-loss/10 text-loss border-loss/20",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your trading parameters</p>
      </div>

      {/* Trading Mode */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Trading Mode</h3>
        <div className="grid grid-cols-3 gap-3">
          {["paper", "demo", "live"].map((mode) => (
            <button
              key={mode}
              onClick={() => setForm({ ...form, mode })}
              className={cn(
                "p-4 rounded-lg border-2 text-center transition-all",
                form.mode === mode ? "border-primary bg-primary/5" : "border-border hover:border-primary/20"
              )}
            >
              <div className={cn("w-3 h-3 rounded-full mx-auto mb-2",
                mode === "paper" ? "bg-profit" : mode === "demo" ? "bg-warn" : "bg-loss"
              )} />
              <p className="text-sm font-semibold text-foreground capitalize">{mode}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {mode === "paper" ? "Simulated" : mode === "demo" ? "MT5 Demo" : "Real Money"}
              </p>
            </button>
          ))}
        </div>
        {form.mode === "live" && (
          <div className="flex items-center gap-2 p-3 bg-loss/5 rounded-lg mt-4 border border-loss/10">
            <AlertTriangle className="w-4 h-4 text-loss flex-shrink-0" />
            <p className="text-xs text-loss">Live mode uses real money. Ensure thorough testing first.</p>
          </div>
        )}
      </div>

      {/* Balance */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Balance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Initial Balance ($)</Label>
            <Input
              type="number"
              value={form.initial_balance}
              onChange={(e) => setForm({ ...form, initial_balance: parseFloat(e.target.value) || 0 })}
              className="bg-secondary border-border font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Current Balance ($)</Label>
            <Input
              type="number"
              value={form.current_balance}
              onChange={(e) => setForm({ ...form, current_balance: parseFloat(e.target.value) || 0 })}
              className="bg-secondary border-border font-mono"
            />
          </div>
        </div>
      </div>

      {/* Risk Parameters */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Risk Parameters</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Max Risk Per Trade (%)</Label>
              <Input
                type="number"
                value={form.max_risk_per_trade}
                onChange={(e) => setForm({ ...form, max_risk_per_trade: parseFloat(e.target.value) || 0 })}
                className="bg-secondary border-border font-mono"
                min="0.5"
                max="10"
                step="0.5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Max Daily Loss (%)</Label>
              <Input
                type="number"
                value={form.max_daily_loss}
                onChange={(e) => setForm({ ...form, max_daily_loss: parseFloat(e.target.value) || 0 })}
                className="bg-secondary border-border font-mono"
                min="1"
                max="20"
                step="0.5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Max Open Trades</Label>
              <Input
                type="number"
                value={form.max_open_trades}
                onChange={(e) => setForm({ ...form, max_open_trades: parseInt(e.target.value) || 1 })}
                className="bg-secondary border-border font-mono"
                min="1"
                max="10"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div>
              <p className="text-sm text-foreground">Auto-approve signals</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Automatically execute signals without manual approval</p>
            </div>
            <Switch
              checked={form.auto_approve}
              onCheckedChange={(checked) => setForm({ ...form, auto_approve: checked })}
            />
          </div>
          {form.auto_approve && (
            <div className="flex items-center gap-2 p-3 bg-warn/5 rounded-lg border border-warn/10">
              <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0" />
              <p className="text-xs text-warn">Auto-approve bypasses manual review. Use with caution.</p>
            </div>
          )}
        </div>
      </div>

      {/* Webhooks */}
      <WebhooksSection />

      {/* Save */}
      <Button onClick={() => saveMutation.mutate()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        <Save className="w-4 h-4 mr-2" /> Save Settings
      </Button>
    </div>
  );
}