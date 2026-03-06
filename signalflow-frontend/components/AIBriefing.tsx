'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AIBriefing as BriefingType } from '@/lib/types';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function AIBriefing() {
  const [briefing, setBriefing] = useState<BriefingType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    // Subscribe to AI briefings
    const unsubscribe = subscribe('ai_briefing', (data: BriefingType) => {
      setBriefing(data);
      setIsLoading(false);
    });

    // Mock initial briefing for demonstration
    const mockBriefing: BriefingType = {
      timestamp: new Date().toISOString(),
      title: 'Market Intelligence Report',
      narratives: ['AI', 'RWA', 'DeFi'],
      content: `## Executive Summary

The crypto market is experiencing a **significant narrative shift** towards AI-driven protocols, with institutional accumulation patterns detected across multiple timeframes.

### Key Insights

#### 🎯 High Conviction Plays
- **AI Narrative** (92% conviction): Strong momentum with institutional backing
- **RWA Tokens** (78% conviction): Emerging strength in tokenized real-world assets
- **DeFi Recovery** (67% conviction): Mixed signals but improving liquidity

#### 📊 Market Microstructure
- **VPIN**: Elevated at 0.42 - moderate informed trading
- **Order Flow**: Bullish imbalance (+0.15 OBI)
- **Liquidity**: Improving with tightening spreads

### Critical Alerts

⚠️ **Manipulation Warning**: Spoofing detected on BTC/USDT pairs. Large orders being cancelled within 200ms of placement.

🔴 **Divergence Signal**: Social sentiment on meme tokens extremely bullish while on-chain shows distribution patterns.

### Recommended Actions

1. **Increase exposure** to AI narrative tokens with strong fundamentals
2. **Monitor** RWA sector for entry opportunities
3. **Reduce** meme token allocations - high manipulation risk
4. **Set alerts** for DeFi liquidity improvements

### Technical Outlook

The market structure suggests we're in an **accumulation phase** with smart money positioning for the next leg up. Key resistance levels being tested across major pairs.

---
*Generated: ${new Date().toLocaleTimeString()}*
*Next update in: 15 minutes*`,
    };

    setBriefing(mockBriefing);
    setIsLoading(false);

    // Simulate periodic updates
    const interval = setInterval(() => {
      const updates = [
        'Institutional flow detected in AI sector',
        'Whale accumulation pattern confirmed',
        'Social sentiment divergence widening',
        'Liquidity conditions improving',
        'New narrative emerging: Gaming + AI',
      ];

      setBriefing(prev => prev ? {
        ...prev,
        timestamp: new Date().toISOString(),
        content: prev.content.replace(
          /\*Generated: .*\*/,
          `*Generated: ${new Date().toLocaleTimeString()}*`
        ),
      } : null);
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [subscribe]);

  // Simple markdown renderer for basic formatting
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm text-gray-300">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={index} className="text-sm font-semibold text-blue-400 mt-3 mb-2">
            {line.substring(4)}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-base font-bold text-white mt-4 mb-2">
            {line.substring(3)}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        flushList();
        elements.push(
          <h5 key={index} className="text-xs font-semibold text-gray-400 mt-2 mb-1">
            {line.substring(5)}
          </h5>
        );
      }
      // Lists
      else if (line.trim().startsWith('- ')) {
        inList = true;
        const item = line.trim().substring(2);
        // Parse bold text
        const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
        listItems.push(formattedItem);
      }
      // Numbered lists
      else if (line.match(/^\d+\. /)) {
        flushList();
        const item = line.replace(/^\d+\. /, '');
        const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
        elements.push(
          <div key={index} className="text-sm text-gray-300 my-1 pl-4">
            <span dangerouslySetInnerHTML={{ __html: formattedItem }} />
          </div>
        );
      }
      // Horizontal rule
      else if (line.trim() === '---') {
        flushList();
        elements.push(<hr key={index} className="border-gray-800 my-3" />);
      }
      // Italic text (for timestamps)
      else if (line.trim().startsWith('*') && line.trim().endsWith('*')) {
        flushList();
        elements.push(
          <p key={index} className="text-xs text-gray-500 italic">
            {line.trim().slice(1, -1)}
          </p>
        );
      }
      // Regular paragraphs
      else if (line.trim()) {
        flushList();
        // Parse bold and other formatting
        let formattedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
          .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 py-0.5 rounded text-xs text-blue-400">$1</code>');

        elements.push(
          <p key={index} className="text-sm text-gray-300 my-2 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  if (isLoading) {
    return (
      <div className="panel h-full">
        <h3 className="panel-header">AI Market Briefing</h3>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-pulse text-gray-500 mb-2">Generating briefing...</div>
            <div className="text-xs text-gray-600">Analyzing market conditions</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="panel-header mb-0">AI Market Briefing</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      {briefing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto pr-2"
        >
          <div className="mb-2">
            <h2 className="text-lg font-bold text-white">{briefing.title}</h2>
            {briefing.narratives.length > 0 && (
              <div className="flex gap-1 mt-1">
                {briefing.narratives.map(narrative => (
                  <span
                    key={narrative}
                    className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30"
                  >
                    {narrative}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="prose prose-sm prose-invert max-w-none">
            {renderMarkdown(briefing.content)}
          </div>
        </motion.div>
      )}
    </div>
  );
}