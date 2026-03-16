import httpx
from app.repositories.spatial import get_nearby_incidents_from_db
from app.schemas.telemetry import TelemetryInput, RiskScoreOutput, IncidentDetail
from datetime import datetime

async def calculate_risk_for_location(data: TelemetryInput) -> RiskScoreOutput:
    # 1. Fetch live spatial data from PostGIS (Max 2km radius, top 5 threats)
    nearby_data = await get_nearby_incidents_from_db(lat=data.latitude, lng=data.longitude, radius=2000, limit=5)
    
    # 2. Heuristic Math Initialization
    base_risk = 5.0
    threats = []

    spatial_risk_sum = 0
    alpha_weight = 15.0 # Tuning parameter
    
    # 3. Process spatial threats (The Chaos Engine data)
    if nearby_data:
        for incident in nearby_data:
            distance = incident.get('distance', 2000)
            severity = incident.get('severity', 1)
            category = incident.get('category', 'unknown')
            
            # Mathematical decay: severity / (distance + 1) to avoid division by zero
            spatial_risk_sum += (severity / (distance + 1))
            
            threats.append(IncidentDetail(
                category=category,
                distance_meters=round(distance, 1),
                severity=severity
            ))
    base_risk += (alpha_weight * spatial_risk_sum)

    # 4. Temporal Penalty (Nighttime is riskier)
    # Prospect-Refuge Temporal Penalty (Concealment multiplier)
    current_hour = datetime.now().hour
    beta_weight = 1.5
    if current_hour >= 22 or current_hour <= 4:
        base_risk *= beta_weight # Risk multiplies by 1.5x in the dark
        
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
    location_name = await get_street_address(data.latitude, data.longitude)
    return RiskScoreOutput(
        risk_score=final_score,
        color_code=color,
        nearby_incident_count=len(threats),
        top_threats=threats,
        location_name=location_name,
        message=msg
    )

async def get_street_address(lat: float, lng: float) -> str:
    """Converts GPS coordinates to a human-readable street address."""
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
    headers = {"User-Agent": "Rakshak-Hackathon-Project/1.0"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=3.0)
            if response.status_code == 200:
                data = response.json()
                # Extract neighborhood or road, fallback to city
                address = data.get("address", {})
                location = address.get("suburb") or address.get("road") or address.get("city")
                return f"{location}, Indore" if location else "Unknown Location"
    except Exception as e:
        print(f"Geocoding failed: {e}")
    return "Location unavailable"