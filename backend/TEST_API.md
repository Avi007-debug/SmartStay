# SmartStay Backend - Complete API Test Guide

## 🚀 Quick Start

### Backend Status
- **Running**: Flask on `http://localhost:5000`
- **AI Service**: Google Gemini API (Sentiment Analysis, Hidden Charges, Description Generator)
- **Travel Time**: OpenRouteService (NOT CONNECTED - using demo mode)
- **Database**: Supabase (connected via frontend)

### What's Working
✅ Sentiment Analysis (Gemini AI)
✅ Hidden Charge Detection (Gemini AI)  
✅ AI Description Generator (Gemini AI)
✅ Health Check Endpoint
❌ Travel Time (OpenRouteService - demo mode only, API not integrated)

---

## 📋 All API Endpoints

### 1. Health Check
**GET** `/health`

**Purpose**: Check if backend is running and Gemini is configured

**cURL Test**:
```bash
curl http://localhost:5000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "gemini_configured": true
}
```

**PowerShell Test**:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
```

---

### 2. Sentiment Analysis
**POST** `/api/ai/sentiment-analysis`

**Purpose**: Analyze sentiment from PG reviews using Gemini AI

**Request Body**:
```json
{
  "reviews": [
    {"text": "Great place! Clean rooms and helpful owner."},
    {"text": "Food is terrible and WiFi never works."},
    {"text": "Average experience, nothing special."}
  ],
  "pg_name": "Sunshine PG"
}
```

**cURL Test**:
```bash
curl -X POST http://localhost:5000/api/ai/sentiment-analysis ^
  -H "Content-Type: application/json" ^
  -d "{\"reviews\": [{\"text\": \"Great place! Clean rooms and helpful owner.\"}, {\"text\": \"Food is terrible and WiFi never works.\"}, {\"text\": \"Average experience, nothing special.\"}], \"pg_name\": \"Sunshine PG\"}"
