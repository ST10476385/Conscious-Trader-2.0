//+------------------------------------------------------------------+
//| Khanyisa Trading Robot - Expert Advisor for MT5                 |
//| Sends trade events (open/close) to Khanyisa App                 |
//| Attach this EA to any chart in MT5                              |
//+------------------------------------------------------------------+

#property strict
#include <Trade\Trade.mqh>

// Configuration
string WebhookURL = "http://localhost:5000/api/mt5/event";  // Local development
// string WebhookURL = "https://your-production-url.com/api/mt5/event";  // Production

CTrade trade;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit() {
    Print("✅ Khanyisa EA initialized on ", Symbol());
    Print("   Webhook: ", WebhookURL);
    return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
    Print("❌ Khanyisa EA removed from ", Symbol());
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick() {
    // EA runs passively - only handles trade events
}

//+------------------------------------------------------------------+
//| Handle trade transactions (real-time events)                    |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result) {
    
    // Only track deal transactions (actual trades)
    if (trans.type != TRADE_TRANSACTION_DEAL_ADD) {
        return;
    }
    
    // Build JSON payload
    string event_type = "trade.closed";
    if (trans.deal_type == DEAL_TYPE_BUY || trans.deal_type == DEAL_TYPE_SELL) {
        event_type = "trade.opened";
    }
    
    string json = StringFormat(
        "{"
        "\"event\":\"%s\","
        "\"symbol\":\"%s\","
        "\"volume\":%.2f,"
        "\"price\":%.5f,"
        "\"profit\":%.2f,"
        "\"ticket\":%d,"
        "\"timestamp\":\"%s\""
        "}",
        event_type,
        trans.symbol,
        trans.volume,
        trans.price,
        trans.profit,
        trans.deal,
        TimeToString(TimeLocal(), TIME_DATE|TIME_MINUTES|TIME_SECONDS)
    );
    
    // Send to Khanyisa
    char data[];
    char result_headers[];
    StringToCharArray(json, data, 0, StringLen(json));
    
    int res = WebRequest(
        "POST",
        WebhookURL,
        "Content-Type: application/json\r\n",
        5000,
        data,
        result_headers,
        NULL
    );
    
    if (res == 200) {
        Print("✅ Trade event sent: ", event_type, " | ", trans.symbol, " | Profit: ", trans.profit);
    } else {
        Print("⚠️  Failed to send event (HTTP ", res, ") | Check webhook URL");
    }
}

//+------------------------------------------------------------------+
