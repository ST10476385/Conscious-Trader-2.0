import { useQuery, useQueryClient } from "@tanstack/react-query";
import { khanyisa } from "@/api/khanyisaClient";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Flame, TrendingUp } from "lucide-react";
import NewsCard from "@/components/news/NewsCard";
import { useState } from "react";
import { toast } from "sonner";
import { useTrendingNews, useFinancialNews, useCryptoNews } from "@/hooks/useMarketData";

export default function News() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("trending");

  // Real API data
  const trendingNews = useTrendingNews(15);
  const financialNews = useFinancialNews("trading forex stock market", 15);
  const cryptoNews = useCryptoNews(15);

  // Fallback to backend data if APIs fail
  const { data: backendNews = [] } = useQuery({
    queryKey: ["backendNews"],
    queryFn: () => khanyisa.entities.MarketNews.list("-created_date", 10),
    enabled: !trendingNews.data && !financialNews.data && !cryptoNews.data, // Only fetch if real APIs fail
  });

  // Combine all news sources
  const getAllNews = () => {
    const allNews = [];
    if (trendingNews.data) allNews.push(...(trendingNews.data || []));
    if (financialNews.data) allNews.push(...(financialNews.data || []));
    if (cryptoNews.data) allNews.push(...(cryptoNews.data || []));
    if (backendNews.length > 0) allNews.push(...backendNews);
    
    // Remove duplicates and sort by date
    return allNews
      .filter((n, i, arr) => arr.findIndex(a => a.title === n.title) === i)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 30);
  };

  const newsToDisplay = getAllNews();
  const isLoading = trendingNews.isLoading || financialNews.isLoading || cryptoNews.isLoading;

  const sentimentCounts = {
    positive: newsToDisplay.filter(n => n.sentiment === "positive").length,
    neutral: newsToDisplay.filter(n => n.sentiment === "neutral").length,
    negative: newsToDisplay.filter(n => n.sentiment === "negative").length,
  };

  const refreshNews = () => {
    queryClient.invalidateQueries({ queryKey: ["trendingNews"] });
    queryClient.invalidateQueries({ queryKey: ["financialNews"] });
    queryClient.invalidateQueries({ queryKey: ["cryptoNews"] });
    toast.success("News updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market News</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time sentiment-analyzed market intelligence</p>
        </div>
        <Button onClick={refreshNews} disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* News Source Indicators */}
      <div className="grid grid-cols-4 gap-3 text-xs">
        <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
            <span className="text-muted-foreground">Trending News</span>
          </div>
          <p className="font-semibold text-foreground mt-1">Live</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Financial</span>
          </div>
          <p className="font-semibold text-foreground mt-1">Active</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warn animate-pulse" />
            <span className="text-muted-foreground">Crypto News</span>
          </div>
          <p className="font-semibold text-foreground mt-1">Updated</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 border border-border/50">
          <div className="flex items-center gap-2">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-muted-foreground">Trending</span>
          </div>
          <p className="font-semibold text-foreground mt-1">{sentimentCounts.positive}</p>
        </div>
      </div>

      {/* Sentiment Summary */}
      {newsToDisplay.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-profit/5 border border-profit/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold font-mono text-profit">{sentimentCounts.positive}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Positive</p>
          </div>
          <div className="bg-warn/5 border border-warn/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold font-mono text-warn">{sentimentCounts.neutral}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Neutral</p>
          </div>
          <div className="bg-loss/5 border border-loss/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold font-mono text-loss">{sentimentCounts.negative}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Negative</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : newsToDisplay.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <span className="text-4xl mb-3">📰</span>
          <p className="text-sm">Loading real-time market news...</p>
          <p className="text-xs mt-1">Fetching from NewsAPI, Reuters, Bloomberg, and CoinDesk</p>
        </div>
      ) : (
        <div className="space-y-3">
          {newsToDisplay.map((item, idx) => (
            <NewsCard 
              key={item.id || idx} 
              news={{
                id: item.id || idx,
                title: item.title,
                description: item.description || item.summary,
                source: item.source,
                url: item.url,
                sentiment: item.sentiment,
                publishedAt: item.publishedAt,
                image: item.image,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}