import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
      <pre className="text-[11px] font-mono text-muted-foreground p-4 overflow-x-auto leading-relaxed bg-background/50 max-h-60">{code}</pre>
    </div>
  );
}

const BACKEND_FN = `// backend/fetchNews.js (Base44 backend function)
// Runs on a schedule (e.g. every 15 min) to pull live financial news

import { khanyisa } from "@/api/khanyisaClient";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY; // set in Secrets
const SYMBOLS = ["AAPL","EURUSD","BTCUSD","GBPUSD"];

export default async function fetchNews() {
  for (const symbol of SYMBOLS) {
    const url = \`https://finnhub.io/api/v1/news?category=forex&token=\${FINNHUB_KEY}\`;
    const res = await fetch(url);
    const articles = await res.json();

    for (const article of articles.slice(0, 3)) {
      // Use LLM to score sentiment
      const scored = await khanyisa.integrations.Core.InvokeLLM({
        prompt: \`Rate the sentiment of this news for forex trading (-1 negative to 1 positive):
Title: \${article.headline}
Summary: \${article.summary}
Return JSON: { sentiment: "positive"|"negative"|"neutral", score: number, impact: "low"|"medium"|"high" }\`,
        response_json_schema: {
          type: "object",
          properties: {
            sentiment: { type: "string" },
            score: { type: "number" },
            impact: { type: "string" }
          }
        }
      });

      await khanyisa.entities.MarketNews.create({
        title: article.headline,
        source: article.source,
        summary: article.summary,
        url: article.url,
        sentiment: scored.sentiment,
        sentiment_score: scored.score,
        impact: scored.impact,
        affected_pairs: [symbol]
      });
    }
  }
  return { fetched: SYMBOLS.length };
}
`;

const PROVIDERS = [
  { name: "Finnhub", tier: "Free", url: "https://finnhub.io", desc: "Real-time forex, stock & crypto news. Free tier: 60 req/min." },
  { name: "NewsAPI", tier: "Free", url: "https://newsapi.org", desc: "General financial news. Free tier: 100 req/day." },
  { name: "Benzinga", tier: "Paid", url: "https://www.benzinga.com/apis", desc: "Professional-grade market news with sentiment data." },
  { name: "Polygon.io", tier: "Free", url: "https://polygon.io", desc: "Stock + crypto news with ticker tagging. Generous free tier." },
];

export default function NewsApiSection() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-foreground">Live News API</h3>
          <Badge variant="outline" className="text-[10px] border-warn/30 text-warn">Requires Builder+</Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Replace AI-generated news with real financial headlines, auto-scored for sentiment using the LLM integration.
        </p>

        {/* Provider cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {PROVIDERS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg border border-border hover:border-primary/20 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{p.name}</span>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className={`text-[9px] ${p.tier === "Free" ? "border-profit/30 text-profit" : "border-warn/30 text-warn"}`}>
                    {p.tier}
                  </Badge>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{p.desc}</p>
            </a>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Recommended setup — Finnhub + LLM sentiment scoring</p>
            <CodeBlock label="backend/fetchNews.js" code={BACKEND_FN} />
          </div>
          <div className="p-3 bg-secondary/30 rounded-lg">
            <p className="text-[11px] text-muted-foreground">
              <span className="text-foreground font-medium">Setup steps:</span>
              {" "}1. Get a free Finnhub API key → {" "}
              2. Add <code className="font-mono text-primary">FINNHUB_API_KEY</code> to your app Secrets →{" "}
              3. Create a backend function with this code →{" "}
              4. Schedule it to run every 15 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}