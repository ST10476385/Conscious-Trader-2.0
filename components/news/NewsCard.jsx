import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

const sentimentColors = {
  positive: "bg-profit/10 text-profit border-profit/20",
  negative: "bg-loss/10 text-loss border-loss/20",
  neutral: "bg-warn/10 text-warn border-warn/20",
};

const impactColors = {
  high: "bg-loss/10 text-loss border-loss/20",
  medium: "bg-warn/10 text-warn border-warn/20",
  low: "bg-muted text-muted-foreground",
};

export default function NewsCard({ news }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground leading-snug">{news.title}</h4>
          {news.summary && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{news.summary}</p>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {news.sentiment && (
              <Badge variant="outline" className={cn("text-[10px]", sentimentColors[news.sentiment])}>
                {news.sentiment}
              </Badge>
            )}
            {news.impact && (
              <Badge variant="outline" className={cn("text-[10px]", impactColors[news.impact])}>
                {news.impact} impact
              </Badge>
            )}
            {news.affected_pairs?.map(pair => (
              <Badge key={pair} variant="outline" className="text-[10px] font-mono">
                {pair}
              </Badge>
            ))}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {news.source || "Market Feed"}
              {news.created_date && ` • ${format(new Date(news.created_date), "MMM d")}`}
            </span>
          </div>
        </div>
        {news.url && (
          <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}