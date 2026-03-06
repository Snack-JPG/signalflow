'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DivergenceSignal } from '@/lib/types';
import { useWebSocket } from '@/hooks/useWebSocket';

const signalColors = {
  early_entry: 'bg-green-500/20 border-green-500',
  late_exit: 'bg-red-500/20 border-red-500',
  accumulation: 'bg-yellow-500/20 border-yellow-500',
  dead: 'bg-gray-600/20 border-gray-600',
};

const signalLabels = {
  early_entry: 'Early Entry',
  late_exit: 'Late/Exit',
  accumulation: 'Accumulation',
  dead: 'Dead',
};

const signalIcons = {
  early_entry: '🚀',
  late_exit: '⚠️',
  accumulation: '📊',
  dead: '💀',
};

const trendIcon = (trend: 'up' | 'down' | 'flat') => {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '→';
  }
};

const trendColor = (trend: 'up' | 'down' | 'flat') => {
  switch (trend) {
    case 'up': return 'text-green-400';
    case 'down': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

export default function DivergenceSignals() {
  const [signals, setSignals] = useState<DivergenceSignal[]>([]);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    // Subscribe to divergence signals
    const unsubscribe = subscribe('divergence_signals', (data: DivergenceSignal[]) => {
      setSignals(data.slice(0, 8)); // Keep only the latest 8 signals
    });

    // Mock data for demonstration
    const mockSignals: DivergenceSignal[] = [
      {
        id: '1',
        narrative: 'AI',
        type: 'early_entry',
        socialTrend: 'up',
        priceTrend: 'flat',
        onchainTrend: 'up',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        narrative: 'Meme',
        type: 'late_exit',
        socialTrend: 'up',
        priceTrend: 'down',
        onchainTrend: 'down',
        timestamp: new Date().toISOString(),
      },
      {
        id: '3',
        narrative: 'DeFi',
        type: 'accumulation',
        socialTrend: 'flat',
        priceTrend: 'up',
        onchainTrend: 'up',
        timestamp: new Date().toISOString(),
      },
      {
        id: '4',
        narrative: 'NFT',
        type: 'dead',
        socialTrend: 'down',
        priceTrend: 'down',
        onchainTrend: 'down',
        timestamp: new Date().toISOString(),
      },
    ];
    setSignals(mockSignals);

    return unsubscribe;
  }, [subscribe]);

  return (
    <div className="panel h-full">
      <h3 className="panel-header">Divergence Signals</h3>
      <div className="grid grid-cols-2 gap-3 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {signals.map((signal, index) => (
            <motion.div
              key={signal.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                type: 'spring',
                stiffness: 200
              }}
              className={`border rounded-lg p-3 ${signalColors[signal.type]} transition-all hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{signalIcons[signal.type]}</span>
                  <div>
                    <div className="text-xs font-bold text-gray-400">
                      {signal.narrative}
                    </div>
                    <div className={`text-sm font-semibold ${
                      signal.type === 'early_entry' ? 'text-green-400' :
                      signal.type === 'late_exit' ? 'text-red-400' :
                      signal.type === 'accumulation' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {signalLabels[signal.type]}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Social:</span>
                  <span className={trendColor(signal.socialTrend)}>
                    {trendIcon(signal.socialTrend)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Price:</span>
                  <span className={trendColor(signal.priceTrend)}>
                    {trendIcon(signal.priceTrend)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Chain:</span>
                  <span className={trendColor(signal.onchainTrend)}>
                    {trendIcon(signal.onchainTrend)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                {new Date(signal.timestamp).toLocaleTimeString()}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}