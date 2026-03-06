"""
QuantFlow WebSocket Client
Connects to QuantFlow backend to receive order book metrics, patterns, and trade data
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Callable
import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException

logger = logging.getLogger(__name__)


class QuantFlowClient:
    """Client for connecting to QuantFlow WebSocket API"""

    def __init__(self, base_url: str = "ws://localhost:8000"):
        self.base_url = base_url
        self.ws_url = f"{base_url}/ws"
        self.websocket = None
        self.connected = False
        self.reconnect_interval = 5
        self.max_reconnect_interval = 60
        self.current_reconnect_interval = self.reconnect_interval

        # Data storage
        self.latest_metrics = {}
        self.latest_patterns = []
        self.latest_trades = []
        self.latest_alerts = []

        # Callbacks
        self.on_metrics_update = None
        self.on_pattern_detected = None
        self.on_trade_update = None
        self.on_alert = None

    async def connect(self):
        """Connect to QuantFlow WebSocket"""
        while True:
            try:
                logger.info(f"Connecting to QuantFlow at {self.ws_url}")
                self.websocket = await websockets.connect(self.ws_url)
                self.connected = True
                self.current_reconnect_interval = self.reconnect_interval
                logger.info("Successfully connected to QuantFlow")

                # Start listening for messages
                await self._listen()

            except ConnectionClosed:
                logger.warning("QuantFlow connection closed, reconnecting...")
                self.connected = False
                await self._handle_reconnect()

            except WebSocketException as e:
                logger.error(f"QuantFlow WebSocket error: {e}")
                self.connected = False
                await self._handle_reconnect()

            except Exception as e:
                logger.error(f"Unexpected error connecting to QuantFlow: {e}")
                self.connected = False
                await self._handle_reconnect()

    async def _listen(self):
        """Listen for messages from QuantFlow"""
        try:
            async for message in self.websocket:
                await self._process_message(message)
        except Exception as e:
            logger.error(f"Error listening to QuantFlow: {e}")
            raise

    async def _process_message(self, message: str):
        """Process incoming message from QuantFlow"""
        try:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "metrics":
                await self._handle_metrics(data.get("data", {}))

            elif msg_type == "pattern":
                await self._handle_pattern(data.get("data", {}))

            elif msg_type == "trade":
                await self._handle_trade(data.get("data", {}))

            elif msg_type == "alert":
                await self._handle_alert(data.get("data", {}))

            elif msg_type == "heartbeat":
                # Keep connection alive
                pass

            else:
                logger.warning(f"Unknown message type from QuantFlow: {msg_type}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse QuantFlow message: {e}")
        except Exception as e:
            logger.error(f"Error processing QuantFlow message: {e}")

    async def _handle_metrics(self, data: Dict[str, Any]):
        """Handle metrics update"""
        self.latest_metrics = {
            "obi": data.get("obi", 0),  # Order Book Imbalance
            "vpin": data.get("vpin", 0),  # Volume-synchronized PIN
            "spread": data.get("spread", 0),  # Bid-ask spread
            "kyles_lambda": data.get("kyles_lambda", 0),  # Kyle's Lambda
            "ofi": data.get("ofi", 0),  # Order Flow Imbalance
            "amihud": data.get("amihud", 0),  # Amihud illiquidity
            "hurst": data.get("hurst", 0.5),  # Hurst exponent
            "timestamp": datetime.utcnow().isoformat()
        }

        if self.on_metrics_update:
            await self.on_metrics_update(self.latest_metrics)

    async def _handle_pattern(self, data: Dict[str, Any]):
        """Handle pattern detection alert"""
        pattern = {
            "type": data.get("pattern_type"),
            "confidence": data.get("confidence", 0),
            "description": data.get("description", ""),
            "timestamp": datetime.utcnow().isoformat()
        }
        self.latest_patterns.append(pattern)

        # Keep only last 100 patterns
        if len(self.latest_patterns) > 100:
            self.latest_patterns = self.latest_patterns[-100:]

        if self.on_pattern_detected:
            await self.on_pattern_detected(pattern)

    async def _handle_trade(self, data: Dict[str, Any]):
        """Handle trade update"""
        trade = {
            "price": data.get("price", 0),
            "volume": data.get("volume", 0),
            "side": data.get("side", "unknown"),
            "timestamp": data.get("timestamp", datetime.utcnow().isoformat())
        }
        self.latest_trades.append(trade)

        # Keep only last 1000 trades
        if len(self.latest_trades) > 1000:
            self.latest_trades = self.latest_trades[-1000:]

        if self.on_trade_update:
            await self.on_trade_update(trade)

    async def _handle_alert(self, data: Dict[str, Any]):
        """Handle manipulation or anomaly alert"""
        alert = {
            "type": data.get("alert_type", "unknown"),
            "severity": data.get("severity", "low"),
            "message": data.get("message", ""),
            "details": data.get("details", {}),
            "timestamp": datetime.utcnow().isoformat()
        }
        self.latest_alerts.append(alert)

        # Keep only last 100 alerts
        if len(self.latest_alerts) > 100:
            self.latest_alerts = self.latest_alerts[-100:]

        if self.on_alert:
            await self.on_alert(alert)

    async def _handle_reconnect(self):
        """Handle reconnection with exponential backoff"""
        await asyncio.sleep(self.current_reconnect_interval)
        self.current_reconnect_interval = min(
            self.current_reconnect_interval * 2,
            self.max_reconnect_interval
        )

    async def disconnect(self):
        """Disconnect from QuantFlow"""
        self.connected = False
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
        logger.info("Disconnected from QuantFlow")

    def is_connected(self) -> bool:
        """Check if connected to QuantFlow"""
        return self.connected

    def get_latest_metrics(self) -> Dict[str, Any]:
        """Get latest order book metrics"""
        return self.latest_metrics.copy()

    def get_latest_patterns(self, limit: int = 10) -> list:
        """Get recent pattern detections"""
        return self.latest_patterns[-limit:] if self.latest_patterns else []

    def get_latest_alerts(self, limit: int = 10) -> list:
        """Get recent alerts"""
        return self.latest_alerts[-limit:] if self.latest_alerts else []

    def set_metrics_callback(self, callback: Callable):
        """Set callback for metrics updates"""
        self.on_metrics_update = callback

    def set_pattern_callback(self, callback: Callable):
        """Set callback for pattern detection"""
        self.on_pattern_detected = callback

    def set_trade_callback(self, callback: Callable):
        """Set callback for trade updates"""
        self.on_trade_update = callback

    def set_alert_callback(self, callback: Callable):
        """Set callback for alerts"""
        self.on_alert = callback