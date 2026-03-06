'use client';

import { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { OrderBookData } from '@/lib/types';
import * as d3 from 'd3';

export default function OrderBookDepth() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('order_book', (data: OrderBookData) => {
      setOrderBook(data);
    });

    return unsubscribe;
  }, [subscribe]);

  useEffect(() => {
    if (!orderBook || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll('*').remove();

    // Calculate cumulative volumes
    const bidsCumulative = orderBook.bids.map((bid, i) => ({
      price: bid[0],
      volume: orderBook.bids.slice(0, i + 1).reduce((sum, b) => sum + b[1], 0),
      type: 'bid'
    }));

    const asksCumulative = orderBook.asks.map((ask, i) => ({
      price: ask[0],
      volume: orderBook.asks.slice(0, i + 1).reduce((sum, a) => sum + a[1], 0),
      type: 'ask'
    }));

    const allData = [...bidsCumulative, ...asksCumulative];
    const maxVolume = Math.max(...allData.map(d => d.volume));
    const priceExtent = d3.extent(allData, d => d.price) as [number, number];

    // Scales
    const xScale = d3.scaleLinear()
      .domain(priceExtent)
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, maxVolume])
      .range([innerHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.1);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.1);

    // Area generators
    const areaGenerator = d3.area<{ price: number; volume: number }>()
      .x(d => xScale(d.price))
      .y0(innerHeight)
      .y1(d => yScale(d.volume))
      .curve(d3.curveStep);

    // Bid area
    g.append('path')
      .datum(bidsCumulative)
      .attr('d', areaGenerator)
      .attr('fill', '#22c55e')
      .attr('opacity', 0.3);

    // Ask area
    g.append('path')
      .datum(asksCumulative)
      .attr('d', areaGenerator)
      .attr('fill', '#ef4444')
      .attr('opacity', 0.3);

    // Bid line
    g.append('path')
      .datum(bidsCumulative)
      .attr('d', d3.line<{ price: number; volume: number }>()
        .x(d => xScale(d.price))
        .y(d => yScale(d.volume))
        .curve(d3.curveStep)
      )
      .attr('fill', 'none')
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 2);

    // Ask line
    g.append('path')
      .datum(asksCumulative)
      .attr('d', d3.line<{ price: number; volume: number }>()
        .x(d => xScale(d.price))
        .y(d => yScale(d.volume))
        .curve(d3.curveStep)
      )
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2);

    // Mid price line
    if (orderBook.midPrice) {
      g.append('line')
        .attr('x1', xScale(orderBook.midPrice))
        .attr('y1', 0)
        .attr('x2', xScale(orderBook.midPrice))
        .attr('y2', innerHeight)
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.7);

      g.append('text')
        .attr('x', xScale(orderBook.midPrice))
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#3b82f6')
        .style('font-size', '11px')
        .text(`Mid: ${orderBook.midPrice.toFixed(2)}`);
    }

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => d3.format(',.0f')(d)))
      .style('color', '#94a3b8');

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(d => d3.format(',.0f')(d)))
      .style('color', '#94a3b8');

    // Labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', '#94a3b8')
      .style('font-size', '12px')
      .text('Volume');

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + margin.bottom)
      .style('text-anchor', 'middle')
      .style('fill', '#94a3b8')
      .style('font-size', '12px')
      .text('Price');

  }, [orderBook]);

  return (
    <div className="panel h-full">
      <h3 className="panel-header">Order Book Depth</h3>
      <div className="relative flex-1">
        <svg ref={svgRef} width="100%" height="100%" className="w-full h-full" />
        {orderBook && (
          <div className="absolute top-2 right-2 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-gray-400">Bids</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-gray-400">Asks</span>
            </div>
            <div className="text-gray-400">
              Spread: {orderBook.spread.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}