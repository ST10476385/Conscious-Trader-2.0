import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { khanyisa } from "@/api/khanyisaClient";

function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border">
        <span className="text-[11px] font-mono text-muted-foreground">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-profit" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="text-[11px] font-mono text-muted-foreground p-4 overflow-x-auto leading-relaxed bg-background/50 max-h-64">{code}</pre>
    </div>
  );
}

const RECEIVER_FN = `// backend/mt5Receiver.js (Khanyisa backend function — HTTP trigger)
// Endpoint: POST /api/mt5/sync
// Called by the Python bridge every 30s

import { khanyisa } from "@/api/khanyisaClient";

export default async function mt5Receiver(req) {
  const { open_trades, closed_trades, account } = req.body;

  // Sync open positions
  for (const pos of open_trades) {
    const existing = await khanyisa.entities.Trade.filter({
      pair: pos.symbol.replace(".", "/"),
      status: "open"
    });

    if (existing.length === 0) {
      await khanyisa.entities.Trade.create({
        pair: pos.symbol,
        direction: pos.type === 0 ? "BUY" : "SELL",
        status: "open",
        entry_price: pos.price_open,
        current_price: pos.price_current,
        stop_loss: pos.sl,
        take_profit: pos.tp,
        position_size: pos.volume,
        pnl: pos.profit,
        mode: "demo",
        notes: \`MT5 ticket #\${pos.ticket}\`
      });
    } else {
      await khanyisa.entities.Trade.update(existing[0].id, {
        current_price: pos.price_current,
        pnl: pos.profit,
      });
    }
  }

  // Sync closed deals
  for (const deal of closed_trades) {
    if (deal.profit === 0) continue; // skip non-closing deals
    const open = await khanyisa.entities.Trade.filter({
      notes: \`MT5 ticket #\${deal.position_id}\`
    });
    if (open.length > 0) {
      await khanyisa.entities.Trade.update(open[0].id, {
        status: "closed",
        close_price: deal.price,
        pnl: deal.profit,
        close_reason: "manual"
      });
    }
  }

  // Update balance in settings
  const settings = await khanyisa.entities.TradingSettings.list();
  if (settings.length > 0) {
    await khanyisa.entities.TradingSettings.update(settings[0].id, {
      current_balance: account.balance
    });
  }

  return { ok: true, synced: open_trades.length };
}
`;

const EVENT_RECEIVER = `// backend/eventReceiver.js (Base44 backend function — HTTP trigger)
// Endpoint: POST /api/mt5/event
// Called by the MQL5 EA on every trade open/close

import { khanyisa } from "@/api/khanyisaClient";

export default async function eventReceiver(req) {
  const { event, symbol, volume, price, profit, ticket } = req.body;

  if (event === "trade.opened") {
    await khanyisa.entities.Trade.create({
      pair: symbol,
      direction: "BUY", // EA sends correct direction
      status: "open",
      entry_price: price,
      position_size: volume,
      pnl: 0,
      mode: "demo",
      notes: \`MT5 ticket #\${ticket}\`
    });
  }

  if (event === "trade.closed") {
    const open = await khanyisa.entities.Trade.filter({ notes: \`MT5 ticket #\${ticket}\` });
    if (open.length > 0) {
      await khanyisa.entities.Trade.update(open[0].id, {
        status: "closed",
        close_price: price,
        pnl: profit,
        close_reason: profit >= 0 ? "tp_hit" : "sl_hit"
      });
    }
  }

  return { ok: true };
}
`;

export default function WebhookReceiverSection() {
  const { data: webhooks = [] } = useQuery({
    queryKey: ["webhooks"],
    queryFn: () => khanyisa.entities.Webhook.list(),
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-foreground">Webhook Receiver (MT5 → App)</h3>
          <Badge variant="outline" className="text-[10px] border-warn/30 text-warn">Requires Builder+</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          These backend functions receive incoming data from your MT5 bridge and sync it into the Trade entity automatically.
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-foreground mb-2">
              Polling sync receiver <span className="text-muted-foreground font-normal">— called by the Python bridge</span>
            </p>
            <CodeBlock label="backend/mt5Receiver.js" code={RECEIVER_FN} />
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-2">
              Real-time event receiver <span className="text-muted-foreground font-normal">— called by the MQL5 EA</span>
            </p>
            <CodeBlock label="backend/eventReceiver.js" code={EVENT_RECEIVER} />
          </div>

          <div className="p-3 bg-secondary/30 rounded-lg space-y-1.5">
            <p className="text-[11px] font-medium text-foreground">Flow summary</p>
            {[
              "MT5 Python bridge runs on your PC alongside MT5",
              "Every 30s it POSTs all open positions + account balance",
              "Backend function upserts trades into the Trade entity",
              "The MQL5 EA fires instant events on open/close",
              "Dashboard & Risk pages reflect live MT5 data",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-primary mt-0.5">{i + 1}.</span>
                <p className="text-[11px] text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>

          {webhooks.length > 0 && (
            <div className="p-3 bg-profit/5 border border-profit/10 rounded-lg">
              <p className="text-[11px] text-profit font-medium mb-0.5">
                ✓ {webhooks.length} outgoing webhook{webhooks.length > 1 ? "s" : ""} configured
              </p>
              <p className="text-[10px] text-muted-foreground">
                When trades sync from MT5, they'll also trigger your configured outgoing webhooks to notify external systems.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}