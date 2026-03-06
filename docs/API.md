# SignalFlow API Documentation

## Overview

The SignalFlow API provides real-time unified crypto intelligence by combining signals from QuantFlow (order book intelligence) and NarrativeFlow (narrative rotation tracking). The API offers both REST endpoints for querying current state and WebSocket connections for real-time updates.

## Base URL

```
http://localhost:8002
```

## Authentication

Currently, the API does not require authentication. In production, implement appropriate authentication mechanisms.

## REST Endpoints

### Root Endpoint

```http
GET /
```

Returns service information and available endpoints.

**Response:**
```json
{
  "service": "SignalFlow",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "websocket": "/ws/signals",
    "conviction": "/signals/conviction",
    "alerts": "/signals/combined-alerts",
    "health": "/signals/health",
    "history": "/signals/history"
  }
}
```

### Get Conviction Scores

```http
GET /signals/conviction
```

Returns current conviction scores for all tracked narratives.

**Response:**
```json
{
  "AI": {
    "narrative": "AI",
    "score": 87,
    "level": "HIGH",
    "explanation": "AI: Strong AI narrative momentum, bullish order book accumulation, highly positive social sentiment, increasing on-chain activity",
    "components": {
      "narrative_momentum": 92,
      "order_flow": 78,
      "sentiment": 85,
      "on_chain": 90,
      "liquidity": 82,
      "manipulation_penalty": 5
    },
    "timestamp": "2024-01-01T12:00:00Z"
  },
  "DeFi": {
    "narrative": "DeFi",
    "score": 55,
    "level": "MODERATE",
    "explanation": "DeFi: Mixed signals across metrics, in mainstream lifecycle phase",
    "components": {
      "narrative_momentum": 60,
      "order_flow": 45,
      "sentiment": 52,
      "on_chain": 58,
      "liquidity": 70,
      "manipulation_penalty": 10
    },
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Success
- `500 Internal Server Error`: Error retrieving scores
- `503 Service Unavailable`: Fusion engine not initialized

**Degraded Mode:**
When one or more backends are unavailable, the response will include warnings in the explanation field.

### Get Combined Alerts

```http
GET /signals/combined-alerts?limit=50
```

Returns merged alert feed from both QuantFlow and NarrativeFlow systems.

**Query Parameters:**
- `limit` (integer, optional): Maximum number of alerts to return. Default: 50

**Response:**
```json
[
  {
    "source": "quantflow",
    "type": "spoofing",
    "severity": "high",
    "message": "Spoofing detected: $2.4M sell wall appeared and vanished",
    "details": {
      "asset": "BTC/USDT",
      "price": 45000,
      "volume": 2400000
    },
    "timestamp": "2024-01-01T11:58:00Z"
  },
  {
    "source": "narrativeflow",
    "type": "divergence",
    "severity": "medium",
    "message": "Strong divergence detected: AI narrative momentum +340% vs price +2%",
    "details": {
      "narrative": "AI",
      "momentum_change": 340,
      "price_change": 2
    },
    "timestamp": "2024-01-01T11:55:00Z"
  }
]
```

**Status Codes:**
- `200 OK`: Success
- `503 Service Unavailable`: Fusion engine not initialized

### Health Check

```http
GET /signals/health
```

Returns health status of all connected services.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "quantflow": "connected",
    "narrativeflow": "connected",
    "signalflow": "running"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "warnings": []
}
```

**Health Status Values:**
- `healthy`: All services connected and running
- `degraded`: At least one service connected
- `unhealthy`: No external services connected

**Service Status Values:**
- `connected`: Service is connected and responding
- `disconnected`: Service is not connected
- `running`: SignalFlow service is operational

**Status Codes:**
- `200 OK`: Always returns 200, check `status` field for health

### Get Conviction History

```http
GET /signals/history?narrative=AI&hours=24
```

Returns conviction score history for a specific narrative.

**Query Parameters:**
- `narrative` (string, required): Narrative identifier (e.g., "AI", "DeFi", "RWA")
- `hours` (integer, optional): Hours of history to return. Default: 24

**Response:**
```json
[
  {
    "timestamp": "2024-01-01T00:00:00Z",
    "score": 75,
    "level": "MODERATE"
  },
  {
    "timestamp": "2024-01-01T00:01:00Z",
    "score": 76,
    "level": "MODERATE"
  },
  {
    "timestamp": "2024-01-01T00:02:00Z",
    "score": 78,
    "level": "MODERATE"
  }
]
```

**Status Codes:**
- `200 OK`: Success (returns empty array if narrative not found)
- `503 Service Unavailable`: Fusion engine not initialized

## WebSocket Endpoint

### Unified Signals Stream

```
ws://localhost:8002/ws/signals
```

Real-time stream of unified signals combining QuantFlow and NarrativeFlow data.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8002/ws/signals');

ws.onopen = () => {
  console.log('Connected to SignalFlow');
};

ws.onmessage = (event) => {
  const signal = JSON.parse(event.data);
  console.log('Received signal:', signal);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from SignalFlow');
};

