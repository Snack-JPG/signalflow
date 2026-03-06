# SignalFlow — Unified Crypto Intelligence Command Center

**What:** A single command center UI that combines QuantFlow (order book intelligence) and NarrativeFlow (narrative rotation tracking) into one real-time dashboard with combined signal scoring.

**Why:** Neither tool alone gives the full picture. QuantFlow sees HOW prices move (order flow, manipulation). NarrativeFlow sees WHY they might move (narrative momentum, social sentiment). Together = institutional-grade signal.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    SignalFlow (Next.js 15)                     │
│                    Single-page Command Center                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ QuantFlow   │  │NarrativeFlow│  │ Twitter/X Embed      │ │
│  │ Backend     │  │ Backend     │  │ (free widget)        │ │
│  │ :8000       │  │ :8001       │  │ No API needed        │ │
│  │             │  │             │  │                      │ │
│  │ WebSocket:  │  │ WebSocket:  │  │ Embedded timeline    │ │
│  │ - Order book│  │ - Divergence│  │ search or KOL list   │ │
│  │ - Trades    │  │ - Alerts    │  │                      │ │
│  │ - Metrics   │  │ - Sentiment │  │                      │ │
│  │ - Patterns  │  │ - Lifecycle │  │                      │ │
│  └─────────────┘  └─────────────┘  └──────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              SIGNAL FUSION ENGINE                        ││
│  │                                                          ││
│  │  Combines both data streams into unified signals:        ││
│  │                                                          ││
│  │  Narrative momentum (NF) + Order flow direction (QF)     ││
│  │  + Social sentiment (NF) + Manipulation detection (QF)   ││
│  │  + On-chain activity (NF) + Spread/liquidity (QF)        ││
│  │  = COMBINED CONVICTION SCORE (0-100)                     ││
│  │                                                          ││
│  │  Score > 80 = HIGH CONVICTION (green)                    ││
│  │  Score 50-80 = MODERATE (yellow)                         ││
│  │  Score < 50 = LOW/CONTRARIAN (red)                       ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## Dashboard Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  SignalFlow                              [BTC/USDT ▼] [⚙️] [🔔]   │
├───────────────────┬────────────────────────┬───────────────────────┤
│                   │                        │                       │
│  NARRATIVE RADAR  │  ORDER BOOK DEPTH      │  LIVE X/TWITTER FEED  │
│                   │                        │                       │
│  ● AI      ███ 87 │  Animated depth chart  │  Embedded timeline    │
│  ● RWA     ██░ 62 │  from QuantFlow WS     │  (crypto search or    │
│  ● DePIN   █░░ 34 │  bid/ask visualization │   curated KOL list)   │
│  ● Meme    ████ 91│                        │                       │
│  ● DeFi    ██░ 55 │                        │  Free, no API cost    │
│  ● L1/L2   ███ 71 │                        │                       │
│                   │                        │                       │
├───────────────────┼────────────────────────┼───────────────────────┤
│                   │                        │                       │
│  DIVERGENCE       │  COMBINED SIGNALS      │  MICROSTRUCTURE       │
│  SIGNALS          │                        │  METRICS              │
│                   │  🟢 HIGH CONVICTION    │                       │
│  🟢 AI: Early     │  AI narrative: 87/100  │  VPIN: 0.72           │
│    Social ↑↑      │  "Social buzz + order  │  Kyle's λ: 0.0034    │
│    Price flat     │   book accumulation    │  OBI: +0.45           │
│    On-chain ↑     │   + TVL inflow"        │  Spread: 2.1 bps     │
│                   │                        │  Hurst: 0.63          │
│  🔴 NFT: Late     │  🟡 MODERATE           │  Amihud: 0.0012      │
│    Price ↑↑↑      │  DeFi: 55/100         │                       │
│    Social ↓       │  "Mixed signals"       │  [Spoofing: ⚠️]      │
│                   │                        │  [Layering: ✅]       │
│                   │                        │                       │
├───────────────────┴────────────────────────┴───────────────────────┤
│                                                                    │
│  UNIFIED ALERT FEED                                     AI BRIEF  │
│                                                                    │
│  19:42 🟢 DIVERGENCE: AI narrative momentum +340% vs price +2%    │
│  19:38 ⚠️  SPOOFING: $2.4M sell wall appeared and vanished (BTC)  │
│  19:35 🔵 LIFECYCLE: RWA moved from Emerging → Mainstream          │
│  19:31 🟢 ACCUMULATION: DePIN low social but TVL +12% 24h         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Build Phases

