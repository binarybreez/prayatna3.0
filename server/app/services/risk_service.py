from app.repositories.spatial import get_nearby_incidents_from_db
from app.schemas.telemetry import TelemetryInput, RiskScoreOutput, IncidentDetail
from datetime import datetime

async def calculate_risk_for_location(data: TelemetryInput) -> RiskScoreOutput:
    # 1. Fetch live spatial data from PostGIS (Max 2km radius, top 5 threats)
    nearby_data = await get_nearby_incidents_from_db(lat=data.latitude, lng=data.longitude, radius=2000, limit=5)
    
    # 2. Heuristic Math Initialization
    base_risk = 10.0
    threats = []
    
    # 3. Process spatial threats (The Chaos Engine data)
    if nearby_data:
        for incident in nearby_data:
            distance = incident.get('distance', 2000)
            severity = incident.get('severity', 1)
            category = incident.get('category', 'unknown')
            
            # Closer = higher penalty. Max 10 points added for proximity alone.
            distance_penalty = max(0, 2000 - distance) / 200
            # Severity acts as a multiplier
            base_risk += (severity * 2) + distance_penalty
            
            threats.append(IncidentDetail(
                category=category,
                distance_meters=round(distance, 1),
                severity=severity
            ))

    # 4. Temporal Penalty (Nighttime is riskier)
    current_hour = datetime.now().hour
    if current_hour >= 22 or current_hour <= 4:
        base_risk += 20 
        
    # 5. Cap score at 100 and assign colors
    final_score = min(int(base_risk), 100)
    
    if final_score < 40:
        color = "Green"
        msg = "Area seems clear. Proceed normally."
    elif final_score < 75:
        color = "Yellow"
        msg = "Caution: Active incidents detected nearby."
    else:
        color = "Red"
        msg = "High Risk Zone: Multiple severe incidents in proximity."

    return RiskScoreOutput(
        risk_score=final_score,
        color_code=color,
        nearby_incident_count=len(threats),
        top_threats=threats,
        message=msg
    )