// Ping/Pong for keepalive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send('ping');
  }
}, 30000);
```

**Message Format:**

Outgoing (Client to Server):
```json
{
  "type": "ping"
}
```

Incoming (Server to Client):
```json
{
  "type": "signal_update",
  "data": {
    "conviction_scores": {
      "AI": {
        "score": 87,
        "level": "HIGH",
        "explanation": "Strong momentum with aligned order flow"
      }
    },
    "latest_alerts": [
      {
        "source": "quantflow",
        "type": "manipulation",
        "severity": "high",
        "message": "Spoofing detected on BTC/USDT"
      }
    ],
    "qf_metrics": {
      "obi": 0.45,
      "vpin": 0.72,
      "spread": 2.1,
      "kyle_lambda": 0.0034
    },
    "divergence_signals": [
      {
        "narrative": "AI",
        "type": "early",
        "strength": 85,
        "message": "Social momentum diverging from price"
      }
    ],
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Signal Update Fields:**
- `conviction_scores`: Current conviction scores for all narratives
- `latest_alerts`: Most recent alerts from both systems
- `qf_metrics`: Latest QuantFlow microstructure metrics
- `divergence_signals`: Active divergence signals from NarrativeFlow
- `timestamp`: Server timestamp of the update

## Error Handling

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Server-side error
- `503 Service Unavailable`: Service temporarily unavailable

### Graceful Degradation

When one or more backend services are unavailable, the API continues to operate with partial data:

1. **Partial Conviction Scores**: Scores calculated using available data sources
2. **Cached Data**: Uses last known good values when real-time data unavailable
3. **Warning Messages**: Includes degradation warnings in responses
4. **Health Endpoint**: Reports degraded status with specific service failures

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing:
- REST endpoints: 100 requests per minute per IP
- WebSocket connections: 10 concurrent connections per IP

## Data Types

### ConvictionScore

```typescript
interface ConvictionScore {
  narrative: string;
  score: number;        // 0-100
  level: "HIGH" | "MODERATE" | "LOW";
  explanation: string;
  components: {
    narrative_momentum: number;
    order_flow: number;
    sentiment: number;
    on_chain: number;
    liquidity: number;
    manipulation_penalty: number;
  };
  timestamp: string;    // ISO 8601
}
```

### CombinedAlert

```typescript
interface CombinedAlert {
  source: "quantflow" | "narrativeflow";
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  details: object;
  timestamp: string;    // ISO 8601
}
```

### ServiceHealth

```typescript
interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  services: {
    quantflow: "connected" | "disconnected";
    narrativeflow: "connected" | "disconnected";
    signalflow: "running";
  };
  timestamp: string;    // ISO 8601
  warnings: string[];
}
```

## Examples

### Python Example

```python
import requests
import websocket
import json

# REST API Example
def get_conviction_scores():
    response = requests.get("http://localhost:8002/signals/conviction")
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None

# WebSocket Example
def on_message(ws, message):
    data = json.loads(message)
    if data.get("type") == "signal_update":
        print(f"Conviction scores: {data['data']['conviction_scores']}")

def on_error(ws, error):
    print(f"WebSocket error: {error}")

def on_close(ws):
    print("WebSocket connection closed")

def on_open(ws):
    print("WebSocket connection opened")

# Connect to WebSocket
ws = websocket.WebSocketApp("ws://localhost:8002/ws/signals",
                            on_open=on_open,
                            on_message=on_message,
                            on_error=on_error,
                            on_close=on_close)

ws.run_forever()
```

### JavaScript/TypeScript Example

```typescript
// REST API Example
async function getConvictionScores() {
  try {
    const response = await fetch('http://localhost:8002/signals/conviction');
    if (response.ok) {
      const scores = await response.json();
      console.log('Conviction scores:', scores);
      return scores;
    }
  } catch (error) {
    console.error('Error fetching conviction scores:', error);
  }
}

// WebSocket Example
class SignalFlowClient {
  private ws: WebSocket;

  connect() {
    this.ws = new WebSocket('ws://localhost:8002/ws/signals');

    this.ws.onopen = () => {
      console.log('Connected to SignalFlow');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'signal_update') {
        this.handleSignalUpdate(data.data);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from SignalFlow');
      // Implement reconnection logic
      setTimeout(() => this.connect(), 5000);
    };
  }

  private handleSignalUpdate(data: any) {
    console.log('New signal update:', data);
    // Process conviction scores, alerts, etc.
  }
}

// Usage
const client = new SignalFlowClient();
client.connect();
```

## Best Practices

1. **Connection Management**: Implement reconnection logic for WebSocket connections
2. **Error Handling**: Always handle potential errors and degraded states
3. **Rate Limiting**: Respect rate limits to avoid being throttled
4. **Caching**: Cache conviction scores locally to reduce API calls
5. **Monitoring**: Monitor the health endpoint to detect service issues
6. **Graceful Degradation**: Handle partial data scenarios when backends are unavailable

## Support

For issues or questions about the API, please refer to the [GitHub repository](https://github.com/yourusername/signal-flow) or open an issue.