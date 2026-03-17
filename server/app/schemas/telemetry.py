from pydantic import BaseModel, Field
from typing import List, Optional

class IncidentDetail(BaseModel):
    category: str
    distance_meters: float
    severity: int

class TelemetryInput(BaseModel):
    # Geolocation boundaries strictly enforced
    latitude: float = Field(..., ge=-90, le=90, description="Valid latitude between -90 and 90")
    longitude: float = Field(..., ge=-180, le=180, description="Valid longitude between -180 and 180")
    category: Optional[str] = "user_ping"

class RiskScoreOutput(BaseModel):
    risk_score: int
    color_code: str
    nearby_incident_count: int
    top_threats: List[IncidentDetail] = []
    message: str
    location_name: str

class AmbulanceTelemetry(BaseModel):
    ambulance_id: str = Field(..., example="AMB-104")
    current_lat: float = Field(..., example=22.7196) # e.g., Rajwada
    current_lng: float = Field(..., example=75.8577)
    dest_lat: float = Field(..., example=22.7533)  # e.g., Vijay Nagar Hospital
    dest_lng: float = Field(..., example=75.8937)