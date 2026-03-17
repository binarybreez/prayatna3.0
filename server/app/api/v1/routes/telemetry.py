import os
from google import genai
from fastapi import APIRouter, HTTPException,BackgroundTasks
from app.schemas.telemetry import TelemetryInput, RiskScoreOutput
from app.services.alert_services import send_emergency_sms
from app.services.risk_service import calculate_risk_for_location, get_street_address
from app.services.telemetry_service import process_incoming_telemetry

router = APIRouter()

# Initialize the Generative AI Client (Explainable AI Layer)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


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


@router.post("/ai-tactical-brief", tags=["Explainable AI"])
async def get_ai_tactical_brief(payload: TelemetryInput):
    """
    Takes raw spatial telemetry, calculates the mathematical risk score, 
    and uses an LLM to generate an Explainable AI (XAI) tactical briefing.
    """
    try:
        # 1. Fetch spatial risk data
        risk_data = await calculate_risk_for_location(payload)

        # 2. Extract threats
        threat_list = [threat.category for threat in risk_data.top_threats]
        threat_string = ", ".join(threat_list) if threat_list else "No active threats."

        # 3. Prompt
        prompt = f"""
You are 'Rakshak-AI', an autonomous urban safety tactical analyst for the city of Indore.
Analyze the following real-time spatial data and provide a strict, 3-sentence tactical briefing for the municipal Integrated Command and Control Centre (ICCC).
Do not use markdown. Do not be conversational. Be direct, authoritative, and operational.

DATA TO ANALYZE:
Location: {risk_data.location_name}
Risk Score: {risk_data.risk_score}/100 ({risk_data.color_code})
Active Threats Nearby: {risk_data.nearby_incident_count}
Threat Details: {threat_string}
"""

        # 4. Call Google GenAI
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "temperature": 0.2
            }
        )

        return {
            "spatial_risk_score": risk_data.risk_score,
            "color_code": risk_data.color_code,
            "ai_tactical_briefing": response.text.strip()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Explainable AI Engine Failed: {str(e)}"
        )