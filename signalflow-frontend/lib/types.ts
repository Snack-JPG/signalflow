// SignalFlow Types

export type Asset = 'BTC/USDT' | 'ETH/USDT' | 'SOL/USDT';

export interface NarrativeScore {
  name: string;
  score: number;
  momentum: 'up' | 'down' | 'flat';
  color: string;
}

export interface OrderBookData {
  bids: Array<[number, number]>; // [price, volume]
  asks: Array<[number, number]>;
  spread: number;
  midPrice: number;
}

export interface DivergenceSignal {
  id: string;
  narrative: string;
  type: 'early_entry' | 'late_exit' | 'accumulation' | 'dead';
  socialTrend: 'up' | 'down' | 'flat';
  priceTrend: 'up' | 'down' | 'flat';
  onchainTrend: 'up' | 'down' | 'flat';
  timestamp: string;
}

export interface ConvictionScore {
  narrative: string;
  score: number;
  level: 'HIGH' | 'MODERATE' | 'LOW';
  explanation: string;
  components: {
    narrativeMomentum: number;
    orderFlow: number;
    socialSentiment: number;
    onchainActivity: number;
    liquidityHealth: number;
    manipulationRisk: number;
  };
}

export interface MicrostructureMetrics {
  vpin: number;
  kylesLambda: number;
  obi: number;
  spread: number;
  hurst: number;
  amihud: number;
  patterns: {
    spoofing: boolean;
    layering: boolean;
    momentum: boolean;
  };
}

export interface Alert {
  id: string;
  timestamp: string;
  source: 'quantflow' | 'narrativeflow' | 'signalflow';
  severity: 'high' | 'medium' | 'low' | 'info';
  type: string;
  message: string;
  data?: any;
}

export interface AIBriefing {
  timestamp: string;
  title: string;
  content: string;
  narratives: string[];
}

export interface ConnectionStatus {
  quantflow: boolean;
  narrativeflow: boolean;
  signalflow: boolean;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface SignalFlowData {
  narrativeScores: NarrativeScore[];
  orderBook: OrderBookData;
  divergenceSignals: DivergenceSignal[];
  convictionScores: ConvictionScore[];
  microstructure: MicrostructureMetrics;
  alerts: Alert[];
  aiBriefing: AIBriefing;
}