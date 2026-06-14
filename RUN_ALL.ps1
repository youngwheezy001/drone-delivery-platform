Write-Host "🛸 TUSTAR PRIME SYSTEM IGNITION" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend
Write-Host "[1/5] Booting Backend (FastAPI)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit -Command `"cd backend; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`""

# Wait for backend to initialize
Start-Sleep -Seconds 3

# 2. Start Next.js Master Dashboard
Write-Host "[2/5] Booting Master Dashboard (Next.js)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`""

# Wait for frontend to initialize
Start-Sleep -Seconds 3

# 3. Start Seller App (Hub App)
Write-Host "[3/5] Booting Seller App..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit -Command `"cd seller-app; `$env:REACT_NATIVE_PACKAGER_HOSTNAME='10.0.7.147'; npx expo start -c`""

# 4. Start Customer App
Write-Host "[4/5] Booting Customer App..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit -Command `"cd customer-app; `$env:REACT_NATIVE_PACKAGER_HOSTNAME='10.0.7.147'; npx expo start -c`""

# 5. Start Operator App
Write-Host "[5/5] Booting Ground Crew Operator App..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit -Command `"cd operator-app; `$env:REACT_NATIVE_PACKAGER_HOSTNAME='10.0.7.147'; npx expo start -c`""

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ ALL SYSTEMS ONLINE." -ForegroundColor Green
Write-Host "Use Expo Go to scan the QR codes for the mobile apps." -ForegroundColor Yellow
Write-Host "Master Dashboard running on http://localhost:3000" -ForegroundColor Cyan
