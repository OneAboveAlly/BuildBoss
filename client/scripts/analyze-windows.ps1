# Bundle Analysis Script for Windows
# This script sets the ANALYZE environment variable and runs the build with bundle analyzer

Write-Host "🔍 Starting Bundle Analysis..." -ForegroundColor Blue
Write-Host ""

# Set environment variable for this session
$env:ANALYZE = "true"

try {
    # Run the build with analyzer
    Write-Host "📦 Building with bundle analyzer..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Bundle analysis complete!" -ForegroundColor Green
        Write-Host "📊 Check your browser for the interactive bundle analyzer" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💡 Additional analysis available with:" -ForegroundColor Yellow
        Write-Host "   npm run bundle:size" -ForegroundColor White
    } else {
        Write-Host "❌ Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "❌ Error during bundle analysis: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up environment variable
    Remove-Item Env:ANALYZE -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🚀 Pro tip: Use 'npm run bundle:size' for detailed size analysis" -ForegroundColor Magenta 