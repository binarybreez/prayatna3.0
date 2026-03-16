from fastapi import APIRouter,HTTPException
from app.core.config import supabase

router = APIRouter()

@router.get("/incidents/bounds")
async def get_incidents_in_viewport(min_lng: float, min_lat: float, max_lng: float, max_lat: float):
    if not supabase: return []
    response = supabase.rpc(
        "incidents_in_bounds", 
        {"min_lng": min_lng, "min_lat": min_lat, "max_lng": max_lng, "max_lat": max_lat}
    ).execute()
    return response.data

@router.get("/incidents/hotspots")
async def get_dynamic_hotspots():
    if not supabase: return []
    # eps_degrees 0.005 is roughly 500 meters
    response = supabase.rpc("get_risk_hotspots", {"eps_degrees": 0.005, "min_points": 3}).execute()
    return response.data

@router.get("/hotspots")
async def get_dynamic_hotspots():
    """
    Fetches AI-generated risk polygons using PostGIS DBSCAN clustering.
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection missing")
            
        # eps_degrees 0.005 is roughly a 500-meter search radius
        # min_points 3 means it takes 3 incidents to form a hotspot
        response = supabase.rpc("get_risk_hotspots", {"eps_degrees": 0.005, "min_points": 3}).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))