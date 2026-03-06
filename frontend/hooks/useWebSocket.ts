import { useEffect, useState, useCallback } from 'react';
import { getWebSocket } from '@/lib/websocket';
import { ConnectionStatus } from '@/lib/types';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    quantflow: false,
    narrativeflow: false,
    signalflow: false,
  });

  useEffect(() => {
    const ws = getWebSocket();

    const handleConnection = (data: { status: string }) => {
      setIsConnected(data.status === 'connected');
      if (data.status === 'connected') {
        setConnectionStatus(prev => ({ ...prev, signalflow: true }));
      } else {
        setConnectionStatus(prev => ({ ...prev, signalflow: false }));
      }
    };

    ws.on('connection', handleConnection);

    // Connect on mount
    ws.connect().catch(console.error);

    return () => {
      ws.off('connection', handleConnection);
    };
  }, []);

  const subscribe = useCallback((event: string, callback: Function) => {
    const ws = getWebSocket();
    ws.on(event, callback);

    return () => {
      ws.off(event, callback);
    };
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    const ws = getWebSocket();
    ws.send(type, data);
  }, []);

  const changeAsset = useCallback((asset: string) => {
    const ws = getWebSocket();
    ws.changeAsset(asset);
  }, []);

  return {
    isConnected,
    connectionStatus,
    subscribe,
    sendMessage,
    changeAsset,
  };
}