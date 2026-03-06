"""
NarrativeFlow WebSocket Client
Connects to NarrativeFlow backend to receive narrative momentum, divergence signals, sentiment scores
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Callable, List
import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException

logger = logging.getLogger(__name__)


class NarrativeFlowClient:
    """Client for connecting to NarrativeFlow WebSocket API"""

    def __init__(self, base_url: str = "ws://localhost:8001"):
        self.base_url = base_url
        self.ws_url = f"{base_url}/ws"
        self.websocket = None
        self.connected = False
        self.reconnect_interval = 5
        self.max_reconnect_interval = 60
        self.current_reconnect_interval = self.reconnect_interval

        # Data storage
        self.narrative_data = {}  # Store data per narrative
        self.divergence_signals = []
        self.sentiment_scores = {}
        self.lifecycle_stages = {}
        self.ai_briefings = {}
        self.latest_alerts = []

        # Callbacks
        self.on_narrative_update = None
        self.on_divergence_signal = None
        self.on_sentiment_update = None
        self.on_lifecycle_change = None
        self.on_ai_briefing = None
        self.on_alert = None

    async def connect(self):
        """Connect to NarrativeFlow WebSocket"""
        while True:
            try:
                logger.info(f"Connecting to NarrativeFlow at {self.ws_url}")
                self.websocket = await websockets.connect(self.ws_url)
                self.connected = True
                self.current_reconnect_interval = self.reconnect_interval
                logger.info("Successfully connected to NarrativeFlow")

                # Start listening for messages
                await self._listen()

            except ConnectionClosed:
                logger.warning("NarrativeFlow connection closed, reconnecting...")
                self.connected = False
                await self._handle_reconnect()

            except WebSocketException as e:
                logger.error(f"NarrativeFlow WebSocket error: {e}")
                self.connected = False
                await self._handle_reconnect()

            except Exception as e:
                logger.error(f"Unexpected error connecting to NarrativeFlow: {e}")
                self.connected = False
                await self._handle_reconnect()

    async def _listen(self):
        """Listen for messages from NarrativeFlow"""
        try:
            async for message in self.websocket:
                await self._process_message(message)
        except Exception as e:
            logger.error(f"Error listening to NarrativeFlow: {e}")
            raise

    async def _process_message(self, message: str):
        """Process incoming message from NarrativeFlow"""
        try:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "narrative_momentum":
                await self._handle_narrative_momentum(data.get("data", {}))

            elif msg_type == "divergence":
                await self._handle_divergence(data.get("data", {}))

            elif msg_type == "sentiment":
                await self._handle_sentiment(data.get("data", {}))

            elif msg_type == "lifecycle":
                await self._handle_lifecycle(data.get("data", {}))

            elif msg_type == "ai_briefing":
                await self._handle_ai_briefing(data.get("data", {}))

            elif msg_type == "alert":
                await self._handle_alert(data.get("data", {}))

            elif msg_type == "heartbeat":
                # Keep connection alive
                pass

            else:
                logger.warning(f"Unknown message type from NarrativeFlow: {msg_type}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse NarrativeFlow message: {e}")
        except Exception as e:
            logger.error(f"Error processing NarrativeFlow message: {e}")

    async def _handle_narrative_momentum(self, data: Dict[str, Any]):
        """Handle narrative momentum update"""
        narrative = data.get("narrative", "unknown")

        self.narrative_data[narrative] = {
            "momentum_score": data.get("momentum_score", 0),  # 0-100
            "social_velocity": data.get("social_velocity", 0),
            "on_chain_delta": data.get("on_chain_delta", 0),  # TVL, active addresses change
            "trending_rank": data.get("trending_rank", 999),
            "price_change_24h": data.get("price_change_24h", 0),
            "volume_change_24h": data.get("volume_change_24h", 0),
            "tvl": data.get("tvl", 0),
            "active_addresses": data.get("active_addresses", 0),
            "timestamp": datetime.utcnow().isoformat()
        }

        if self.on_narrative_update:
            await self.on_narrative_update(narrative, self.narrative_data[narrative])

    async def _handle_divergence(self, data: Dict[str, Any]):
        """Handle divergence signal"""
        signal = {
            "narrative": data.get("narrative", "unknown"),
            "type": data.get("divergence_type", "unknown"),  # early, late, contrarian
            "social_direction": data.get("social_direction", 0),  # -1, 0, 1
            "price_direction": data.get("price_direction", 0),
            "on_chain_direction": data.get("on_chain_direction", 0),
            "strength": data.get("strength", 0),  # 0-100
            "message": data.get("message", ""),
            "timestamp": datetime.utcnow().isoformat()
        }
        self.divergence_signals.append(signal)

        # Keep only last 100 signals
        if len(self.divergence_signals) > 100:
            self.divergence_signals = self.divergence_signals[-100:]

        if self.on_divergence_signal:
            await self.on_divergence_signal(signal)

    async def _handle_sentiment(self, data: Dict[str, Any]):
        """Handle sentiment update"""
        narrative = data.get("narrative", "unknown")

        self.sentiment_scores[narrative] = {
            "overall_sentiment": data.get("overall_sentiment", 0),  # -100 to 100
            "sentiment_strength": data.get("sentiment_strength", 0),  # 0-100
            "bullish_percentage": data.get("bullish_percentage", 50),
            "fear_greed_index": data.get("fear_greed_index", 50),
            "social_dominance": data.get("social_dominance", 0),
            "timestamp": datetime.utcnow().isoformat()
        }

        if self.on_sentiment_update:
            await self.on_sentiment_update(narrative, self.sentiment_scores[narrative])

    async def _handle_lifecycle(self, data: Dict[str, Any]):
        """Handle lifecycle stage update"""
        narrative = data.get("narrative", "unknown")

        self.lifecycle_stages[narrative] = {
            "stage": data.get("stage", "unknown"),  # emerging, growing, mainstream, declining
            "days_in_stage": data.get("days_in_stage", 0),
            "transition_probability": data.get("transition_probability", 0),
            "next_likely_stage": data.get("next_likely_stage", "unknown"),
            "timestamp": datetime.utcnow().isoformat()
        }

        if self.on_lifecycle_change:
            await self.on_lifecycle_change(narrative, self.lifecycle_stages[narrative])

    async def _handle_ai_briefing(self, data: Dict[str, Any]):
        """Handle AI-generated narrative briefing"""
        narrative = data.get("narrative", "unknown")

        self.ai_briefings[narrative] = {
            "summary": data.get("summary", ""),
            "key_developments": data.get("key_developments", []),
            "risks": data.get("risks", []),
            "opportunities": data.get("opportunities", []),
            "timestamp": datetime.utcnow().isoformat()
        }

        if self.on_ai_briefing:
            await self.on_ai_briefing(narrative, self.ai_briefings[narrative])

    async def _handle_alert(self, data: Dict[str, Any]):
        """Handle narrative alert"""
        alert = {
            "narrative": data.get("narrative", "unknown"),
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
        """Disconnect from NarrativeFlow"""
        self.connected = False
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
        logger.info("Disconnected from NarrativeFlow")

    def is_connected(self) -> bool:
        """Check if connected to NarrativeFlow"""
        return self.connected

    def get_narrative_data(self, narrative: str) -> Dict[str, Any]:
        """Get data for specific narrative"""
        return self.narrative_data.get(narrative, {})

    def get_all_narratives(self) -> List[str]:
        """Get list of all tracked narratives"""
        return list(self.narrative_data.keys())

    def get_divergence_signals(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent divergence signals"""
        return self.divergence_signals[-limit:] if self.divergence_signals else []

    def get_sentiment_score(self, narrative: str) -> Dict[str, Any]:
        """Get sentiment score for narrative"""
        return self.sentiment_scores.get(narrative, {})

    def get_lifecycle_stage(self, narrative: str) -> Dict[str, Any]:
        """Get lifecycle stage for narrative"""
        return self.lifecycle_stages.get(narrative, {})

    def get_ai_briefing(self, narrative: str) -> Dict[str, Any]:
        """Get AI briefing for narrative"""
        return self.ai_briefings.get(narrative, {})

    def get_latest_alerts(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent alerts"""
        return self.latest_alerts[-limit:] if self.latest_alerts else []

    def set_narrative_callback(self, callback: Callable):
        """Set callback for narrative updates"""
        self.on_narrative_update = callback

    def set_divergence_callback(self, callback: Callable):
        """Set callback for divergence signals"""
        self.on_divergence_signal = callback

    def set_sentiment_callback(self, callback: Callable):
        """Set callback for sentiment updates"""
        self.on_sentiment_update = callback

    def set_lifecycle_callback(self, callback: Callable):
        """Set callback for lifecycle changes"""
        self.on_lifecycle_change = callback

    def set_ai_briefing_callback(self, callback: Callable):
        """Set callback for AI briefings"""
        self.on_ai_briefing = callback

    def set_alert_callback(self, callback: Callable):
        """Set callback for alerts"""
        self.on_alert = callback