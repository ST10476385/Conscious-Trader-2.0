import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, CheckCheck, ExternalLink, Zap, Newspaper, BarChart2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import MT5BridgeSection from "@/components/integrations/MT5BridgeSection";
import NewsApiSection from "@/components/integrations/NewsApiSection";
import WebhookReceiverSection from "@/components/integrations/WebhookReceiverSection";

export default function Integrations() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integration Hub</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Connect Conscious Trader to live data sources and your MT5 terminal</p>
      </div>

      <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl">
        <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Live execution requires <span className="text-primary font-medium">Builder+ plan</span> for backend functions. 
          The setup below is ready to activate — configs and scripts are fully prepared.
        </p>
      </div>

      <Tabs defaultValue="mt5">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="mt5" className="text-xs gap-1.5"><BarChart2 className="w-3.5 h-3.5" />MT5 Bridge</TabsTrigger>
          <TabsTrigger value="news" className="text-xs gap-1.5"><Newspaper className="w-3.5 h-3.5" />News API</TabsTrigger>
          <TabsTrigger value="receiver" className="text-xs gap-1.5"><Zap className="w-3.5 h-3.5" />Webhook Receiver</TabsTrigger>
        </TabsList>

        <TabsContent value="mt5" className="mt-4">
          <MT5BridgeSection />
        </TabsContent>
        <TabsContent value="news" className="mt-4">
          <NewsApiSection />
        </TabsContent>
        <TabsContent value="receiver" className="mt-4">
          <WebhookReceiverSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}