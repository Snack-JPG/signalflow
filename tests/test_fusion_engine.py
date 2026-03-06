"""
Tests for Signal Fusion Engine
"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch, MagicMock

from fusion.engine import SignalFusionEngine
from models.signals import ConvictionScore, CombinedAlert


class TestSignalFusionEngine:
    """Test suite for the Signal Fusion Engine"""

    @pytest.fixture
    def mock_qf_client(self):
        """Mock QuantFlow client"""
        client = Mock()
        client.is_connected = Mock(return_value=True)
        client.get_latest_metrics = Mock(return_value={
            "obi": 0.5,  # Bullish
            "vpin": 0.3,  # Good liquidity
            "spread": 0.002,  # 20 bps
            "kyles_lambda": 0.003,
            "ofi": 0.4,
            "amihud": 0.001,
            "hurst": 0.6
        })
        client.get_latest_alerts = Mock(return_value=[])
        client.set_metrics_callback = Mock()
        client.set_alert_callback = Mock()
        return client

    @pytest.fixture
    def mock_nf_client(self):
        """Mock NarrativeFlow client"""
        client = Mock()
        client.is_connected = Mock(return_value=True)
        client.get_all_narratives = Mock(return_value=["AI", "DeFi", "RWA"])
        client.get_narrative_data = Mock(return_value={
            "momentum_score": 75,
            "social_velocity": 100,
            "on_chain_delta": 25,
            "trending_rank": 1,
            "price_change_24h": 10,
            "volume_change_24h": 50,
            "tvl": 1000000000,
            "active_addresses": 50000
        })
        client.get_sentiment_score = Mock(return_value={
            "overall_sentiment": 60,
            "sentiment_strength": 70,
            "bullish_percentage": 75,
            "fear_greed_index": 65,
            "social_dominance": 15
        })
        client.get_lifecycle_stage = Mock(return_value={
            "stage": "growing",
            "days_in_stage": 15,
            "transition_probability": 0.3
        })
        client.get_divergence_signals = Mock(return_value=[])
        client.set_narrative_callback = Mock()
        client.set_divergence_callback = Mock()
        client.set_alert_callback = Mock()
        return client

    @pytest.fixture
    def mock_ws_manager(self):
        """Mock WebSocket manager"""
        manager = Mock()
        manager.active_connections = []
        manager.broadcast = AsyncMock()
        return manager

    @pytest.fixture
    def engine(self, mock_qf_client, mock_nf_client, mock_ws_manager):
        """Create fusion engine with mocked clients"""
        return SignalFusionEngine(mock_qf_client, mock_nf_client, mock_ws_manager)

    @pytest.mark.asyncio
    async def test_compute_conviction_score(self, engine):
        """Test conviction score computation"""
        score = await engine._compute_conviction_score("AI")

        assert score is not None
        assert isinstance(score, ConvictionScore)
        assert score.narrative == "AI"
        assert 0 <= score.score <= 100
        assert score.level in ["HIGH", "MODERATE", "LOW"]
        assert len(score.explanation) > 0
        assert "components" in score.dict()

    @pytest.mark.asyncio
    async def test_high_conviction_score(self, engine, mock_nf_client):
        """Test high conviction score scenario"""
        # Setup very bullish signals
        mock_nf_client.get_narrative_data.return_value = {
            "momentum_score": 90,
            "on_chain_delta": 80
        }
        mock_nf_client.get_sentiment_score.return_value = {
            "sentiment_strength": 85
        }

        score = await engine._compute_conviction_score("AI")

        assert score.score > 80
        assert score.level == "HIGH"

    @pytest.mark.asyncio
    async def test_low_conviction_score(self, engine, mock_nf_client):
        """Test low conviction score scenario"""
        # Setup bearish signals
        mock_nf_client.get_narrative_data.return_value = {
            "momentum_score": 20,
            "on_chain_delta": -30
        }
        mock_nf_client.get_sentiment_score.return_value = {
            "sentiment_strength": 15
        }

        score = await engine._compute_conviction_score("AI")

        assert score.score < 50
        assert score.level == "LOW"

    def test_normalize_obi(self, engine):
        """Test OBI normalization"""
        assert engine._normalize_obi(-1) == 0
        assert engine._normalize_obi(0) == 50
        assert engine._normalize_obi(1) == 100
        assert engine._normalize_obi(0.5) == 75

    def test_normalize_sentiment(self, engine):
        """Test sentiment normalization"""
        assert engine._normalize_sentiment(0) == 0
        assert engine._normalize_sentiment(50) == 50
        assert engine._normalize_sentiment(100) == 100
        assert engine._normalize_sentiment(150) == 100  # Capped at 100
        assert engine._normalize_sentiment(-10) == 0  # Floored at 0

    def test_normalize_onchain(self, engine):
        """Test on-chain delta normalization"""
        assert engine._normalize_onchain(-100) == 0
        assert engine._normalize_onchain(0) == 50
        assert engine._normalize_onchain(100) == 100
        assert engine._normalize_onchain(50) == 75

    def test_calculate_liquidity_score(self, engine):
        """Test liquidity score calculation"""
        metrics = {
            "vpin": 0.2,  # Good liquidity
            "spread": 0.001,  # 10 bps
            "amihud": 0.0005
        }
        score = engine._calculate_liquidity_score(metrics)

        assert 0 <= score <= 100
        assert score > 50  # Should be good with these metrics

    def test_calculate_manipulation_penalty(self, engine, mock_qf_client):
        """Test manipulation penalty calculation"""
        # No alerts - no penalty
        mock_qf_client.get_latest_alerts.return_value = []
        penalty = engine._calculate_manipulation_penalty()
        assert penalty == 0

        # High severity alerts - high penalty
        mock_qf_client.get_latest_alerts.return_value = [
            {"severity": "critical"},
            {"severity": "high"},
            {"severity": "medium"}
        ]
        penalty = engine._calculate_manipulation_penalty()
        assert penalty > 50

    def test_generate_explanation(self, engine):
        """Test explanation generation"""
        components = {
            "narrative_momentum": 85,
            "order_flow": 75,
            "sentiment": 80,
            "on_chain": 70,
            "liquidity": 60,
            "manipulation_penalty": 5
        }

        explanation = engine._generate_explanation("AI", components, "growing")

        assert "AI" in explanation
        assert "Strong" in explanation or "momentum" in explanation
        assert "growing" in explanation

    @pytest.mark.asyncio
    async def test_update_all_conviction_scores(self, engine, mock_nf_client):
        """Test updating all conviction scores"""
        await engine._update_all_conviction_scores()

        # Should have scores for all narratives
        assert len(engine.conviction_scores) == 3
        assert "AI" in engine.conviction_scores
        assert "DeFi" in engine.conviction_scores
        assert "RWA" in engine.conviction_scores

    def test_get_combined_alerts(self, engine):
        """Test getting combined alerts"""
        # Add some test alerts
        alert1 = CombinedAlert(
            source="quantflow",
            type="spoofing",
            severity="high",
            message="Spoofing detected",
            timestamp=datetime.utcnow()
        )
        alert2 = CombinedAlert(
            source="narrativeflow",
            type="divergence",
            severity="medium",
            message="Divergence detected",
            timestamp=datetime.utcnow()
        )

        engine.combined_alerts.append(alert1)
        engine.combined_alerts.append(alert2)

        alerts = engine.get_combined_alerts(limit=2)
        assert len(alerts) == 2
        assert alerts[0] == alert1
        assert alerts[1] == alert2

    def test_get_conviction_history(self, engine):
        """Test getting conviction history"""
        # Add some history
        narrative = "AI"
        score1 = ConvictionScore(
            narrative=narrative,
            score=75,
            level="MODERATE",
            explanation="Test",
            components={},
            timestamp=datetime.utcnow()
        )
        score2 = ConvictionScore(
            narrative=narrative,
            score=85,
            level="HIGH",
            explanation="Test",
            components={},
            timestamp=datetime.utcnow()
        )

        engine._update_history(narrative, score1)
        engine._update_history(narrative, score2)

        history = engine.get_conviction_history(narrative, hours=1)
        assert len(history) == 2
        assert history[0]["score"] == 75
        assert history[1]["score"] == 85

    def test_check_health(self, engine, mock_qf_client, mock_nf_client):
        """Test health checking"""
        # Both connected - no warnings
        engine._check_health()
        assert len(engine.warnings) == 0

        # QuantFlow disconnected
        mock_qf_client.is_connected.return_value = False
        engine._check_health()
        assert len(engine.warnings) == 1
        assert "QuantFlow" in engine.warnings[0]

        # Both disconnected
        mock_nf_client.is_connected.return_value = False
        engine._check_health()
        assert len(engine.warnings) == 2

    @pytest.mark.asyncio
    async def test_broadcast_signals(self, engine, mock_ws_manager):
        """Test broadcasting signals"""
        # Add a connected client
        mock_ws_manager.active_connections = [Mock()]

        # Add some data
        engine.conviction_scores["AI"] = ConvictionScore(
            narrative="AI",
            score=75,
            level="MODERATE",
            explanation="Test",
            components={},
            timestamp=datetime.utcnow()
        )

        await engine._broadcast_signals()

        # Should have called broadcast
        mock_ws_manager.broadcast.assert_called_once()
        call_args = mock_ws_manager.broadcast.call_args[0][0]
        assert "conviction_scores" in call_args
        assert "latest_alerts" in call_args
        assert "qf_metrics" in call_args