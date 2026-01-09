# OpenRouteService API Setup Guide

## Get Your Free API Key

OpenRouteService provides **free routing, geocoding, and isochrone services** as an open-source alternative to Google Maps.

### Step 1: Sign Up
1. Go to https://openrouteservice.org/dev/#/signup
2. Fill in the registration form:
   - Email address
   - Create password
   - Accept terms and conditions
3. Click "Sign up"
4. Verify your email address (check inbox for confirmation link)

### Step 2: Get API Key
1. Log in at https://openrouteservice.org/dev/#/login
2. Go to your Dashboard
3. Click "Request a Token" or view existing tokens
4. Select **Free Plan** (40 requests/minute, 2000 requests/day - more than enough for testing)
5. Copy your API token

### Step 3: Add to SmartStay
1. Open `backend/.env` file
2. Find the line: `OPENROUTE_API_KEY=your_openroute_api_key_here`
3. Replace with your actual key: `OPENROUTE_API_KEY=5b3ce3597851110001cf62489abc...`
4. Save the file
5. Restart your Flask backend

### Step 4: Test It
Run the test script:
```powershell
cd backend
.\test_all.ps1
```

Or test manually:
```powershell
$body = @{
    from = @{lat = 12.9716; lng = 77.5946}
    to = @{lat = 12.9352; lng = 77.6245}
    modes = @("foot-walking", "cycling-regular", "driving-car")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/ai/travel-time" -Method Post -Body $body -ContentType "application/json"
```

You should see **real routing data** instead of "Demo Mode"!

## API Limits (Free Plan)
- **40 requests per minute**
- **2,000 requests per day**
- Perfect for development and testing
- Sufficient for small-to-medium production apps

## Available Services
✅ **Directions** - Walking, cycling, driving routes (what we use)
✅ **Geocoding** - Convert addresses to coordinates
✅ **Reverse Geocoding** - Convert coordinates to addresses
✅ **Isochrones** - Travel time areas (e.g., "show all places within 30 min")
✅ **Matrix** - Distance/time between multiple points

## Need More?
- **Standard Plan**: 500 requests/min ($49/month)
- **Premium Plan**: Custom limits (enterprise)

For SmartStay, the **Free Plan is perfect** for development and small deployments!

## Troubleshooting

### "Invalid API Key" Error
- Double-check you copied the entire key (they're long!)
- Make sure there are no spaces before/after the key in `.env`
- Verify your email address was confirmed

### "Rate Limit Exceeded"
- You hit the 40 req/min or 2000 req/day limit
- Wait a minute and try again
- Consider caching results in production

### Still Getting Demo Data?
1. Check `.env` file has correct key
2. Restart Flask server: `Ctrl+C` then `python app.py`
3. Check server logs for API errors
4. Test with cURL to verify key works:
```bash
curl -X POST "https://api.openrouteservice.org/v2/directions/foot-walking" \
  -H "Authorization: YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"coordinates":[[77.5946,12.9716],[77.6245,12.9352]]}'
```

## Alternative: Google Maps Directions API
If you prefer Google Maps:
1. Get API key from https://console.cloud.google.com/
2. Enable "Directions API"
3. You'll need to modify `app.py` to use Google's format
4. Note: Google requires billing info (free tier: 40,000 requests/month)

OpenRouteService is **recommended** because:
- 100% free forever
- No credit card required
- Open source
- Privacy-friendly (EU-hosted)
- Same quality as commercial services
