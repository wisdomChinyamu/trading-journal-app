$ErrorActionPreference = "SilentlyContinue"

# Kill any existing node processes
Write-Host "Cleaning up existing processes..."
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Change to project directory
Set-Location "C:\Users\Wisdom Chinyamu\Documents\Code\my-app"
Write-Host "Working directory: $(Get-Location)"

# Install dependencies
Write-Host "Installing npm dependencies..."
npm install --legacy-peer-deps

# Try to run the web build
Write-Host "Starting web build..."
npm run web 2>&1 | Tee-Object -FilePath "web-build-result.log"