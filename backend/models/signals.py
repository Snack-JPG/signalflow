"""
Data models for SignalFlow
"""

from datetime import datetime
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class ConvictionScore(BaseModel):
    """Unified conviction score for a narrative"""
    narrative: str
    score: float = Field(ge=0, le=100)
    level: str  # HIGH, MODERATE, LOW
    explanation: str
    components: Dict[str, float]
    timestamp: datetime


class CombinedAlert(BaseModel):
    """Alert from either QuantFlow or NarrativeFlow"""
    source: str  # "quantflow" or "narrativeflow"
    type: str
    severity: str  # critical, high, medium, low
    message: str
    details: Dict[str, Any] = {}
    timestamp: datetime


class ServiceHealth(BaseModel):
    """Health status of all services"""
    status: str  # healthy, degraded, unhealthy
    services: Dict[str, str]
    timestamp: datetime
    warnings: List[str] = []


class UnifiedSignal(BaseModel):
    """Unified signal broadcast via WebSocket"""
    conviction_scores: Dict[str, ConvictionScore]
    latest_alerts: List[CombinedAlert]
    qf_metrics: Dict[str, Any]
    divergence_signals: List[Dict[str, Any]]
    timestamp: datetime


class OrderBookMetrics(BaseModel):
    """Order book metrics from QuantFlow"""
    obi: float  # Order Book Imbalance
    vpin: float  # Volume-synchronized PIN
    spread: float  # Bid-ask spread
    kyles_lambda: float  # Kyle's Lambda
    ofi: float  # Order Flow Imbalance
    amihud: float  # Amihud illiquidity
    hurst: float  # Hurst exponent
    timestamp: str


class NarrativeMetrics(BaseModel):
    """Narrative metrics from NarrativeFlow"""
    narrative: str
    momentum_score: float
    sentiment_strength: float
    on_chain_delta: float
    social_velocity: float
    lifecycle_stage: str
    timestamp: str