```

**PowerShell Test**:
```powershell
$body = @{
    reviews = @(
        @{text = "Great place! Clean rooms and helpful owner."}
        @{text = "Food is terrible and WiFi never works."}
        @{text = "Average experience, nothing special."}
    )
    pg_name = "Sunshine PG"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/ai/sentiment-analysis" -Method Post -Body $body -ContentType "application/json"
```

**Expected Response**:
```json
{
  "overall_sentiment": "mixed",
  "positive_count": 1,
  "negative_count": 1,
  "neutral_count": 1,
  "insights": "Mixed reviews with concerns about food quality and WiFi connectivity, but positive feedback on cleanliness and management.",
  "keywords": {
    "positive": ["clean", "helpful", "great"],
    "negative": ["terrible", "never works", "WiFi"]
  }
}
```

---

### 3. Hidden Charge Detection
**POST** `/api/ai/hidden-charges`

**Purpose**: Detect potential hidden charges in PG listing using Gemini AI

**Request Body**:
```json
{
  "description": "Spacious room near metro station. Monthly rent includes basic amenities.",
  "rent": 8500,
  "deposit": 15000,
  "amenities": ["WiFi", "Water"],
  "rules": "No guests allowed after 9 PM"
}
```

**cURL Test**:
```bash
curl -X POST http://localhost:5000/api/ai/hidden-charges ^
  -H "Content-Type: application/json" ^
  -d "{\"description\": \"Spacious room near metro station. Monthly rent includes basic amenities.\", \"rent\": 8500, \"deposit\": 15000, \"amenities\": [\"WiFi\", \"Water\"], \"rules\": \"No guests allowed after 9 PM\"}"
```

**PowerShell Test**:
```powershell
$body = @{
    description = "Spacious room near metro station. Monthly rent includes basic amenities."
    rent = 8500
    deposit = 15000
    amenities = @("WiFi", "Water")
    rules = "No guests allowed after 9 PM"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/ai/hidden-charges" -Method Post -Body $body -ContentType "application/json"
```

**Expected Response**:
```json
{
  "risk_level": "medium",
  "potential_hidden_charges": [
    {
      "charge": "Electricity",
      "reason": "Not explicitly mentioned in amenities or description"
    },
    {
      "charge": "Food/Meals",
      "reason": "No mention of food inclusion or cost"
    },
    {
      "charge": "Maintenance Fee",
      "reason": "'Basic amenities' is vague and could exclude maintenance"
    }
  ],
  "missing_information": [
    "Electricity billing details",
    "Food availability and cost",
    "Maintenance fee structure",
    "Parking charges"
  ],
  "questions_to_ask": [
    "Is electricity included in the rent or charged separately?",
    "What exactly do 'basic amenities' include?",
    "Are there any monthly maintenance or service charges?",
    "Is food provided? If yes, what's the cost?"
  ],
  "transparency_score": 65
}
```

---

### 4. Travel Time Estimation (⚠️ DEMO MODE)
**POST** `/api/ai/travel-time`

**Purpose**: Estimate travel time using OpenRouteService API

**Current Status**: 
- ❌ **NOT CONNECTED** - OpenRouteService API key not configured
- Returns demo/fallback data only
- To enable: Add `OPENROUTE_API_KEY` to `.env` and implement actual API call

**Request Body**:
```json
{
  "from": {"lat": 28.6139, "lng": 77.2090},
  "to": "IIT Delhi",
  "modes": ["foot-walking", "cycling-regular", "driving-car"]
}
```

**cURL Test**:
```bash
curl -X POST http://localhost:5000/api/ai/travel-time ^
  -H "Content-Type: application/json" ^
  -d "{\"from\": {\"lat\": 28.6139, \"lng\": 77.2090}, \"to\": \"IIT Delhi\", \"modes\": [\"foot-walking\", \"cycling-regular\", \"driving-car\"]}"
```

**PowerShell Test**:
```powershell
$body = @{
    from = @{lat = 28.6139; lng = 77.2090}
    to = "IIT Delhi"
    modes = @("foot-walking", "cycling-regular", "driving-car")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/ai/travel-time" -Method Post -Body $body -ContentType "application/json"
```

**Current Response (Demo Data)**:
```json
{
  "modes": [
    {"mode": "walking", "duration": 15, "distance": 1200},
    {"mode": "cycling", "duration": 8, "distance": 1500},
    {"mode": "driving", "duration": 12, "distance": 2100}
  ],
  "service": "OpenRouteService (Demo Mode)"
}
```

**To Enable Real Travel Time**:
1. Get API key from https://openrouteservice.org/dev/#/signup
2. Add to `.env`: `OPENROUTE_API_KEY=your_key_here`
3. Uncomment OpenRouteService API code in `app.py` (lines 177-183)
4. Install `requests` package (already in requirements.txt)

---

### 5. AI Description Generator
**POST** `/api/ai/generate-description`

**Purpose**: Generate compelling PG descriptions using Gemini AI

**Request Body**:
```json
{
  "amenities": ["WiFi", "AC", "Attached Bathroom", "Food", "Laundry"],
  "location": "Koramangala, Bangalore",
  "rent": 12000,
  "room_type": "Single"
}
```

**cURL Test**:
```bash
curl -X POST http://localhost:5000/api/ai/generate-description ^
  -H "Content-Type: application/json" ^
  -d "{\"amenities\": [\"WiFi\", \"AC\", \"Attached Bathroom\", \"Food\", \"Laundry\"], \"location\": \"Koramangala, Bangalore\", \"rent\": 12000, \"room_type\": \"Single\"}"
```

**PowerShell Test**:
```powershell
$body = @{
    amenities = @("WiFi", "AC", "Attached Bathroom", "Food", "Laundry")
    location = "Koramangala, Bangalore"
    rent = 12000
    room_type = "Single"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/ai/generate-description" -Method Post -Body $body -ContentType "application/json"
```

**Expected Response**:
```json
{
  "description": "Discover comfort in the heart of Koramangala with this well-appointed single room offering modern amenities including WiFi, AC, and attached bathroom. Perfect for working professionals, this accommodation includes daily meals and laundry service, making your stay hassle-free. Located in one of Bangalore's most vibrant neighborhoods, you'll enjoy easy access to tech parks, cafes, and entertainment hubs."
}
```

---

## 🧪 Complete Test Suite

### Test All Endpoints (PowerShell Script)

Save as `test_all.ps1`:

```powershell
Write-Host "`n=== SmartStay Backend API Tests ===`n" -ForegroundColor Cyan

# 1. Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
    Write-Host "✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "✅ Gemini Configured: $($health.gemini_configured)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}

Write-Host "`n2. Testing Sentiment Analysis..." -ForegroundColor Yellow
try {
    $sentimentBody = @{
        reviews = @(
            @{text = "Amazing PG! Owner is very cooperative."}
            @{text = "Dirty washrooms and bad food quality."}
            @{text = "Okay for the price."}
        )
        pg_name = "Test PG"
    } | ConvertTo-Json

    $sentiment = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/sentiment-analysis" -Method Post -Body $sentimentBody -ContentType "application/json"
    Write-Host "✅ Overall Sentiment: $($sentiment.overall_sentiment)" -ForegroundColor Green
    Write-Host "   Positive: $($sentiment.positive_count) | Negative: $($sentiment.negative_count) | Neutral: $($sentiment.neutral_count)"
} catch {
    Write-Host "❌ Sentiment analysis failed: $_" -ForegroundColor Red
}

Write-Host "`n3. Testing Hidden Charge Detection..." -ForegroundColor Yellow
try {
    $chargesBody = @{
        description = "Nice room with basic facilities"
        rent = 9000
        deposit = 10000
        amenities = @("WiFi")
        rules = "No visitors after 10 PM"
    } | ConvertTo-Json

    $charges = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/hidden-charges" -Method Post -Body $chargesBody -ContentType "application/json"
    Write-Host "✅ Risk Level: $($charges.risk_level)" -ForegroundColor Green
    Write-Host "✅ Transparency Score: $($charges.transparency_score)%" -ForegroundColor Green
} catch {
    Write-Host "❌ Hidden charge detection failed: $_" -ForegroundColor Red
}

Write-Host "`n4. Testing Travel Time (Demo Mode)..." -ForegroundColor Yellow
try {
    $travelBody = @{
        from = @{lat = 28.6139; lng = 77.2090}
        to = "College"
        modes = @("foot-walking", "driving-car")
    } | ConvertTo-Json

    $travel = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/travel-time" -Method Post -Body $travelBody -ContentType "application/json"
    Write-Host "⚠️  Service: $($travel.service)" -ForegroundColor Yellow
    Write-Host "   (OpenRouteService API not connected - using demo data)"
} catch {
    Write-Host "❌ Travel time failed: $_" -ForegroundColor Red
}

Write-Host "`n5. Testing AI Description Generator..." -ForegroundColor Yellow
try {
    $descBody = @{
        amenities = @("WiFi", "AC", "Food")
        location = "MG Road, Bangalore"
        rent = 15000
        room_type = "Single"
    } | ConvertTo-Json

    $desc = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/description-generator" -Method Post -Body $descBody -ContentType "application/json"
    Write-Host "✅ Generated description successfully" -ForegroundColor Green
    Write-Host "   Preview: $($desc.description.Substring(0, [Math]::Min(80, $desc.description.Length)))..."
} catch {
    Write-Host "❌ Description generator failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Tests Complete ===`n" -ForegroundColor Cyan
```

Run with: `.\test_all.ps1`

---

## 📊 What's Currently Running

### Backend Services
1. **Flask Server** - Port 5000
   - CORS enabled for frontend (ports 8080, 5173)
   - Health check endpoint
   - 4 AI-powered endpoints

2. **Google Gemini AI** - Connected ✅
   - Sentiment analysis
   - Hidden charge detection  
   - Description generation

3. **OpenRouteService** - NOT Connected ❌
   - Returns demo data only
   - Needs API key in `.env`
   - Code ready, just needs configuration

### Database (Supabase)
- Connected via **frontend** only
- Backend doesn't directly access Supabase
- All database operations happen in frontend (`frontend/src/lib/supabase.ts`)

---

## 🔧 Environment Variables

Required in `backend/.env`:

```env
# Required - Get from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key

# Optional - Get from https://openrouteservice.org/dev/#/signup
# OPENROUTE_API_KEY=your_openroute_api_key
```

---

## 🐛 Debugging Tips

### Backend won't start
```bash
# Check Python version (needs 3.8+)
python --version

# Reinstall dependencies
pip install -r requirements.txt

# Check if port 5000 is in use
netstat -ano | findstr :5000
```

### Gemini API errors
- Verify API key in `.env`
- Check API quota at https://makersuite.google.com
- Ensure internet connection

### CORS errors from frontend
- Backend allows `http://localhost:8080` and `http://localhost:5173`
- Check frontend is running on these ports

---

## 📝 Quick Reference

| Feature | Status | Endpoint | AI Service |
|---------|--------|----------|------------|
| Sentiment Analysis | ✅ Working | `/api/ai/sentiment-analysis` | Gemini |
| Hidden Charges | ✅ Working | `/api/ai/hidden-charges` | Gemini |
| Description Gen | ✅ Working | `/api/ai/generate-description` | Gemini |
| Travel Time | ⚠️ Demo | `/api/ai/travel-time` | OpenRouteService (not connected) |
| Health Check | ✅ Working | `/health` | - |

---

## 🚀 Next Steps

To fully enable travel time feature:
1. Sign up at https://openrouteservice.org/dev/#/signup
2. Get free API key
3. Add to `.env`: `OPENROUTE_API_KEY=your_key`
4. Uncomment API code in `app.py` (lines 177-183)
5. Restart backend: `python app.py`
