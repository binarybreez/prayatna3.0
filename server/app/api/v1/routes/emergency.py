import math
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.schemas.telemetry import AmbulanceTelemetry
from app.core.config import supabase
import asyncio

router = APIRouter()


def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates straight-line distance in kilometers between two points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# --- MODULE 3.1: The IoT Actuation Mock Webhook ---
async def trigger_green_wave(ambulance_id: str, adjusted_eta: int):
    """
    Simulates an asynchronous RESTful webhook to the IUDX Traffic Controller
    to pre-empt traffic signals along the calculated resilience corridor.
    """
    print(
        f"\n📡 [IUDX WEBHOK] Initiating secure connection to Municipal Traffic Grid..."
    )
    await asyncio.sleep(1)  # Simulate network latency
    print(
        f"🚦 [IUDX WEBHOK] Overriding signal phase for {ambulance_id}. Rolling green wave synced to ETA: {adjusted_eta} mins."
    )
    print(f"✅ [IUDX WEBHOK] Actuation complete. Resilience Corridor locked.\n")


@router.post("/track", tags=["Emergency Response"])
async def track_ambulance(
    payload: AmbulanceTelemetry, background_tasks: BackgroundTasks
):
    try:
        # 1. Base Math
        distance_km = calculate_haversine_distance(
            payload.current_lat, payload.current_lng, payload.dest_lat, payload.dest_lng
        )
        base_eta_minutes = int((distance_km / 40.0) * 60)

        # 2. Database Spatial Check
        if not supabase:
            raise HTTPException(status_code=500, detail="Database connection missing")

        rpc_response = supabase.rpc(
            "check_route_intersection",
            {
                "start_lng": payload.current_lng,
                "start_lat": payload.current_lat,
                "end_lng": payload.dest_lng,
                "end_lat": payload.dest_lat,
            },
        ).execute()

        intersection_data = (
            rpc_response.data[0]
            if rpc_response.data
            else {"is_route_clear": True, "intersecting_zones": 0}
        )
        is_clear = intersection_data.get("is_route_clear", True)
        danger_zones = intersection_data.get("intersecting_zones", 0)

        # 3. Apply Penalties
        final_eta = base_eta_minutes
        status_msg = "Resilience Corridor Active. Optimal path secured."

        if not is_clear:
            final_eta += 15 * danger_zones
            status_msg = f"CRITICAL: Route intersects {danger_zones} active hazard zone(s). Applying dynamic rerouting penalty."

        # --- MODULE 3.2: Trigger the Green Wave Webhook in the Background ---
        background_tasks.add_task(trigger_green_wave, payload.ambulance_id, final_eta)

        # 4. The Perfect Dashboard Payload for Teammate B
        return {
            "ambulance_id": payload.ambulance_id,
            "distance_km": round(distance_km, 2),
            "is_route_clear": is_clear,
            "adjusted_eta_minutes": final_eta,
            "clearance_status": status_msg,
            "green_wave_active": True,
            "iot_actuation_status": "Signal pre-emption webhooks dispatched to IUDX grid.",
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Emergency stream failed: {str(e)}"
        )
