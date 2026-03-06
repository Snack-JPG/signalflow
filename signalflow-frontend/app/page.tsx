'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/lib/types';
import { useWebSocket } from '@/hooks/useWebSocket';

// Import all components
import NarrativeRadar from '@/components/NarrativeRadar';
import OrderBookDepth from '@/components/OrderBookDepth';
import TwitterFeed from '@/components/TwitterFeed';
import DivergenceSignals from '@/components/DivergenceSignals';
import ConvictionScores from '@/components/ConvictionScores';
import MicrostructureMetrics from '@/components/MicrostructureMetrics';
import UnifiedAlertFeed from '@/components/UnifiedAlertFeed';
import AIBriefing from '@/components/AIBriefing';

export default function Home() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>('BTC/USDT');
  const { connectionStatus, changeAsset } = useWebSocket();

  useEffect(() => {
    changeAsset(selectedAsset);
  }, [selectedAsset, changeAsset]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* Header Bar */}
      <header className="border-b border-gray-800 bg-[#111111] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              SignalFlow Command Center
            </h1>

            {/* Asset Selector */}
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value as Asset)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="BTC/USDT">BTC/USDT</option>
              <option value="ETH/USDT">ETH/USDT</option>
              <option value="SOL/USDT">SOL/USDT</option>
            </select>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">QuantFlow:</span>
              <span className={`status-dot ${connectionStatus.quantflow ? 'status-connected' : 'status-disconnected'}`} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">NarrativeFlow:</span>
              <span className={`status-dot ${connectionStatus.narrativeflow ? 'status-connected' : 'status-disconnected'}`} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">SignalFlow:</span>
              <span className={`status-dot ${connectionStatus.signalflow ? 'status-connected' : 'status-disconnected'}`} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="p-4 h-[calc(100vh-64px)]">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Left Column - Narrative & Order Book */}
          <div className="col-span-3 grid grid-rows-2 gap-4">
            <NarrativeRadar />
            <OrderBookDepth />
          </div>

          {/* Center Column - Main Panels */}
          <div className="col-span-6 grid grid-rows-[1fr_auto_1.5fr] gap-4">
            {/* Top Row - Conviction Scores (KEY PANEL) */}
            <ConvictionScores />

            {/* Middle Row - Microstructure Metrics */}
            <MicrostructureMetrics />

            {/* Bottom Row - Two columns */}
            <div className="grid grid-cols-2 gap-4">
              <DivergenceSignals />
              <AIBriefing />
            </div>
          </div>

          {/* Right Column - Twitter & Alerts */}
          <div className="col-span-3 grid grid-rows-2 gap-4">
            <TwitterFeed />
            <UnifiedAlertFeed />
          </div>
        </div>
      </main>
    </div>
  );
}