# Lighthouse Performance Testing Script (PowerShell)
# Usage: .\scripts\lighthouse-test.ps1

Write-Host "🚀 Building production bundle..." -ForegroundColor Cyan
npm run build

Write-Host ""
Write-Host "📊 Starting preview server..." -ForegroundColor Cyan
$previewJob = Start-Job -ScriptBlock { npm run preview }

# Wait for server to start
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🔍 Running Lighthouse tests..." -ForegroundColor Cyan

# Mobile test
Write-Host "📱 Testing Mobile Performance..." -ForegroundColor Yellow
lighthouse http://localhost:4173 `
  --preset=mobile `
  --output=html `
  --output=json `
  --output-path=./lighthouse-mobile.html `
  --quiet

# Desktop test
Write-Host "🖥️  Testing Desktop Performance..." -ForegroundColor Yellow
lighthouse http://localhost:4173 `
  --preset=desktop `
  --output=html `
  --output=json `
  --output-path=./lighthouse-desktop.html `
  --quiet

# Kill preview server
Stop-Job -Job $previewJob
Remove-Job -Job $previewJob

Write-Host ""
Write-Host "✅ Lighthouse tests complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Reports saved:" -ForegroundColor Cyan
Write-Host "   - Mobile:  lighthouse-mobile.html"
Write-Host "   - Desktop: lighthouse-desktop.html"
Write-Host ""
Write-Host "📊 Opening reports..." -ForegroundColor Cyan
Start-Process lighthouse-mobile.html
Start-Process lighthouse-desktop.html
