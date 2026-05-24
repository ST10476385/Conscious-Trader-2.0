import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PYTHON_BRIDGE = `# mt5_bridge.py — Run this on the same machine as MT5
# pip install MetaTrader5 requests schedule

import MetaTrader5 as mt5
import requests, schedule, time, json
from datetime import datetime

APP_WEBHOOK_URL = "https://YOUR_APP_URL/api/mt5/sync"  # replace with your app URL
ACCOUNT = 123456789   # your MT5 demo account number
PASSWORD = "your_password"
SERVER   = "YourBroker-Demo"

def init():
    if not mt5.initialize(login=ACCOUNT, password=PASSWORD, server=SERVER):
        print("MT5 init failed:", mt5.last_error())
        quit()
    print(f"Connected to MT5 | Balance: {mt5.account_info().balance}")

def sync_positions():
    positions = mt5.positions_get()
    history = mt5.history_deals_get(
        datetime(2024,1,1), datetime.now()
    )
    payload = {
        "open_trades": [p._asdict() for p in (positions or [])],
        "closed_trades": [d._asdict() for d in (history or [])],
        "account": mt5.account_info()._asdict(),
        "timestamp": datetime.utcnow().isoformat()
    }
    try:
        r = requests.post(APP_WEBHOOK_URL, json=payload, timeout=5)
        print(f"Synced {len(positions or [])} open, status {r.status_code}")
    except Exception as e:
        print("Sync error:", e)

init()
schedule.every(30).seconds.do(sync_positions)
print("Bridge running — syncing every 30s. Press Ctrl+C to stop.")
while True:
    schedule.run_pending()
    time.sleep(1)
`;

const MQL5_EA = `// conscious_trader_ea.mq5 — attach to any chart in MT5
// Fires HTTP POST on every trade open/close

#include <Trade\\Trade.mqh>
CTrade trade;

string WebhookURL = "https://YOUR_APP_URL/api/mt5/event"; // replace

void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result) {
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
      string json = StringFormat(
         "{\\"event\\":\\"%s\\",\\"symbol\\":\\"%s\\",\\"volume\\":%.2f,"
         "\\"price\\":%.5f,\\"profit\\":%.2f,\\"ticket\\":%d}",
         trans.deal_type == DEAL_TYPE_BUY ? "trade.opened" : "trade.closed",
         trans.symbol, trans.volume, trans.price, trans.profit, trans.deal
      );
      WebRequest("POST", WebhookURL, "Content-Type: application/json\\r\\n",
                 5000, json, NULL, NULL);
   }
}
`;

function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
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

function Step({ n, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[11px] font-bold text-primary">{n}</span>
      </div>
      <div className="flex-1 pb-4 border-b border-border last:border-0">
        <p className="text-sm font-medium text-foreground mb-2">{title}</p>
        {children}
      </div>
    </div>
  );
}

export default function MT5BridgeSection() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-foreground">MT5 Python Bridge</h3>
          <Badge variant="outline" className="text-[10px] border-warn/30 text-warn">Requires Builder+</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          A lightweight Python script runs alongside MT5 on your local machine and pushes position data to this app every 30 seconds.
        </p>

        <div className="space-y-4">
          <Step n="1" title="Install dependencies">
            <CodeBlock label="terminal" code={`pip install MetaTrader5 requests schedule`} />
          </Step>
          <Step n="2" title="Download & configure the bridge script">
            <p className="text-xs text-muted-foreground mb-2">Edit the top 4 variables with your account details and app URL.</p>
            <CodeBlock label="mt5_bridge.py" code={PYTHON_BRIDGE} />
          </Step>
          <Step n="3" title="(Optional) Install the MQL5 EA for instant event firing">
            <p className="text-xs text-muted-foreground mb-2">Paste this into MetaEditor and attach to any chart for real-time trade events instead of polling.</p>
            <CodeBlock label="conscious_trader_ea.mq5" code={MQL5_EA} />
          </Step>
          <Step n="4" title="Allow WebRequest in MT5">
            <p className="text-xs text-muted-foreground">
              In MT5 → Tools → Options → Expert Advisors → enable <strong className="text-foreground">Allow WebRequest</strong> and add your app URL to the allowed list.
            </p>
          </Step>
          <Step n="5" title="Run the bridge">
            <CodeBlock label="terminal" code={`python mt5_bridge.py`} />
          </Step>
        </div>
      </div>
    </div>
  );
}