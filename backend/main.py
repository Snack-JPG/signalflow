"""
SignalFlow - Signal Fusion Engine
Combines QuantFlow and NarrativeFlow signals into unified conviction scores
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from clients.quantflow_client import QuantFlowClient
from clients.narrativeflow_client import NarrativeFlowClient
from fusion.engine import SignalFusionEngine
from models.signals import ConvictionScore, CombinedAlert, ServiceHealth
from utils.websocket_manager import WebSocketManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global instances
qf_client: Optional[QuantFlowClient] = None
nf_client: Optional[NarrativeFlowClient] = None
fusion_engine: Optional[SignalFusionEngine] = None
ws_manager: WebSocketManager = WebSocketManager()


async def monitor_backend_health():
    """Monitor backend health and attempt reconnection if needed"""
    while True:
        try:
            # Check QuantFlow connection
            if qf_client and not qf_client.is_connected():
                logger.warning("QuantFlow disconnected, attempting reconnection...")
                try:
                    await qf_client.connect()
                    logger.info("Successfully reconnected to QuantFlow")
                except Exception as e:
                    logger.error(f"Failed to reconnect to QuantFlow: {e}")

            # Check NarrativeFlow connection
            if nf_client and not nf_client.is_connected():
                logger.warning("NarrativeFlow disconnected, attempting reconnection...")
                try:
                    await nf_client.connect()
                    logger.info("Successfully reconnected to NarrativeFlow")
                except Exception as e:
                    logger.error(f"Failed to reconnect to NarrativeFlow: {e}")

            await asyncio.sleep(30)  # Check every 30 seconds

        except Exception as e:
            logger.error(f"Error in health monitor: {e}")
            await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown"""
    global qf_client, nf_client, fusion_engine

    # Startup
    logger.info("Starting SignalFlow backend...")

    # Initialize clients with error handling
    qf_client = QuantFlowClient("ws://localhost:8000")
    nf_client = NarrativeFlowClient("ws://localhost:8001")
    fusion_engine = SignalFusionEngine(qf_client, nf_client, ws_manager)

    # Try to connect to services with graceful degradation
    try:
        await qf_client.connect()
        logger.info("Connected to QuantFlow backend")
    except Exception as e:
        logger.warning(f"Failed to connect to QuantFlow: {e}. Running in degraded mode.")
        # Continue without QuantFlow - will use partial data

    try:
        await nf_client.connect()
        logger.info("Connected to NarrativeFlow backend")
    except Exception as e:
        logger.warning(f"Failed to connect to NarrativeFlow: {e}. Running in degraded mode.")
        # Continue without NarrativeFlow - will use partial data

    # Start fusion engine background task with reconnection logic
    asyncio.create_task(fusion_engine.run_with_reconnection())

    # Start health check monitor
    asyncio.create_task(monitor_backend_health())

    logger.info("SignalFlow backend started successfully")

    yield

    # Shutdown
    logger.info("Shutting down SignalFlow backend...")

    if qf_client:
        await qf_client.disconnect()
    if nf_client:
        await nf_client.disconnect()
    if fusion_engine:
        await fusion_engine.stop()

    logger.info("SignalFlow backend shut down")


# Create FastAPI app
app = FastAPI(
    title="SignalFlow API",
    description="Unified crypto intelligence signal fusion engine",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REST Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {
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


@app.get("/signals/conviction")
async def get_conviction_scores() -> Dict[str, ConvictionScore]:
    """Get current conviction scores for all narratives"""
    if not fusion_engine:
        raise HTTPException(status_code=503, detail="Fusion engine not initialized")

    try:
        scores = fusion_engine.get_current_conviction_scores()

        # Add degradation warning if running with partial data
        qf_connected = qf_client and qf_client.is_connected()
        nf_connected = nf_client and nf_client.is_connected()

        if not (qf_connected and nf_connected):
            for score in scores.values():
                if hasattr(score, 'warnings'):
                    if not qf_connected:
                        score.warnings.append("QuantFlow data unavailable - using partial signals")
                    if not nf_connected:
                        score.warnings.append("NarrativeFlow data unavailable - using partial signals")

        return scores

    except Exception as e:
        logger.error(f"Error getting conviction scores: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving conviction scores: {str(e)}")


@app.get("/signals/combined-alerts")
async def get_combined_alerts(limit: int = 50) -> List[CombinedAlert]:
    """Get merged alert feed from both systems"""
    if not fusion_engine:
        raise HTTPException(status_code=503, detail="Fusion engine not initialized")

    return fusion_engine.get_combined_alerts(limit=limit)


@app.get("/signals/health")
async def get_health_status() -> ServiceHealth:
    """Health check for all connected services"""
    qf_status = "connected" if qf_client and qf_client.is_connected() else "disconnected"
    nf_status = "connected" if nf_client and nf_client.is_connected() else "disconnected"

    # Determine overall health
    if qf_status == "connected" and nf_status == "connected":
        overall_status = "healthy"
    elif qf_status == "connected" or nf_status == "connected":
        overall_status = "degraded"
    else:
        overall_status = "unhealthy"

    return ServiceHealth(
        status=overall_status,
        services={
            "quantflow": qf_status,
            "narrativeflow": nf_status,
            "signalflow": "running"
        },
        timestamp=datetime.utcnow(),
        warnings=fusion_engine.get_warnings() if fusion_engine else []
    )


@app.get("/signals/history")
async def get_conviction_history(
    narrative: str,
    hours: int = 24
) -> List[Dict]:
    """Get conviction score history for a specific narrative"""
    if not fusion_engine:
        raise HTTPException(status_code=503, detail="Fusion engine not initialized")

    return fusion_engine.get_conviction_history(narrative, hours)


# WebSocket Endpoint

@app.websocket("/ws/signals")
async def websocket_signals(websocket: WebSocket):
    """WebSocket endpoint for real-time unified signals"""
    await ws_manager.connect(websocket)
    logger.info("New WebSocket connection established")

    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()

            # Handle subscription requests if needed
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)