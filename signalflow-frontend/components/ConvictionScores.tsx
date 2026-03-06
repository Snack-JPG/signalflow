'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ConvictionScore } from '@/lib/types';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function ConvictionScores() {
  const [scores, setScores] = useState<ConvictionScore[]>([]);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    // Subscribe to conviction scores
    const unsubscribe = subscribe('conviction_scores', (data: ConvictionScore[]) => {
      setScores(data);
    });

    // Mock data for demonstration
    const mockScores: ConvictionScore[] = [
      {
        narrative: 'AI',
        score: 92,
        level: 'HIGH',
        explanation: 'Strong momentum across all metrics. Institutional accumulation detected with positive social sentiment.',
        components: {
          narrativeMomentum: 95,
          orderFlow: 88,
          socialSentiment: 90,
          onchainActivity: 94,
          liquidityHealth: 92,
          manipulationRisk: 10,
        },
      },
      {
        narrative: 'DeFi',
        score: 67,
        level: 'MODERATE',
        explanation: 'Mixed signals. Healthy liquidity but declining social interest. Watch for trend reversal.',
        components: {
          narrativeMomentum: 60,
          orderFlow: 70,
          socialSentiment: 55,
          onchainActivity: 75,
          liquidityHealth: 80,
          manipulationRisk: 25,
        },
      },
      {
        narrative: 'Meme',
        score: 35,
        level: 'LOW',
        explanation: 'High manipulation risk detected. Retail-driven with poor liquidity structure.',
        components: {
          narrativeMomentum: 40,
          orderFlow: 30,
          socialSentiment: 45,
          onchainActivity: 35,
          liquidityHealth: 25,
          manipulationRisk: 75,
        },
      },
      {
        narrative: 'RWA',
        score: 78,
        level: 'MODERATE',
        explanation: 'Emerging strength. Institutional interest growing with improving microstructure.',
        components: {
          narrativeMomentum: 75,
          orderFlow: 82,
          socialSentiment: 70,
          onchainActivity: 80,
          liquidityHealth: 85,
          manipulationRisk: 15,
        },
      },
    ];
    setScores(mockScores);

    return unsubscribe;
  }, [subscribe]);

  const getScoreColor = (score: number) => {
    if (score > 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number) => {
    if (score > 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'MODERATE':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
  };

  return (
    <div className="panel h-full">
      <h3 className="panel-header flex items-center gap-2">
        Conviction Scores
        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
          KEY PANEL
        </span>
      </h3>

      <div className="space-y-4 overflow-y-auto flex-1">
        {scores.map((score, index) => (
          <motion.div
            key={score.narrative}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-white">
                {score.narrative}
              </h4>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${getScoreTextColor(score.score)}`}>
                  {score.score}
                </span>
                <span className={`text-xs px-2 py-1 rounded border ${getLevelBadgeClass(score.level)}`}>
                  {score.level}
                </span>
              </div>
            </div>

            {/* Score bar */}
            <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden mb-3">
              <motion.div
                className={`absolute inset-y-0 left-0 ${getScoreColor(score.score)}`}
                initial={{ width: 0 }}
                animate={{ width: `${score.score}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white mix-blend-difference z-10">
                  Conviction: {score.score}%
                </span>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-xs text-gray-400 mb-3">
              {score.explanation}
            </p>

            {/* Component breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Momentum:</span>
                <span className={score.components.narrativeMomentum > 70 ? 'text-green-400' :
                                 score.components.narrativeMomentum > 40 ? 'text-yellow-400' : 'text-red-400'}>
                  {score.components.narrativeMomentum}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Order Flow:</span>
                <span className={score.components.orderFlow > 70 ? 'text-green-400' :
                                 score.components.orderFlow > 40 ? 'text-yellow-400' : 'text-red-400'}>
                  {score.components.orderFlow}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Social:</span>
                <span className={score.components.socialSentiment > 70 ? 'text-green-400' :
                                 score.components.socialSentiment > 40 ? 'text-yellow-400' : 'text-red-400'}>
                  {score.components.socialSentiment}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">On-chain:</span>
                <span className={score.components.onchainActivity > 70 ? 'text-green-400' :
                                 score.components.onchainActivity > 40 ? 'text-yellow-400' : 'text-red-400'}>
                  {score.components.onchainActivity}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Liquidity:</span>
                <span className={score.components.liquidityHealth > 70 ? 'text-green-400' :
                                 score.components.liquidityHealth > 40 ? 'text-yellow-400' : 'text-red-400'}>
                  {score.components.liquidityHealth}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Manip Risk:</span>
                <span className={score.components.manipulationRisk < 30 ? 'text-green-400' :
                                 score.components.manipulationRisk < 60 ? 'text-yellow-400' : 'text-red-400'}>
                  {score.components.manipulationRisk}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}