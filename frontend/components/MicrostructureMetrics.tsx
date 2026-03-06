'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MicrostructureMetrics as MetricsType } from '@/lib/types';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function MicrostructureMetrics() {
  const [metrics, setMetrics] = useState<MetricsType>({
    vpin: 0,
    kylesLambda: 0,
    obi: 0,
    spread: 0,
    hurst: 0.5,
    amihud: 0,
    patterns: {
      spoofing: false,
      layering: false,
      momentum: false,
    },
  });

  const { subscribe } = useWebSocket();

  useEffect(() => {
    // Subscribe to microstructure metrics
    const unsubscribe = subscribe('microstructure_metrics', (data: MetricsType) => {
      setMetrics(data);
    });

    // Mock data for demonstration - simulate live updates
    const interval = setInterval(() => {
      setMetrics({
        vpin: Math.random() * 0.5 + 0.25, // 0.25 - 0.75
        kylesLambda: Math.random() * 2 + 0.5, // 0.5 - 2.5
        obi: Math.random() * 0.6 - 0.3, // -0.3 to 0.3
        spread: Math.random() * 0.005 + 0.001, // 0.001 - 0.006
        hurst: Math.random() * 0.3 + 0.35, // 0.35 - 0.65
        amihud: Math.random() * 0.0005 + 0.0001, // 0.0001 - 0.0006
        patterns: {
          spoofing: Math.random() > 0.8,
          layering: Math.random() > 0.85,
          momentum: Math.random() > 0.7,
        },
      });
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [subscribe]);

  const getMetricColor = (value: number, metric: string) => {
    switch (metric) {
      case 'vpin':
        // VPIN: < 0.3 = good (green), 0.3-0.5 = caution (yellow), > 0.5 = danger (red)
        if (value < 0.3) return 'text-green-400';
        if (value < 0.5) return 'text-yellow-400';
        return 'text-red-400';

      case 'kylesLambda':
        // Kyle's Lambda: < 1 = liquid (green), 1-2 = moderate (yellow), > 2 = illiquid (red)
        if (value < 1) return 'text-green-400';
        if (value < 2) return 'text-yellow-400';
        return 'text-red-400';

      case 'obi':
        // OBI: > 0.1 = buy pressure (green), -0.1 to 0.1 = neutral (yellow), < -0.1 = sell pressure (red)
        if (value > 0.1) return 'text-green-400';
        if (value > -0.1) return 'text-yellow-400';
        return 'text-red-400';

      case 'spread':
        // Spread: < 0.002 = tight (green), 0.002-0.004 = normal (yellow), > 0.004 = wide (red)
        if (value < 0.002) return 'text-green-400';
        if (value < 0.004) return 'text-yellow-400';
        return 'text-red-400';

      case 'hurst':
        // Hurst: ~0.5 = random walk, > 0.5 = trending, < 0.5 = mean-reverting
        if (Math.abs(value - 0.5) < 0.1) return 'text-yellow-400';
        if (value > 0.5) return 'text-green-400';
        return 'text-blue-400';

      case 'amihud':
        // Amihud: lower = more liquid
        if (value < 0.0002) return 'text-green-400';
        if (value < 0.0004) return 'text-yellow-400';
        return 'text-red-400';

      default:
        return 'text-gray-400';
    }
  };

  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'vpin':
      case 'obi':
      case 'hurst':
        return value.toFixed(3);
      case 'kylesLambda':
        return value.toFixed(2);
      case 'spread':
        return `${(value * 100).toFixed(3)}%`;
      case 'amihud':
        return value.toExponential(2);
      default:
        return value.toFixed(4);
    }
  };

  const getHurstInterpretation = (value: number) => {
    if (value > 0.55) return 'Trending';
    if (value < 0.45) return 'Mean-Rev';
    return 'Random Walk';
  };

  return (
    <div className="panel h-full">
      <h3 className="panel-header">Microstructure Metrics</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* VPIN */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs text-gray-500">VPIN</div>
              <div className="text-xs text-gray-600">Volume Sync Prob</div>
            </div>
            <motion.div
              key={metrics.vpin}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-xl font-bold ${getMetricColor(metrics.vpin, 'vpin')}`}
            >
              {formatValue(metrics.vpin, 'vpin')}
            </motion.div>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                metrics.vpin < 0.3 ? 'bg-green-500' :
                metrics.vpin < 0.5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(metrics.vpin * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Order Book Imbalance */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs text-gray-500">OBI</div>
              <div className="text-xs text-gray-600">Order Imbalance</div>
            </div>
            <motion.div
              key={metrics.obi}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-xl font-bold ${getMetricColor(metrics.obi, 'obi')}`}
            >
              {formatValue(metrics.obi, 'obi')}
            </motion.div>
          </div>
          <div className="text-xs text-gray-500">
            {metrics.obi > 0.1 ? 'Buy Pressure' :
             metrics.obi < -0.1 ? 'Sell Pressure' : 'Balanced'}
          </div>
        </div>

        {/* Kyle's Lambda */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs text-gray-500">Kyle's λ</div>
              <div className="text-xs text-gray-600">Price Impact</div>
            </div>
            <motion.div
              key={metrics.kylesLambda}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-xl font-bold ${getMetricColor(metrics.kylesLambda, 'kylesLambda')}`}
            >
              {formatValue(metrics.kylesLambda, 'kylesLambda')}
            </motion.div>
          </div>
          <div className="text-xs text-gray-500">
            {metrics.kylesLambda < 1 ? 'Liquid' :
             metrics.kylesLambda < 2 ? 'Moderate' : 'Illiquid'}
          </div>
        </div>

        {/* Spread */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs text-gray-500">Spread</div>
              <div className="text-xs text-gray-600">Bid-Ask</div>
            </div>
            <motion.div
              key={metrics.spread}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-xl font-bold ${getMetricColor(metrics.spread, 'spread')}`}
            >
              {formatValue(metrics.spread, 'spread')}
            </motion.div>
          </div>
          <div className="text-xs text-gray-500">
            {metrics.spread < 0.002 ? 'Tight' :
             metrics.spread < 0.004 ? 'Normal' : 'Wide'}
          </div>
        </div>

        {/* Hurst Exponent */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs text-gray-500">Hurst</div>
              <div className="text-xs text-gray-600">Market State</div>
            </div>
            <motion.div
              key={metrics.hurst}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-xl font-bold ${getMetricColor(metrics.hurst, 'hurst')}`}
            >
              {formatValue(metrics.hurst, 'hurst')}
            </motion.div>
          </div>
          <div className="text-xs text-gray-500">
            {getHurstInterpretation(metrics.hurst)}
          </div>
        </div>

        {/* Amihud Illiquidity */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs text-gray-500">Amihud</div>
              <div className="text-xs text-gray-600">Illiquidity</div>
            </div>
            <motion.div
              key={metrics.amihud}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-xl font-bold ${getMetricColor(metrics.amihud, 'amihud')}`}
            >
              {formatValue(metrics.amihud, 'amihud')}
            </motion.div>
          </div>
          <div className="text-xs text-gray-500">
            {metrics.amihud < 0.0002 ? 'Liquid' :
             metrics.amihud < 0.0004 ? 'Moderate' : 'Illiquid'}
          </div>
        </div>
      </div>

      {/* Pattern Detection Alerts */}
      <div className="border-t border-gray-800 pt-3">
        <div className="text-xs text-gray-500 mb-2">Pattern Detection</div>
        <div className="flex gap-2 flex-wrap">
          <motion.div
            animate={{
              opacity: metrics.patterns.spoofing ? 1 : 0.3,
              scale: metrics.patterns.spoofing ? 1 : 0.95
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              metrics.patterns.spoofing
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            🚨 Spoofing
          </motion.div>

          <motion.div
            animate={{
              opacity: metrics.patterns.layering ? 1 : 0.3,
              scale: metrics.patterns.layering ? 1 : 0.95
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              metrics.patterns.layering
                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            ⚠️ Layering
          </motion.div>

          <motion.div
            animate={{
              opacity: metrics.patterns.momentum ? 1 : 0.3,
              scale: metrics.patterns.momentum ? 1 : 0.95
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
              metrics.patterns.momentum
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            📈 Momentum
          </motion.div>
        </div>
      </div>
    </div>
  );
}