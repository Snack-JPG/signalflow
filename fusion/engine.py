"""
Signal Fusion Engine
Combines QuantFlow and NarrativeFlow signals into unified conviction scores
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import deque

from models.signals import ConvictionScore, CombinedAlert, UnifiedSignal

logger = logging.getLogger(__name__)


class SignalFusionEngine:
    """Engine that fuses signals from QuantFlow and NarrativeFlow"""

    def __init__(self, qf_client, nf_client, ws_manager):
        self.qf_client = qf_client
        self.nf_client = nf_client
        self.ws_manager = ws_manager

        # Storage for conviction scores and history
        self.conviction_scores = {}
        self.conviction_history = {}  # narrative -> deque of (timestamp, score)
        self.combined_alerts = deque(maxlen=1000)

        # Configuration for conviction scoring
        self.weights = {
            "narrative_momentum": 0.25,
            "order_flow": 0.20,
            "sentiment": 0.15,
            "on_chain": 0.20,
            "liquidity": 0.10,
            "manipulation_penalty": 0.10
        }

        # Warnings for degraded state
        self.warnings = []

        # Control flag
        self.running = False

        # Setup callbacks
        self._setup_callbacks()

    def _setup_callbacks(self):
        """Setup callbacks for client updates"""
        # QuantFlow callbacks
        self.qf_client.set_metrics_callback(self._on_qf_metrics_update)
        self.qf_client.set_alert_callback(self._on_qf_alert)

        # NarrativeFlow callbacks
        self.nf_client.set_narrative_callback(self._on_nf_narrative_update)
        self.nf_client.set_divergence_callback(self._on_nf_divergence_signal)
        self.nf_client.set_alert_callback(self._on_nf_alert)

    async def run(self):
        """Main loop for the fusion engine"""
        self.running = True
        logger.info("Signal Fusion Engine started")

        while self.running:
            try:
                # Update conviction scores for all narratives
                await self._update_all_conviction_scores()

                # Broadcast unified signals
                await self._broadcast_signals()

                # Check system health
                self._check_health()

                # Wait before next update
                await asyncio.sleep(1)  # Update every second

            except Exception as e:
                logger.error(f"Error in fusion engine loop: {e}")
                await asyncio.sleep(5)

    async def stop(self):
        """Stop the fusion engine"""
        self.running = False
        logger.info("Signal Fusion Engine stopped")

    async def _update_all_conviction_scores(self):
        """Update conviction scores for all tracked narratives"""
        narratives = self.nf_client.get_all_narratives()

        for narrative in narratives:
            score = await self._compute_conviction_score(narrative)
            if score:
                self.conviction_scores[narrative] = score
                self._update_history(narrative, score)

    async def _compute_conviction_score(self, narrative: str) -> Optional[ConvictionScore]:
        """
        Compute conviction score for a narrative combining QF and NF signals
        Algorithm based on spec: weighted combination of multiple factors
        """
        try:
            # Get NarrativeFlow data
            nf_data = self.nf_client.get_narrative_data(narrative)
            sentiment = self.nf_client.get_sentiment_score(narrative)
            lifecycle = self.nf_client.get_lifecycle_stage(narrative)

            # Get QuantFlow metrics
            qf_metrics = self.qf_client.get_latest_metrics()

            # Check if we have enough data
            if not nf_data or not qf_metrics:
                return None

            # Calculate component scores (normalize to 0-100)
            narrative_score = nf_data.get("momentum_score", 50)
            orderflow_score = self._normalize_obi(qf_metrics.get("obi", 0))
            sentiment_score = self._normalize_sentiment(sentiment.get("sentiment_strength", 50))
            onchain_score = self._normalize_onchain(nf_data.get("on_chain_delta", 0))
            liquidity_score = self._calculate_liquidity_score(qf_metrics)
            manipulation_penalty = self._calculate_manipulation_penalty()

            # Apply weights
            raw_score = (
                narrative_score * self.weights["narrative_momentum"] +
                orderflow_score * self.weights["order_flow"] +
                sentiment_score * self.weights["sentiment"] +
                onchain_score * self.weights["on_chain"] +
                liquidity_score * self.weights["liquidity"]
            ) - (manipulation_penalty * self.weights["manipulation_penalty"])

            # Clamp to 0-100
            final_score = max(0, min(100, raw_score))

            # Determine conviction level
            if final_score > 80:
                level = "HIGH"
            elif final_score > 50:
                level = "MODERATE"
            else:
                level = "LOW"

            # Generate explanation
            explanation = self._generate_explanation(
                narrative=narrative,
                components={
                    "narrative_momentum": narrative_score,
                    "order_flow": orderflow_score,
                    "sentiment": sentiment_score,
                    "on_chain": onchain_score,
                    "liquidity": liquidity_score,
                    "manipulation": manipulation_penalty
                },
                lifecycle_stage=lifecycle.get("stage", "unknown")
            )

            return ConvictionScore(
                narrative=narrative,
                score=final_score,
                level=level,
                explanation=explanation,
                components={
                    "narrative_momentum": narrative_score,
                    "order_flow": orderflow_score,
                    "sentiment": sentiment_score,
                    "on_chain": onchain_score,
                    "liquidity": liquidity_score,
                    "manipulation_penalty": manipulation_penalty
                },
                timestamp=datetime.utcnow()
            )

        except Exception as e:
            logger.error(f"Error computing conviction score for {narrative}: {e}")
            return None

    def _normalize_obi(self, obi: float) -> float:
        """Normalize Order Book Imbalance from [-1, 1] to [0, 100]"""
        # OBI ranges from -1 (heavy sell pressure) to 1 (heavy buy pressure)
        return (obi + 1) * 50

    def _normalize_sentiment(self, strength: float) -> float:
        """Normalize sentiment strength to 0-100"""
        # Already in 0-100 range
        return min(100, max(0, strength))

    def _normalize_onchain(self, delta: float) -> float:
        """Normalize on-chain activity delta to 0-100"""
        # Delta could be negative (decline) or positive (growth)
        # Map -100% to 100% change to 0-100 score
        return min(100, max(0, (delta + 100) / 2))

    def _calculate_liquidity_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate liquidity health score from QF metrics"""
        vpin = metrics.get("vpin", 0.5)
        spread = metrics.get("spread", 0.001)
        amihud = metrics.get("amihud", 0.001)

        # VPIN: lower is better (0 = perfect liquidity, 1 = toxic)
        vpin_score = (1 - vpin) * 100

        # Spread: lower is better (normalize assuming 0-1% range)
        spread_score = max(0, 100 - (spread * 10000))  # basis points

        # Amihud: lower is better (price impact)
        amihud_score = max(0, 100 - (amihud * 1000))

        # Average the liquidity metrics
        return (vpin_score + spread_score + amihud_score) / 3

    def _calculate_manipulation_penalty(self) -> float:
        """Calculate penalty based on recent manipulation alerts"""
        recent_alerts = self.qf_client.get_latest_alerts(10)

        if not recent_alerts:
            return 0

        # Calculate severity-weighted penalty
        penalty = 0
        severity_weights = {"critical": 30, "high": 20, "medium": 10, "low": 5}

        for alert in recent_alerts:
            severity = alert.get("severity", "low")
            penalty += severity_weights.get(severity, 0)

        # Cap at 100
        return min(100, penalty)

    def _generate_explanation(self, narrative: str, components: Dict, lifecycle_stage: str) -> str:
        """Generate natural language explanation for conviction score"""
        explanations = []

        # Narrative momentum
        if components["narrative_momentum"] > 70:
            explanations.append(f"Strong {narrative} narrative momentum")
        elif components["narrative_momentum"] < 30:
            explanations.append(f"Weak {narrative} narrative momentum")

        # Order flow
        if components["order_flow"] > 70:
            explanations.append("bullish order book accumulation")
        elif components["order_flow"] < 30:
            explanations.append("bearish order book distribution")

        # Sentiment
        if components["sentiment"] > 70:
            explanations.append("highly positive social sentiment")
        elif components["sentiment"] < 30:
            explanations.append("negative social sentiment")

        # On-chain
        if components["on_chain"] > 70:
            explanations.append("increasing on-chain activity")
        elif components["on_chain"] < 30:
            explanations.append("declining on-chain activity")

        # Liquidity
        if components["liquidity"] > 70:
            explanations.append("healthy liquidity conditions")
        elif components["liquidity"] < 30:
            explanations.append("poor liquidity conditions")

        # Manipulation
        if components["manipulation_penalty"] > 20:
            explanations.append("HIGH manipulation risk detected")

        # Lifecycle context
        if lifecycle_stage:
            explanations.append(f"in {lifecycle_stage} lifecycle phase")

        # Combine into sentence
        if explanations:
            return f"{narrative}: " + ", ".join(explanations)
        else:
            return f"{narrative}: Mixed signals across metrics"

    def _update_history(self, narrative: str, score: ConvictionScore):
        """Update conviction score history"""
        if narrative not in self.conviction_history:
            self.conviction_history[narrative] = deque(maxlen=10000)  # Keep ~3 hours at 1s intervals

        self.conviction_history[narrative].append({
            "timestamp": score.timestamp,
            "score": score.score,
            "level": score.level
        })

    async def _broadcast_signals(self):
        """Broadcast unified signals to all connected WebSocket clients"""
        if not self.ws_manager.active_connections:
            return

        # Prepare unified signal
        signal = UnifiedSignal(
            conviction_scores=self.conviction_scores,
            latest_alerts=list(self.combined_alerts)[-10:] if self.combined_alerts else [],
            qf_metrics=self.qf_client.get_latest_metrics(),
            divergence_signals=self.nf_client.get_divergence_signals(5),
            timestamp=datetime.utcnow()
        )

        # Broadcast to all clients
        await self.ws_manager.broadcast(signal.dict())

    def _check_health(self):
        """Check health of connected services and update warnings"""
        self.warnings.clear()

        if not self.qf_client.is_connected():
            self.warnings.append("QuantFlow disconnected - order book data unavailable")

        if not self.nf_client.is_connected():
            self.warnings.append("NarrativeFlow disconnected - narrative data unavailable")

        if self.warnings:
            logger.warning(f"System degraded: {', '.join(self.warnings)}")

    # Callback handlers
    async def _on_qf_metrics_update(self, metrics: Dict[str, Any]):
        """Handle QuantFlow metrics update"""
        # Metrics update will trigger score recalculation in main loop
        pass

    async def _on_qf_alert(self, alert: Dict[str, Any]):
        """Handle QuantFlow alert"""
        combined_alert = CombinedAlert(
            source="quantflow",
            type=alert.get("type", "unknown"),
            severity=alert.get("severity", "low"),
            message=alert.get("message", ""),
            details=alert.get("details", {}),
            timestamp=datetime.fromisoformat(alert.get("timestamp", datetime.utcnow().isoformat()))
        )
        self.combined_alerts.append(combined_alert)

    async def _on_nf_narrative_update(self, narrative: str, data: Dict[str, Any]):
        """Handle NarrativeFlow narrative update"""
        # Narrative update will trigger score recalculation in main loop
        pass

    async def _on_nf_divergence_signal(self, signal: Dict[str, Any]):
        """Handle NarrativeFlow divergence signal"""
        # Create alert for significant divergences
        if signal.get("strength", 0) > 70:
            combined_alert = CombinedAlert(
                source="narrativeflow",
                type="divergence",
                severity="high" if signal.get("strength", 0) > 85 else "medium",
                message=f"Strong divergence detected: {signal.get('message', '')}",
                details=signal,
                timestamp=datetime.fromisoformat(signal.get("timestamp", datetime.utcnow().isoformat()))
            )
            self.combined_alerts.append(combined_alert)

    async def _on_nf_alert(self, alert: Dict[str, Any]):
        """Handle NarrativeFlow alert"""
        combined_alert = CombinedAlert(
            source="narrativeflow",
            type=alert.get("type", "unknown"),
            severity=alert.get("severity", "low"),
            message=alert.get("message", ""),
            details=alert.get("details", {}),
            timestamp=datetime.fromisoformat(alert.get("timestamp", datetime.utcnow().isoformat()))
        )
        self.combined_alerts.append(combined_alert)

    # Public methods for REST endpoints
    def get_current_conviction_scores(self) -> Dict[str, ConvictionScore]:
        """Get current conviction scores for all narratives"""
        return self.conviction_scores.copy()

    def get_combined_alerts(self, limit: int = 50) -> List[CombinedAlert]:
        """Get recent combined alerts"""
        return list(self.combined_alerts)[-limit:] if self.combined_alerts else []

    def get_conviction_history(self, narrative: str, hours: int = 24) -> List[Dict]:
        """Get conviction score history for a narrative"""
        if narrative not in self.conviction_history:
            return []

        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        history = []

        for entry in self.conviction_history[narrative]:
            if entry["timestamp"] >= cutoff_time:
                history.append({
                    "timestamp": entry["timestamp"].isoformat(),
                    "score": entry["score"],
                    "level": entry["level"]
                })

        return history

    def get_warnings(self) -> List[str]:
        """Get current system warnings"""
        return self.warnings.copy()