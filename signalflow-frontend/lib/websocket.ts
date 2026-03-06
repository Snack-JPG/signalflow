import { io, Socket } from 'socket.io-client';
import {
  WSMessage,
  SignalFlowData,
  NarrativeScore,
  OrderBookData,
  DivergenceSignal,
  ConvictionScore,
  MicrostructureMetrics,
  Alert,
  AIBriefing
} from './types';

export class SignalFlowWebSocket {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(private url: string = 'http://localhost:8002') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.url, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on('connect', () => {
          console.log('Connected to SignalFlow backend');
          this.reconnectAttempts = 0;
          this.emit('connection', { status: 'connected' });
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from SignalFlow backend');
          this.emit('connection', { status: 'disconnected' });
        });

        this.socket.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
        });

        // Data event handlers
        this.socket.on('narrative_scores', (data: NarrativeScore[]) => {
          this.emit('narrative_scores', data);
        });

        this.socket.on('order_book', (data: OrderBookData) => {
          this.emit('order_book', data);
        });

        this.socket.on('divergence_signals', (data: DivergenceSignal[]) => {
          this.emit('divergence_signals', data);
        });

        this.socket.on('conviction_scores', (data: ConvictionScore[]) => {
          this.emit('conviction_scores', data);
        });

        this.socket.on('microstructure', (data: MicrostructureMetrics) => {
          this.emit('microstructure', data);
        });

        this.socket.on('alert', (data: Alert) => {
          this.emit('alert', data);
        });

        this.socket.on('ai_briefing', (data: AIBriefing) => {
          this.emit('ai_briefing', data);
        });

        this.socket.on('full_update', (data: SignalFlowData) => {
          this.emit('full_update', data);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        callback(data);
      });
    }
  }

  send(type: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(type, data);
    }
  }

  changeAsset(asset: string): void {
    this.send('change_asset', { asset });
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}

// Singleton instance
let wsInstance: SignalFlowWebSocket | null = null;

export function getWebSocket(): SignalFlowWebSocket {
  if (!wsInstance) {
    wsInstance = new SignalFlowWebSocket();
  }
  return wsInstance;
}