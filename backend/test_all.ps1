# SmartStay Backend - API Test Script
# Run this to test all backend endpoints

Write-Host "`n╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   SmartStay Backend API Test Suite          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🔍 Test 1: Health Check" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Backend Status: $($health.status)" -ForegroundColor Green
    Write-Host "✅ AI Provider: $($health.ai_provider)" -ForegroundColor Cyan
    Write-Host "✅ AI Configured: $(if ($health.ai_provider_configured) { 'Connected' } else { 'Not Configured' })" -ForegroundColor $(if ($health.ai_provider_configured) { 'Green' } else { 'Red' })
    if ($health.ai_provider_configured) {
        Write-Host "   Using Groq (llama-3.1-8b-instant)" -ForegroundColor Green
    }
    $testsPassed++
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    Write-Host "   Make sure backend is running on port 5000" -ForegroundColor Yellow
    $testsFailed++
}

# Test 2: Sentiment Analysis
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🧠 Test 2: AI Sentiment Analysis" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $sentimentBody = @{
        reviews = @(
            @{text = "Excellent PG! Clean rooms, helpful owner, great food. Highly recommended!"}
            @{text = "Terrible experience. Dirty bathrooms, rude owner, WiFi never works."}
            @{text = "It's okay. Nothing special but liveable for students."}
            @{text = "Good location near college. Rooms are decent."}
        )
        pg_name = "Sunshine PG"
    } | ConvertTo-Json -Depth 10

    $sentiment = Invoke-RestMethod -Uri "$baseUrl/api/ai/sentiment-analysis" -Method Post -Body $sentimentBody -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "✅ Sentiment Analysis Complete!" -ForegroundColor Green
    Write-Host "   Overall Sentiment: $($sentiment.overall_sentiment)" -ForegroundColor Cyan
    Write-Host "   Positive Reviews: $($sentiment.positive_count)" -ForegroundColor Green
    Write-Host "   Negative Reviews: $($sentiment.negative_count)" -ForegroundColor Red
    Write-Host "   Neutral Reviews: $($sentiment.neutral_count)" -ForegroundColor Gray
    Write-Host "   Insights: $($sentiment.insights)" -ForegroundColor White
    Write-Host "   Positive Keywords: $($sentiment.keywords.positive -join ', ')" -ForegroundColor Green
    Write-Host "   Negative Keywords: $($sentiment.keywords.negative -join ', ')" -ForegroundColor Red
    $testsPassed++
} catch {
    Write-Host "❌ Sentiment analysis failed: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Hidden Charge Detection
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "💰 Test 3: Hidden Charge Detection" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $chargesBody = @{
        description = "Spacious room near metro. Rent includes basic facilities. Peaceful locality."
        rent = 9000
        deposit = 15000
        amenities = @("WiFi", "Water")
        rules = "No guests after 10 PM. No cooking in rooms."
    } | ConvertTo-Json -Depth 10

    $charges = Invoke-RestMethod -Uri "$baseUrl/api/ai/hidden-charges" -Method Post -Body $chargesBody -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "✅ Hidden Charge Analysis Complete!" -ForegroundColor Green
    Write-Host "   Risk Level: $($charges.risk_level)" -ForegroundColor $(switch ($charges.risk_level) { 'low' { 'Green' } 'medium' { 'Yellow' } 'high' { 'Red' } default { 'White' } })
    Write-Host "   Transparency Score: $($charges.transparency_score)%" -ForegroundColor Cyan
    Write-Host "   Potential Hidden Charges:" -ForegroundColor White
    foreach ($charge in $charges.potential_hidden_charges) {
        Write-Host "      - $($charge.charge): $($charge.reason)" -ForegroundColor Yellow
    }
    Write-Host "   Questions to Ask:" -ForegroundColor White
    foreach ($question in $charges.questions_to_ask) {
        Write-Host "      ? $question" -ForegroundColor Magenta
    }
    $testsPassed++
} catch {
    Write-Host "❌ Hidden charge detection failed: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Travel Time Estimation
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🚗 Test 4: Travel Time Estimation (OpenRouteService)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $travelBody = @{
        from = @{lat = 12.9716; lng = 77.5946}
        to = @{lat = 12.9352; lng = 77.6245}
        modes = @("foot-walking", "cycling-regular", "driving-car")
    } | ConvertTo-Json -Depth 10

    $travel = Invoke-RestMethod -Uri "$baseUrl/api/ai/travel-time" -Method Post -Body $travelBody -ContentType "application/json" -TimeoutSec 10
    
    Write-Host "✅ Service: $($travel.service)" -ForegroundColor $(if ($travel.service -like "*Demo Mode*") { 'Yellow' } else { 'Green' })
    if ($travel.service -like "*Demo Mode*") {
        Write-Host "   ⚠️  Add OPENROUTE_API_KEY to .env for real travel time data" -ForegroundColor DarkYellow
    } else {
        Write-Host "   ✅ Using real OpenRouteService API data" -ForegroundColor Green
    }
    Write-Host "   From: ($($travel.from.lat), $($travel.from.lng))" -ForegroundColor Gray
    Write-Host "   To: ($($travel.to.lat), $($travel.to.lng))" -ForegroundColor Gray
    Write-Host "   Travel Modes:" -ForegroundColor White
    foreach ($mode in $travel.modes) {
        $icon = switch ($mode.mode) {
            "walking" { "🚶" }
            "cycling" { "🚴" }
            "driving" { "🚗" }
            default { "🚶" }
        }
        Write-Host "      $icon $($mode.mode): $($mode.duration) min ($([math]::Round($mode.distance/1000, 2)) km)" -ForegroundColor Cyan
    }
    $testsPassed++
} catch {
    Write-Host "❌ Travel time estimation failed: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 5: AI Description Generator
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✍️  Test 5: AI Description Generator" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $descBody = @{
        amenities = @("WiFi", "AC", "Attached Bathroom", "Food", "Laundry", "TV", "Parking")
        location = "Koramangala, Bangalore"
        rent = 14000
        room_type = "Single"
    } | ConvertTo-Json -Depth 10

    $desc = Invoke-RestMethod -Uri "$baseUrl/api/ai/generate-description" -Method Post -Body $descBody -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "✅ Description Generated Successfully!" -ForegroundColor Green
    Write-Host "   Generated Description:" -ForegroundColor White
    Write-Host "   $($desc.description)" -ForegroundColor Cyan
    $testsPassed++
} catch {
    Write-Host "❌ Description generation failed: $_" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host "`n╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            TEST SUMMARY                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "✅ Passed: $testsPassed" -ForegroundColor Green
Write-Host "❌ Failed: $testsFailed" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

if ($testsFailed -eq 0) {
    Write-Host "🎉 All tests passed! Backend is working perfectly." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Check the errors above." -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
