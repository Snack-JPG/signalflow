'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert } from '@/lib/types';
import { useWebSocket } from '@/hooks/useWebSocket';

const severityEmojis = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
  info: '🔵',
};

const severityColors = {
  high: 'text-red-400 bg-red-500/10 border-red-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-green-400 bg-green-500/10 border-green-500/30',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

const sourceColors = {
  quantflow: 'text-purple-400',
  narrativeflow: 'text-cyan-400',
  signalflow: 'text-emerald-400',
};

const sourceIcons = {
  quantflow: '📊',
  narrativeflow: '📰',
  signalflow: '🎯',
};

export default function UnifiedAlertFeed() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const { subscribe } = useWebSocket();
  const alertsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to unified alerts
    const unsubscribe = subscribe('unified_alerts', (newAlert: Alert) => {
      setAlerts(prev => [newAlert, ...prev].slice(0, 100)); // Keep last 100 alerts
    });

    // Mock initial alerts for demonstration
    const mockAlerts: Alert[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        source: 'quantflow',
        severity: 'high',
        type: 'manipulation',
        message: 'Spoofing detected on BTC/USDT - Large orders cancelled after 200ms',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        source: 'narrativeflow',
        severity: 'medium',
        type: 'sentiment_shift',
        message: 'AI narrative momentum increasing - Social volume up 45% in last hour',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        source: 'signalflow',
        severity: 'high',
        type: 'divergence',
        message: 'Critical divergence: DeFi social sentiment bearish but on-chain accumulation detected',
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        source: 'quantflow',
        severity: 'low',
        type: 'liquidity',
        message: 'Liquidity improving on ETH/USDT - Spread tightening to 0.12%',
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        source: 'narrativeflow',
        severity: 'info',
        type: 'news',
        message: 'Major crypto fund announces $100M AI narrative allocation',
      },
      {
        id: '6',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        source: 'signalflow',
        severity: 'medium',
        type: 'conviction',
        message: 'RWA conviction score crossed 80 threshold - Entering high conviction zone',
      },
    ];
    setAlerts(mockAlerts);

    // Simulate new alerts coming in
    const interval = setInterval(() => {
      const sources: Alert['source'][] = ['quantflow', 'narrativeflow', 'signalflow'];
      const severities: Alert['severity'][] = ['high', 'medium', 'low', 'info'];
      const messages = [
        'Unusual order flow detected - Investigating pattern',
        'Narrative shift detected - New catalyst emerging',
        'Microstructure anomaly - VPIN elevated above 0.6',
        'Social sentiment divergence - Monitor for reversal',
        'Liquidity vacuum detected - Caution advised',
        'Whale accumulation pattern identified',
        'Smart money rotation into new narrative',
        'Kyle\'s Lambda spike - Price impact increasing',
      ];

      const newAlert: Alert = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        source: sources[Math.floor(Math.random() * sources.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        type: 'realtime',
        message: messages[Math.floor(Math.random() * messages.length)],
      };

      setAlerts(prev => [newAlert, ...prev].slice(0, 100));
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [subscribe]);

  const filteredAlerts = alerts.filter(alert =>
    filter === 'all' || alert.severity === filter
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="panel-header mb-0">Unified Alert Feed</h3>
        <div className="flex gap-1">
          {(['all', 'high', 'medium', 'low'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                filter === level
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{
                duration: 0.2,
                delay: index < 5 ? index * 0.05 : 0
              }}
              className={`border rounded-lg p-2.5 ${severityColors[alert.severity]} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg mt-0.5">
                  {severityEmojis[alert.severity]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {sourceIcons[alert.source]}
                    </span>
                    <span className={`text-xs font-medium ${sourceColors[alert.source]}`}>
                      {alert.source.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed break-words">
                    {alert.message}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={alertsEndRef} />
      </div>

      <div className="mt-2 pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{filteredAlerts.length} alerts</span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}