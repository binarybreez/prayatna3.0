from app.core.privacy import obfuscate_location
from app.repositories.spatial import insert_telemetry_ping
from app.schemas.telemetry import TelemetryInput

async def process_incoming_telemetry(data: TelemetryInput) -> dict:
    # 1. Apply Differential Privacy (Laplace Noise)
    safe_lat, safe_lng = obfuscate_location(data.latitude, data.longitude)
    
    print(f"🔒 PRIVACY SHIELD: Raw({data.latitude}, {data.longitude}) -> Safe({safe_lat:.4f}, {safe_lng:.4f})")
    
    # 2. Save the obfuscated location to the database
    await insert_telemetry_ping(lat=safe_lat, lng=safe_lng, category=data.category)
    
    return {"status": "success", "message": "Telemetry securely ingested and anonymized."}