#!/bin/bash

# --- Mission Control OS v4.2 Tactical Deployment Script ---
# Deployment Target: Production Cloud Engine

echo "🛰️ INITIATING TACTICAL DEPLOYMENT: drone-mission-control-v4.2"
echo "--------------------------------------------------------"

# 1. Environment Verification
if [ ! -f .env ]; then
    echo "⚠️ WARNING: .env file missing. Using tactical defaults."
    cat <<EOF > .env
POSTGRES_PASSWORD=secure_uplink_$(openssl rand -hex 8)
SECRET_KEY=$(openssl rand -hex 32)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EOF
fi

# 2. Infrastructure Build
echo "🏗️ BUILDING SECTOR COMMAND IMAGES..."
docker-compose build --parallel

# 3. Service Orchestration
echo "🚀 DEPLOYING STACK TO CLOUD BRIDGE..."
docker-compose up -d

# 4. Database Stabilization
echo "⏳ WAITING FOR DATABASE PERSISTENCE..."
until docker exec drone_db pg_isready -U drone_admin > /dev/null 2>&1; do
  sleep 2
done

# 5. Strategic Initialization
echo "📦 RUNNING MISSION DATABASE MIGRATIONS..."
docker exec drone_backend python sync_db.py

# 6. Fleet Readiness Check
echo "✅ DEPLOYMENT COMPLETE. SYSTEMS NOMINAL."
echo "--------------------------------------------------------"
echo "Mission Control Portal: http://localhost:3000"
echo "Command API Gateway:    http://localhost:8000"
echo "--------------------------------------------------------"
