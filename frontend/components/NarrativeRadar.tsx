'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NarrativeScore } from '@/lib/types';
import { useWebSocket } from '@/hooks/useWebSocket';

const defaultNarratives: NarrativeScore[] = [
  { name: 'AI', score: 0, momentum: 'flat', color: '#3b82f6' },
  { name: 'RWA', score: 0, momentum: 'flat', color: '#8b5cf6' },
  { name: 'DePIN', score: 0, momentum: 'flat', color: '#ec4899' },
  { name: 'Meme', score: 0, momentum: 'flat', color: '#f59e0b' },
  { name: 'DeFi', score: 0, momentum: 'flat', color: '#22c55e' },
  { name: 'L1/L2', score: 0, momentum: 'flat', color: '#06b6d4' },
  { name: 'Gaming', score: 0, momentum: 'flat', color: '#ef4444' },
  { name: 'NFT', score: 0, momentum: 'flat', color: '#a855f7' },
];

export default function NarrativeRadar() {
  const [narratives, setNarratives] = useState<NarrativeScore[]>(defaultNarratives);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('narrative_scores', (data: NarrativeScore[]) => {
      setNarratives(data);
    });

    return unsubscribe;
  }, [subscribe]);

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <div className="panel h-full">
      <h3 className="panel-header">Narrative Radar</h3>
      <div className="space-y-3 overflow-y-auto flex-1">
        {narratives.map((narrative, index) => (
          <motion.div
            key={narrative.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3"
          >
            <div className="w-16 text-sm font-medium text-gray-400">
              {narrative.name}
            </div>

            <div className="flex-1 relative">
              <div className="h-6 bg-gray-800 rounded overflow-hidden">
                <motion.div
                  className="h-full rounded"
                  style={{ backgroundColor: narrative.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${narrative.score}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white mix-blend-difference">
                  {narrative.score}
                </span>
              </div>
            </div>

            <div className={`w-8 text-center text-lg font-bold
              ${narrative.momentum === 'up' ? 'text-green-400' :
                narrative.momentum === 'down' ? 'text-red-400' : 'text-gray-500'}`}
            >
              {getMomentumIcon(narrative.momentum)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}