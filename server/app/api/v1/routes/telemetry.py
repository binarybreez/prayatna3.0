from fastapi import APIRouter, HTTPException
from app.schemas.telemetry import TelemetryInput, RiskScoreOutput
from app.services.risk_service import calculate_risk_for_location
from app.services.telemetry_service import process_incoming_telemetry

router = APIRouter()


@router.post("/calculate-risk", response_model=RiskScoreOutput)
async def get_risk_assessment(payload: TelemetryInput):
    try:
        # The real Intelligence Engine takes over
        result = await calculate_risk_for_location(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/telemetry")
async def ingest_user_telemetry(payload: TelemetryInput):
    try:
        result = await process_incoming_telemetry(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))