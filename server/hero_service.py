import os
import random
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

# Import your Twilio function from the alert service
from app.services.alert_services import send_emergency_sms

load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Target coordinates for the "Crisis Demo" (Vijay Nagar, Indore)
TARGET_LAT = 22.7533
TARGET_LNG = 75.8937

# A very tight radius to force the PostGIS ST_ClusterDBSCAN to draw a red polygon
CLUSTER_RADIUS = 0.002 

INCIDENT_TYPES = ["riot_reported", "severe_waterlogging", "mass_panic", "infrastructure_collapse"]

def trigger_hero_scenario(num_incidents=15):
    print(f"🚨 INITIATING RAKSHAK DEMO: Spawning {num_incidents} severe incidents in Vijay Nagar...")
    
    for _ in range(num_incidents):
        # Generate slightly randomized coordinates around the target
        mock_lat = TARGET_LAT + random.uniform(-CLUSTER_RADIUS, CLUSTER_RADIUS)
        mock_lng = TARGET_LNG + random.uniform(-CLUSTER_RADIUS, CLUSTER_RADIUS)
        
        # High severity to trigger your IDW/XGBoost risk math
        severity = random.randint(8, 10) 
        category = random.choice(INCIDENT_TYPES)
        
        # PostGIS WKT (Well-Known Text) Format
        point_wkt = f"POINT({mock_lng} {mock_lat})"
        
        payload = {
            "location": point_wkt,
            "category": category,
            "severity": severity
        }
        
        # Insert directly into the Supabase database
        supabase.table("citizen_telemetry").insert(payload).execute()
        print(f"🧨 Ingested WKT Point: {category} (Severity {severity})")

    print("\n✅ SPATIAL CLUSTER CREATED in PostGIS.")
    
    # ---------------------------------------------------------
    # THE SHOWSTOPPER: Fire the Twilio SMS to the Mentor/Judge
    # ---------------------------------------------------------
    print("📱 Firing asynchronous Twilio SMS to ICCC Commander...")
    try:
        send_emergency_sms(
            location_name="Vijay Nagar, Indore", 
            hazard_type="Multi-Point Crisis", 
            severity=10
        )
        print("✅ Alert Dispatched successfully.")
    except Exception as e:
        print(f"❌ SMS failed (check Twilio credentials): {e}")

if __name__ == "__main__":
    trigger_hero_scenario()