### Phase 1: Foundation + Signal Fusion Engine (Backend)
- [ ] FastAPI backend that connects to both QuantFlow and NarrativeFlow APIs
- [ ] Signal Fusion Engine: combines data from both systems
  - Narrative momentum score (from NF) 
  - Order flow direction (from QF: OBI, OFI)
  - Social sentiment strength (from NF)
  - Manipulation detection flags (from QF)
  - On-chain activity delta (from NF: TVL, active addresses)
  - Liquidity metrics (from QF: spread, VPIN, Amihud)
- [ ] Combined Conviction Score algorithm (weighted composite, 0-100)
- [ ] WebSocket endpoint broadcasting unified signals
- [ ] Docker Compose orchestrating all 3 services (QF backend, NF backend, SF backend)
- [ ] Health check endpoints for all connected services

### Phase 2: Command Center Frontend
- [ ] Next.js 15 app with dark theme, grid-based layout
- [ ] Narrative Radar panel (left): momentum bars per narrative from NF
- [ ] Order Book Depth panel (center): real-time depth chart from QF WebSocket
- [ ] Twitter/X Feed panel (right): embedded timeline widget (free)
- [ ] Divergence Signals panel: real-time divergence alerts from NF
- [ ] Combined Signals panel: conviction scores with explanations
- [ ] Microstructure Metrics panel: live metrics from QF
- [ ] Unified Alert Feed: merged alerts from both systems, chronological
- [ ] AI Briefing sidebar: latest narrative briefing from NF
- [ ] Responsive grid with resizable panels (desktop-optimised)
- [ ] Connection status indicators for all backends
- [ ] Asset selector dropdown (BTC/USDT, ETH/USDT, SOL/USDT)

### Phase 3: Polish + Deploy
- [ ] README with architecture diagram, screenshots placeholder, methodology
- [ ] Docker Compose for full stack (QF + NF + SF + Redis + DB)
- [ ] GitHub Actions CI/CD
- [ ] Performance: efficient WebSocket multiplexing, no unnecessary re-renders
- [ ] Error handling: graceful degradation if one backend is down
- [ ] Tests for signal fusion logic
- [ ] API documentation

---

## Signal Fusion Algorithm

```python
def compute_conviction(narrative: str, qf_data: dict, nf_data: dict) -> ConvictionScore:
    """
    Combines QuantFlow + NarrativeFlow signals into a single conviction score.
    
    Weights (tunable):
    - Narrative momentum: 25%
    - Order flow direction: 20%  
    - Social sentiment: 15%
    - On-chain activity: 20%
    - Liquidity health: 10%
    - Manipulation risk: 10% (negative — reduces score)
    """
    
    narrative_score = nf_data['momentum_score']          # 0-100 from NF
    orderflow_score = normalize(qf_data['obi'])          # -1 to 1 → 0-100
    sentiment_score = nf_data['sentiment_strength']      # 0-100 from NF
    onchain_score = nf_data['onchain_delta']             # 0-100 from NF
    liquidity_score = inverse(qf_data['vpin'])           # high VPIN = bad
    manipulation_penalty = qf_data['alert_severity']     # reduces score
    
    raw = (
        narrative_score * 0.25 +
        orderflow_score * 0.20 +
        sentiment_score * 0.15 +
        onchain_score * 0.20 +
        liquidity_score * 0.10
    ) - manipulation_penalty * 0.10
    
    return ConvictionScore(
        score=clamp(raw, 0, 100),
        level='HIGH' if raw > 80 else 'MODERATE' if raw > 50 else 'LOW',
        explanation=generate_explanation(components)
    )
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI |
| Signal Fusion | Custom scoring engine |
| Frontend | Next.js 15, Tailwind CSS, D3.js |
| Twitter Embed | Twitter widget.js (free) |
| Charts | TradingView Lightweight Charts, Recharts |
| Real-time | WebSocket (connects to QF + NF + broadcasts unified) |
| Orchestration | Docker Compose |
| CI/CD | GitHub Actions |

---

## Relationship to Other Projects

```
QuantFlow (github.com/Snack-JPG/quantflow)
    │ Order book data, metrics, pattern detection
    │
    └───► SignalFlow (this project)
              │ Unified command center
    ┌───► Combines both into conviction scores
    │
NarrativeFlow (github.com/Snack-JPG/narrativeflow)  
    │ Narrative sentiment, divergence, on-chain data
```

Three repos, one system. Each works independently. Together they're greater than the sum of parts.
</content>
</invoke>