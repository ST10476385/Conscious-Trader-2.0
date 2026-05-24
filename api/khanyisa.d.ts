declare module '@base44/sdk' {
  export interface KhanyisaClient {
    entities: {
      Trade: any;
      TradeSignal: any;
      TradingSettings: any;
      MarketNews: any;
      Webhook: any;
    };
    integrations: {
      Core: {
        InvokeLLM: (config: any) => Promise<any>;
      };
    };
    auth: {
      me: () => Promise<any>;
      logout: (redirectUrl?: string) => void;
      redirectToLogin: (redirectUrl?: string) => void;
    };
  }

  export function createClient(config: any): KhanyisaClient;
}
