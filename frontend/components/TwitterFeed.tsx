'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    twttr: any;
  }
}

export default function TwitterFeed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetLoaded = useRef(false);

  useEffect(() => {
    // Load Twitter widget script only once
    if (!widgetLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => {
        widgetLoaded.current = true;
        createTimeline();
      };
      document.head.appendChild(script);
    } else if (window.twttr?.widgets) {
      createTimeline();
    }

    function createTimeline() {
      if (containerRef.current && window.twttr?.widgets) {
        // Clear any existing widget
        containerRef.current.innerHTML = '';

        // Create timeline widget for crypto search - using URL method for better results
        window.twttr.widgets.createTimeline(
          {
            sourceType: 'url',
            url: 'https://twitter.com/search?q=crypto&f=live'
          },
          containerRef.current,
          {
            theme: 'dark',
            height: '100%',
            chrome: 'noheader nofooter noborders transparent',
            dnt: true,
            tweetLimit: 15,
          }
        ).then(() => {
          // Style the embedded timeline to match our dark theme
          const iframe = containerRef.current?.querySelector('iframe');
          if (iframe) {
            iframe.style.borderRadius = '8px';
            iframe.style.height = '100%';
          }
        });
      }
    }

    return () => {
      // Cleanup if needed
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="panel h-full">
      <h3 className="panel-header">Live X/Twitter Feed</h3>
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ minHeight: '400px' }}
      >
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="animate-pulse mb-2">Loading Twitter feed...</div>
            <div className="text-xs text-gray-600">Live crypto tweets</div>
          </div>
        </div>
      </div>
    </div>
  );
}