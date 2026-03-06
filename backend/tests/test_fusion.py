"""
Tests for the Signal Fusion Engine
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
from fusion.engine import SignalFusionEngine
from fusion.scoring import compute_conviction, ConvictionScore
from fusion.models import (
    NarrativeData,
    QuantFlowData,
    UnifiedSignal,
    ConvictionLevel
)


class TestSignalFusionEngine:
    """Test suite for SignalFusionEngine"""

    @pytest.fixture
    def engine(self):
        """Create a SignalFusionEngine instance"""
        return SignalFusionEngine()

    @pytest.fixture
    def mock_qf_data(self):
        """Mock QuantFlow data"""
        return QuantFlowData(
            obi=0.45,  # Order Book Imbalance
            ofi=1200,  # Order Flow Imbalance
            vpin=0.72,  # Volume-synchronized Probability of Informed Trading
            kyle_lambda=0.0034,
            spread=2.1,
            amihud_illiquidity=0.0012,
            hurst_exponent=0.63,
            spoofing_detected=False,
            layering_detected=False,
            manipulation_score=5
        )

    @pytest.fixture
    def mock_nf_data(self):
        """Mock NarrativeFlow data"""
        return NarrativeData(
            narrative="AI",
            momentum_score=87,
            sentiment_strength=85,
            social_buzz=92,
            onchain_delta=90,
            tvl_change=12.5,
            active_addresses_change=8.3,
            lifecycle_stage="emerging",
            divergence_detected=True,
            divergence_type="early"
        )

    @pytest.mark.asyncio
    async def test_process_signals(self, engine, mock_qf_data, mock_nf_data):
        """Test signal processing"""
        result = await engine.process_signals("AI", mock_qf_data, mock_nf_data)

        assert isinstance(result, UnifiedSignal)
        assert result.narrative == "AI"
        assert 0 <= result.conviction_score <= 100
        assert result.level in ["HIGH", "MODERATE", "LOW"]
        assert result.timestamp is not None

    @pytest.mark.asyncio
    async def test_high_conviction_signal(self, engine, mock_qf_data, mock_nf_data):
        """Test high conviction score calculation"""
        # Set up high conviction data
        mock_nf_data.momentum_score = 95
        mock_nf_data.sentiment_strength = 90
        mock_nf_data.onchain_delta = 88
        mock_qf_data.obi = 0.8  # Strong buy imbalance
        mock_qf_data.vpin = 0.3  # Low VPIN is good
        mock_qf_data.manipulation_score = 0

        result = await engine.process_signals("AI", mock_qf_data, mock_nf_data)

        assert result.conviction_score > 80
        assert result.level == "HIGH"
        assert "Strong momentum" in result.explanation

    @pytest.mark.asyncio
    async def test_low_conviction_with_manipulation(self, engine, mock_qf_data, mock_nf_data):
        """Test low conviction when manipulation is detected"""
        # Set up manipulation scenario
        mock_qf_data.spoofing_detected = True
        mock_qf_data.layering_detected = True
        mock_qf_data.manipulation_score = 85
        mock_nf_data.momentum_score = 30
        mock_nf_data.sentiment_strength = 25

        result = await engine.process_signals("MEME", mock_qf_data, mock_nf_data)

        assert result.conviction_score < 50
        assert result.level == "LOW"
        assert "manipulation" in result.explanation.lower()

    @pytest.mark.asyncio
    async def test_divergence_signal(self, engine, mock_qf_data, mock_nf_data):
        """Test divergence detection and scoring"""
        # Set up divergence scenario
        mock_nf_data.divergence_detected = True
        mock_nf_data.divergence_type = "early"
        mock_nf_data.social_buzz = 95
        mock_qf_data.obi = -0.2  # Negative order flow

        result = await engine.process_signals("RWA", mock_qf_data, mock_nf_data)

        assert result.divergence_signal is not None
        assert result.divergence_signal["type"] == "early"
        assert result.divergence_signal["strength"] > 0

    @pytest.mark.asyncio
    async def test_connect_to_backends(self, engine):
        """Test backend connection handling"""
        with patch('aiohttp.ClientSession.ws_connect') as mock_connect:
            mock_ws = AsyncMock()
            mock_connect.return_value = mock_ws

            await engine.connect_to_quantflow("ws://localhost:8000")
            await engine.connect_to_narrativeflow("ws://localhost:8001")

            assert mock_connect.call_count == 2

    @pytest.mark.asyncio
    async def test_broadcast_unified_signal(self, engine):
        """Test WebSocket broadcast"""
        mock_websocket = Mock()
        engine.connected_clients.add(mock_websocket)

        signal = UnifiedSignal(
            narrative="DeFi",
            conviction_score=75,
            level="MODERATE",
            components={},
            explanation="Test signal",
            timestamp=datetime.now()
        )

        await engine.broadcast_signal(signal)
        mock_websocket.send_json.assert_called_once()


class TestConvictionScoring:
    """Test suite for conviction scoring algorithm"""

    def test_compute_conviction_balanced(self):
        """Test balanced conviction scoring"""
        qf_data = {
            'obi': 0.5,
            'vpin': 0.5,
            'alert_severity': 10
        }
        nf_data = {
            'momentum_score': 70,
            'sentiment_strength': 65,
            'onchain_delta': 75
        }

        score = compute_conviction("TEST", qf_data, nf_data)

        assert isinstance(score, ConvictionScore)
        assert 50 <= score.score <= 80
        assert score.level == "MODERATE"

    def test_compute_conviction_high(self):
        """Test high conviction scoring"""
        qf_data = {
            'obi': 0.9,
            'vpin': 0.2,  # Low VPIN is good
            'alert_severity': 0
        }
        nf_data = {
            'momentum_score': 95,
            'sentiment_strength': 90,
            'onchain_delta': 92
        }

        score = compute_conviction("AI", qf_data, nf_data)

        assert score.score > 80
        assert score.level == "HIGH"

    def test_compute_conviction_with_penalty(self):
        """Test conviction scoring with manipulation penalty"""
        qf_data = {
            'obi': 0.7,
            'vpin': 0.4,
            'alert_severity': 90  # High manipulation
        }
        nf_data = {
            'momentum_score': 80,
            'sentiment_strength': 75,
            'onchain_delta': 78
        }

        score = compute_conviction("SCAM", qf_data, nf_data)

        # Score should be reduced by manipulation penalty
        assert score.score < 70
        assert "manipulation" in score.explanation.lower()

    def test_normalize_obi(self):
        """Test OBI normalization"""
        from fusion.scoring import normalize_obi

        assert normalize_obi(1.0) == 100  # Max buy pressure
        assert normalize_obi(-1.0) == 0   # Max sell pressure
        assert normalize_obi(0.0) == 50   # Neutral

    def test_inverse_vpin(self):
        """Test VPIN inverse scoring"""
        from fusion.scoring import inverse_vpin

        assert inverse_vpin(0.0) == 100  # Perfect liquidity
        assert inverse_vpin(1.0) == 0    # Worst liquidity
        assert inverse_vpin(0.5) == 50   # Medium liquidity


class TestModels:
    """Test suite for data models"""

    def test_narrative_data_validation(self):
        """Test NarrativeData model validation"""
        data = NarrativeData(
            narrative="AI",
            momentum_score=87,
            sentiment_strength=85,
            social_buzz=92,
            onchain_delta=90,
            tvl_change=12.5,
            active_addresses_change=8.3,
            lifecycle_stage="emerging",
            divergence_detected=True,
            divergence_type="early"
        )

        assert data.narrative == "AI"
        assert 0 <= data.momentum_score <= 100
        assert data.lifecycle_stage in ["emerging", "mainstream", "declining"]

    def test_quantflow_data_validation(self):
        """Test QuantFlowData model validation"""
        data = QuantFlowData(
            obi=0.45,
            ofi=1200,
            vpin=0.72,
            kyle_lambda=0.0034,
            spread=2.1,
            amihud_illiquidity=0.0012,
            hurst_exponent=0.63,
            spoofing_detected=False,
            layering_detected=False,
            manipulation_score=5
        )

        assert -1 <= data.obi <= 1
        assert 0 <= data.vpin <= 1
        assert 0 <= data.manipulation_score <= 100

    def test_unified_signal_serialization(self):
        """Test UnifiedSignal serialization"""
        signal = UnifiedSignal(
            narrative="DeFi",
            conviction_score=75,
            level="MODERATE",
            components={
                "narrative_momentum": 70,
                "order_flow": 65,
                "social_sentiment": 72,
                "onchain_activity": 78,
                "liquidity_health": 80,
                "manipulation_risk": 10
            },
            explanation="Moderate momentum with good liquidity",
            timestamp=datetime.now()
        )

        json_data = signal.to_json()

        assert json_data["narrative"] == "DeFi"
        assert json_data["conviction_score"] == 75
        assert "components" in json_data
        assert "timestamp" in json_data


class TestIntegration:
    """Integration tests for the full signal flow"""

    @pytest.mark.asyncio
    async def test_full_signal_pipeline(self):
        """Test the complete signal processing pipeline"""
        engine = SignalFusionEngine()

        # Mock backend connections
        with patch.object(engine, 'fetch_quantflow_data') as mock_qf:
            with patch.object(engine, 'fetch_narrativeflow_data') as mock_nf:
                mock_qf.return_value = QuantFlowData(
                    obi=0.6,
                    ofi=1500,
                    vpin=0.4,
                    kyle_lambda=0.003,
                    spread=1.8,
                    amihud_illiquidity=0.001,
                    hurst_exponent=0.65,
                    spoofing_detected=False,
                    layering_detected=False,
                    manipulation_score=8
                )

                mock_nf.return_value = NarrativeData(
                    narrative="L1/L2",
                    momentum_score=72,
                    sentiment_strength=68,
                    social_buzz=70,
                    onchain_delta=75,
                    tvl_change=5.2,
                    active_addresses_change=3.8,
                    lifecycle_stage="mainstream",
                    divergence_detected=False,
                    divergence_type=None
                )

                # Process signals
                result = await engine.run_fusion_cycle("L1/L2")

                assert result is not None
                assert result.narrative == "L1/L2"
                assert 50 <= result.conviction_score <= 80
                assert result.level == "MODERATE"

    @pytest.mark.asyncio
    async def test_error_handling(self):
        """Test error handling in signal processing"""
        engine = SignalFusionEngine()

        with patch.object(engine, 'fetch_quantflow_data') as mock_qf:
            mock_qf.side_effect = Exception("Connection failed")

            # Should handle error gracefully
            result = await engine.run_fusion_cycle("TEST")

            assert result is None or result.conviction_score == 0

    @pytest.mark.asyncio
    async def test_concurrent_signal_processing(self):
        """Test concurrent processing of multiple narratives"""
        engine = SignalFusionEngine()
        narratives = ["AI", "DeFi", "RWA", "Meme", "L1/L2"]

        with patch.object(engine, 'process_signals') as mock_process:
            mock_process.return_value = UnifiedSignal(
                narrative="TEST",
                conviction_score=70,
                level="MODERATE",
                components={},
                explanation="Test",
                timestamp=datetime.now()
            )

            # Process multiple narratives concurrently
            import asyncio
            tasks = [engine.process_signals(n, Mock(), Mock()) for n in narratives]
            results = await asyncio.gather(*tasks)

            assert len(results) == len(narratives)
            assert all(r.conviction_score == 70 for r in results)