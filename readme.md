# 🚨 Rakshak: Proactive Urban Safety Intelligence (ICCC)

![Rakshak System Architecture](https://img.shields.io/badge/Architecture-Event--Driven-blue)
![Privacy](https://img.shields.io/badge/Compliance-DPDP_Act_2023-success)
![AI](https://img.shields.io/badge/AI-Gemini_2.5_Flash-orange)
![Database](https://img.shields.io/badge/Database-PostGIS_DBSCAN-blueviolet)

**Rakshak** is a B2G (Business-to-Government) Integrated Command and Control Centre (ICCC) platform designed for Tier-1 and Tier-2 Smart Cities in India. 

It transitions urban safety from *reactive dispatch* to *prescriptive foresight* by turning millions of citizen smartphones into a crowdsourced IoT sensor network—without compromising personal privacy.

---

## ⚠️ The Problem
1. **The Reporting Gap:** 68% of citizens ignore safety hazards (riots, waterlogging, accidents) because they fear police friction or legal harassment ("The process is the punishment").
2. **The "Golden Hour" Loss:** Ambulances in Indian metros average 8–12 km/h. Standard navigation apps route them into unseen hazards, losing critical time.
3. **The AI Black Box:** City commanders cannot legally deploy riot police based on an unexplained algorithmic "Risk Score." They require human-readable tactical reasoning.

## 🛡️ The Solution (Core Features)

### 1. Privacy-by-Design (The DPDP Shield)
Before a citizen's GPS coordinate hits our database, we apply the **Laplace Mechanism** for Differential Privacy. We inject statistical noise to shift the WKT (Well-Known Text) coordinate by ~50 meters. This guarantees "geo-indistinguishability," making the system 100% compliant with the DPDP Act 2023. We track the hazard, not the human.

### 2. Autonomous Spatial Intelligence
We offload spatial math to the database hardware. Using native **PostgreSQL + PostGIS (`ST_ClusterDBSCAN`)**, the system runs unsupervised density-based clustering to autonomously detect crowd phase transitions and draw 500m dynamic threat polygons in milliseconds.

### 3. Explainable AI (The XAI Analyst)
A risk score of 92 is a black box. We pipe deterministic spatial math into **Gemini 2.5 Flash** using a zero-hallucination prompt. Gemini translates the spatial telemetry into a strict, 3-sentence human-readable tactical briefing for city officials, ensuring political accountability.

### 4. The Resilience Corridor & IoT Actuation
When an ambulance is dispatched, our PostGIS engine (`ST_Intersects`) mathematically checks if the route collides with our active danger polygons. If a collision is detected, it calculates a dynamic ETA detour penalty and uses **FastAPI Background Tasks** to fire asynchronous webhooks to the city's IUDX traffic controllers, creating a "Green Wave" of preemptive green lights.

### 5. Zero-Latency Mass Alerts
Event-driven architecture bypasses human latency. The millisecond a severity 8+ WKT cluster forms, a **Twilio SMS** is physically dispatched to the ICCC Commander's phone.

### 6. Predictive Threat Scoring
A hybrid risk engine utilizing **Inverse Distance Weighting (IDW)** and **XGBoost** to calculate a live 0–100 hazard severity score based on threat density and spatial decay.

---

## ⚙️ Tech Stack

**Backend & Data Layer:**
* **FastAPI (Python):** High-concurrency, asynchronous REST API.
* **Supabase (PostgreSQL):** Primary data store.
* **PostGIS:** Hardware-level spatial clustering and intersection math.
* **Laplace Mechanism:** Edge-level mathematical data obfuscation.

**AI & Machine Learning:**
* **Google Gemini 2.5 Flash:** Generative Explainable AI (XAI) Analyst.
* **XGBoost & IDW:** Predictive threat scoring and spatial decay math.

**Frontend & Actuation:**
* **Next.js & React:** Zero-refresh Live Command Dashboard.
* **Supabase Realtime:** WebSocket integration (`postgres_changes`) for live UI updates.
* **Mapbox / Leaflet:** Dark-mode spatial visualization and WKT parsing.
* **Twilio API:** Mass alert SMS actuation.

---

## 🚀 Local Setup & Installation

### 1. Backend (FastAPI) Setup
```bash
# Clone the repository
git clone [https://github.com/binarybreez/rakshak.git](https://github.com/binarybreez/rakshak.git)
cd rakshak/backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment Variables (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 2. Database (PostGIS) Setup
Run the included SQL migrations in your Supabase SQL Editor to enable PostGIS and create the RPC functions:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
-- (See /database/migrations.sql for the ST_ClusterDBSCAN and check_route_intersection functions)
```

### 3. Run the API Server
```bash
uvicorn app.main:app --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### 4. Frontend (Next.js) Setup
```bash
cd ../frontend
npm install
npm run dev
```
Dashboard will be live at: `http://localhost:3000`

---

## 💥 The "Nuke Button" (Demo Execution)
To test the system's real-time capabilities without manual data entry, use the included chaos engine script. This will drop a swarm of WKT points over Vijay Nagar, Indore, triggering the PostGIS clustering, Twilio SMS, and Next.js UI updates instantly.

```bash
cd backend
python hero_scenario.py
```

---
*Built with precision for the future of Indian Smart Cities.*
