from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import BackgroundTasks
from app.core.config import supabase
from app.api.v1.routes import telemetry, dashboard
from datetime import datetime, timedelta

app = FastAPI(title="Rakshak Intelligence API")

# Crucial for allowing your React Native/Next.js apps to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry.router, prefix="/api/v1", tags=["Telemetry"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])


# ==========================================
# MODULE 3: AGENTIC DATA MAINTENANCE
# ==========================================


def clean_stale_telemetry():
    """Agentic background task: Deletes incidents older than 6 hours."""
    if not supabase:
        print("⚠️ Supabase client not found.")
        return

    print("🧹 AI Babysitter: Sweeping stale incidents...")
    try:
        # Calculate the exact timestamp for 6 hours ago
        stale_threshold = (datetime.utcnow() - timedelta(hours=6)).isoformat()

        # Tell Supabase to delete anything older than the threshold
        response = (
            supabase.table("citizen_telemetry")
            .delete()
            .lt("timestamp", stale_threshold)
            .execute()
        )

        print(f"✅ Sweep complete. Cleared {len(response.data)} stale records.")
    except Exception as e:
        print(f"❌ Sweep failed: {e}")


@app.post("/api/v1/admin/trigger-cleanup", tags=["Admin"])
async def trigger_cleanup(background_tasks: BackgroundTasks):
    """Hidden route to trigger the AI cleanup manually during the demo."""
    # This immediately returns a 200 OK to the frontend, while the database
    # cleanup happens invisibly in the background so the UI never freezes.
    background_tasks.add_task(clean_stale_telemetry)
    return {
        "status": "success",
        "message": "Cleanup agent dispatched in the background.",
    }


@app.get("/")
def health_check():
    return {"status": "Rakshak Core is online."}
