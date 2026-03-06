# SignalFlow — Unified Crypto Intelligence Command Center

A real-time command center that unifies [QuantFlow](https://github.com/Snack-JPG/quantflow) (order book intelligence) and [NarrativeFlow](https://github.com/Snack-JPG/narrativeflow) (narrative rotation tracking) into a single dashboard with combined signal scoring.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    SignalFlow (Next.js 15)                    │
│                 Real-time Command Center UI                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │ QuantFlow   │  │NarrativeFlow│  │ Twitter/X Feed       │ │
│  │ Backend     │  │ Backend     │  │ (Embedded Widget)    │ │
│  │ :8000       │  │ :8001       │  │                      │ │
│  │             │  │             │  │ • No API needed      │ │
│  │ WebSocket:  │  │ WebSocket:  │  │ • Free timeline      │ │
│  │ • Order book│  │ • Divergence│  │ • KOL curation       │ │
│  │ • Trades    │  │ • Alerts    │  │                      │ │
│  │ • Metrics   │  │ • Sentiment │  └──────────────────────┘ │
│  │ • Patterns  │  │ • Lifecycle │                            │
│  └─────────────┘  └─────────────┘                            │
│         ↓                ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              SIGNAL FUSION ENGINE                        ││
│  │                                                          ││
│  │  Combines both data streams into unified signals:        ││
│  │                                                          ││
│  │  • Narrative momentum (NF) + Order flow direction (QF)   ││
│  │  • Social sentiment (NF) + Manipulation detection (QF)   ││
│  │  • On-chain activity (NF) + Spread/liquidity (QF)        ││
│  │                                                          ││
│  │  Output: COMBINED CONVICTION SCORE (0-100)               ││
│  │  • Score > 80 = HIGH CONVICTION (green)                  ││
│  │  • Score 50-80 = MODERATE (yellow)                       ││
│  │  • Score < 50 = LOW/CONTRARIAN (red)                     ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

## Screenshots

![SignalFlow Dashboard](./docs/screenshots/dashboard.png)
*Main dashboard showing real-time signal fusion from QuantFlow and NarrativeFlow*

![Signal Fusion](./docs/screenshots/signal-fusion.png)
*Combined conviction scoring with detailed breakdown*

![Alert Feed](./docs/screenshots/alerts.png)
*Unified alert feed showing divergences, manipulation, and narrative shifts*

## Methodology: The Combined Signal Approach

### Why Combine QuantFlow + NarrativeFlow?

Neither tool alone provides the complete picture:
- **QuantFlow** sees HOW prices move (order flow, microstructure, manipulation patterns)
- **NarrativeFlow** sees WHY they might move (narrative momentum, social sentiment, on-chain activity)

Together they provide institutional-grade signal intelligence.

### Signal Fusion Algorithm

Our conviction scoring combines multiple data streams with weighted importance:

```python
def compute_conviction(narrative: str, qf_data: dict, nf_data: dict) -> ConvictionScore:
    """
    Weights (tunable):
    - Narrative momentum: 25%
    - Order flow direction: 20%
    - Social sentiment: 15%
    - On-chain activity: 20%
    - Liquidity health: 10%
    - Manipulation risk: 10% (penalty)
    """
```

### Key Insights

1. **Early Divergence Detection**: When narrative momentum diverges from price action
2. **Manipulation Awareness**: Real-time spoofing/layering detection from order books
3. **Lifecycle Tracking**: Know where each narrative sits (emerging → mainstream → declining)
4. **Liquidity Intelligence**: VPIN, Kyle's Lambda, and Amihud illiquidity metrics
5. **Social Validation**: Twitter sentiment aligned with on-chain activity

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.12+ (for local development)

### Running with Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/signal-flow.git
cd signal-flow

# Start all services
docker-compose up

# Services will be available at:
# - SignalFlow Frontend: http://localhost:3000
# - SignalFlow Backend: http://localhost:8002
# - QuantFlow Backend: http://localhost:8000
# - NarrativeFlow Backend: http://localhost:8001
```

### Local Development

#### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the backend
cd backend
uvicorn main:app --reload --port 8002
```

#### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev
```

## Configuration

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

**backend/.env**
```env
QUANTFLOW_API_URL=http://localhost:8000
NARRATIVEFLOW_API_URL=http://localhost:8001
REDIS_URL=redis://localhost:6379
DATABASE_URL=sqlite:///./signalflow.db
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:8002
NEXT_PUBLIC_WS_URL=ws://localhost:8002
```

### Docker Environment

All configuration is handled via `docker-compose.yml`. Modify environment variables there for production deployment.

## API Documentation

### WebSocket Endpoints

#### `/ws/unified`
Real-time unified signal stream combining QuantFlow and NarrativeFlow data.

**Message Format:**
```json
{
  "type": "signal_update",
  "data": {
    "narrative": "AI",
    "conviction_score": 87,
    "level": "HIGH",
    "components": {
      "narrative_momentum": 92,
      "order_flow": 78,
      "social_sentiment": 85,
      "onchain_activity": 90,
      "liquidity_health": 82,
      "manipulation_risk": 5
    },
    "explanation": "Strong momentum with aligned order flow",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### REST Endpoints

#### `GET /api/health`
Health check endpoint returning status of all connected services.

#### `GET /api/signals/{narrative}`
Get current signal data for a specific narrative.

#### `GET /api/alerts`
Retrieve recent alerts from both systems.

## Development

### Project Structure
```
signal-flow/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── fusion/
│   │   ├── engine.py         # Signal fusion logic
│   │   ├── scoring.py        # Conviction scoring
│   │   └── models.py         # Data models
│   ├── connectors/
│   │   ├── quantflow.py      # QuantFlow integration
│   │   └── narrativeflow.py  # NarrativeFlow integration
│   └── tests/
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Main dashboard
│   │   └── layout.tsx        # App layout
│   ├── components/
│   │   ├── NarrativeRadar.tsx
│   │   ├── OrderBookDepth.tsx
│   │   ├── SignalPanel.tsx
│   │   └── AlertFeed.tsx
│   └── lib/
│       └── websocket.ts      # WebSocket client
├── docker-compose.yml
└── .github/
    └── workflows/
        └── ci.yml            # GitHub Actions CI/CD
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### CI/CD

GitHub Actions automatically runs on push and PR:
- Linting (ESLint, Black)
- Type checking (TypeScript, mypy)
- Unit tests
- Build verification

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [QuantFlow](https://github.com/Snack-JPG/quantflow) - Order book intelligence system
- [NarrativeFlow](https://github.com/Snack-JPG/narrativeflow) - Narrative rotation tracker
- Built with Next.js 15, FastAPI, and real-time WebSocket technology

## Support

For issues, questions, or suggestions, please open an issue on GitHub or reach out via:
- GitHub Issues: [signal-flow/issues](https://github.com/yourusername/signal-flow/issues)
---

*Not financial advice. For educational and research purposes only.*