import os
import time
import random
from dotenv import load_dotenv
from supabase import create_client, Client

# Load credentials
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Indore City Center Coordinates
INDORE_LAT = 22.7196
INDORE_LNG = 75.8577

# ~10km radius offset in decimal degrees (1 degree is approx 111km)
OFFSET = 0.09 

INCIDENT_TYPES = [
    "waterlogging", 
    "traffic_anomaly", 
    "street_light_outage", 
    "noise_complaint", 
    "suspicious_activity"
]

def generate_mock_incident():
    # Generate random coordinates within the Indore bounding box
    mock_lat = INDORE_LAT + random.uniform(-OFFSET, OFFSET)
    mock_lng = INDORE_LNG + random.uniform(-OFFSET, OFFSET)
    
    category = random.choice(INCIDENT_TYPES)
    severity = random.randint(1, 10)
    
    # Format as Well-Known Text (WKT) for PostGIS: POINT(Longitude Latitude)
    # Note: PostGIS strictly expects Longitude first!
    point_wkt = f"POINT({mock_lng} {mock_lat})"
    
    payload = {
        "location": point_wkt,
        "category": category,
        "severity": severity
    }
    
    try:
        # Insert into Supabase
        response = supabase.table("citizen_telemetry").insert(payload).execute()
        print(f"🚨 INJECTED: [{category.upper()}] Sev:{severity} at Lat:{mock_lat:.4f}, Lng:{mock_lng:.4f}")
    except Exception as e:
        print(f"❌ INJECTION FAILED: {e}")

if __name__ == "__main__":
    print("🌪️ Starting Rakshak Chaos Engine for Indore...")
    print("Press Ctrl+C to stop the simulation.\n")
    
    try:
        while True:
            generate_mock_incident()
            # Wait 5 seconds before the next incident
            time.sleep(5) 
    except KeyboardInterrupt:
        print("\n🛑 Chaos Engine halted.")