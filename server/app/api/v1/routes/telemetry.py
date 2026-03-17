from fastapi import APIRouter, HTTPException,BackgroundTasks
from app.schemas.telemetry import TelemetryInput, RiskScoreOutput
from app.services.alert_services import send_emergency_sms
from app.services.risk_service import calculate_risk_for_location, get_street_address
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
async def ingest_user_telemetry(
    payload: TelemetryInput,
    background_tasks: BackgroundTasks
):
    try:
        result = await process_incoming_telemetry(payload)

        street_name = await get_street_address(payload.latitude, payload.longitude)
        if payload.category != "user_ping":

            background_tasks.add_task(
                send_emergency_sms,
                location_name=street_name,
                hazard_type=payload.category,
                severity=9
            )
        print("trial for the twillio")
        background_tasks.add_task(
                send_emergency_sms,
                location_name=street_name,
                hazard_type=payload.category,
                severity=9
            )

        return result

    except Exception:
        raise HTTPException(status_code=500, detail="Telemetry processing failed")