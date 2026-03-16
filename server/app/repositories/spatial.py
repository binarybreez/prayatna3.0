from app.core.config import supabase

async def get_nearby_incidents_from_db(lat: float, lng: float, radius: float = 2000, limit: int = 5):
    """
    Calls the PostGIS RPC function to find incidents near the user's GPS ping.
    """
    if not supabase:
        print("Warning: Supabase client not initialized.")
        return []
        
    response = supabase.rpc(
        "nearby_incidents", 
        {"user_lat": lat, "user_lng": lng, "radius_meters": radius, "limit_count": limit}
    ).execute()
    
    return response.data

# Add this to app/repositories/spatial.py
async def insert_telemetry_ping(lat: float, lng: float, category: str = "user_ping", severity: int = 1):
    """
    Inserts a user ping into Supabase using WKT format.
    """
    if not supabase: return False
    
    point_wkt = f"POINT({lng} {lat})" # Note: Longitude first for PostGIS!
    
    payload = {
        "location": point_wkt,
        "category": category,
        "severity": severity
    }
    
    response = supabase.table("citizen_telemetry").insert(payload).execute()
    return response.data