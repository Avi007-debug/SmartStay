# SmartStay - Complete Setup Guide

## What's New ✨

### AI-Powered Features (Backend Integration)
- **Sentiment Analysis**: Analyzes PG reviews using Google Gemini AI
- **Hidden Charge Detector**: Identifies potential hidden costs in listings
- **User Preferences**: Customizable search preferences with budget, location, amenities

### Fixed Issues
- ✅ Room fetching now pulls real data from Supabase (no hardcoded data)
- ✅ Storage RLS policies configured for image uploads
- ✅ Post Room feature fully functional with image upload
- ✅ Infinite loop issues in form sliders and amenities resolved

---

## Quick Start

### 1. Backend Setup (AI Features)

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Gemini API
1. Get API key from https://makersuite.google.com/app/apikey
2. Create `.env` file:
```bash
cp .env.example .env
```
3. Edit `.env` and add:
```env
GEMINI_API_KEY=your_actual_gemini_api_key
```

#### Start Backend Server
```bash
python app.py
```
Server runs on `http://localhost:5000`

---

### 2. Frontend Setup

#### Environment Variables
Already configured in `frontend/.env`:
```env
VITE_SUPABASE_URL=https://idlhbhxqtzgyjygklttr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_BACKEND_URL=http://localhost:5000
```

#### Start Frontend
```bash
cd frontend
npm run dev
```
App runs on `http://localhost:8080`

---

## Features Overview

### 🤖 AI-Powered Components

#### 1. Sentiment Analysis
- **Location**: PG Detail page
- **What it does**: Analyzes all reviews and provides:
  - Overall sentiment (positive/negative/neutral)
  - Satisfaction score percentage
  - Top positive keywords
  - Areas needing improvement
- **Backend API**: `POST /api/ai/sentiment-analysis`

#### 2. Hidden Charge Detector
- **Location**: PG Detail page, Post Room page
- **What it does**: Detects:
  - Potential hidden charges
  - Missing cost information
  - Transparency score (0-100)
  - Questions to ask owner
- **Backend API**: `POST /api/ai/hidden-charges`

#### 3. User Preferences
- **Location**: `/preferences` route
- **Features**:
  - Budget range slider
  - Preferred location
  - Room type preference
  - Gender preference
  - Amenity preferences
  - Notification settings (Email, WhatsApp)
- **Saved to**: Supabase `user_preferences` table

---

## Database Changes

### New Tables Used
1. **user_preferences**: Stores user search preferences
2. **pg_listings**: All PG data (connected to frontend)
3. **reviews**: User reviews (used by AI sentiment analysis)
4. **storage.objects**: Image uploads with RLS policies

### Storage Buckets
1. **pg-images**: PG listing photos (public read, auth write)
2. **profile-pictures**: User avatars (public read, auth write)
3. **verification-docs**: Owner verification (private)

---

## How To Use

### For Students/Users

#### 1. Sign Up & Login
- Go to `/auth`
- Create account with email/password
- Verify you're logged in (User icon appears in navbar)

#### 2. Set Preferences
- Click User icon → "Preferences"
- Set budget, location, room type
- Select preferred amenities
- Enable notifications

#### 3. Search for PGs
- Go to `/search`
- Listings load automatically from Supabase
- Use filters: budget, gender, verified only
- Click on a PG to view details

#### 4. View PG Details
- See photos, amenities, pricing
- **AI Sentiment Summary** shows review analysis
- **Hidden Charge Detector** warns about unclear costs
- Save to favorites or contact owner

---

### For PG Owners

#### 1. Post a Room
- Go to `/post-room`
- **Step 1**: Basic info (name, gender, room type, location)
- **Step 2**: Pricing (rent, deposit, charges)
- **Step 3**: Amenities (select all that apply)
- **Step 4**: Upload photos (multiple images)
- **Step 5**: Preview and submit

#### 2. Photos Upload
- Images stored in: `pg-images/{user_id}/{pg_id}/filename`
- RLS ensures users can only upload to their own folders
- Public can view all PG images

---

## API Endpoints

### Backend (AI Features)
```
POST /api/ai/sentiment-analysis     - Analyze reviews
POST /api/ai/hidden-charges         - Detect hidden costs
POST /api/ai/travel-time            - Estimate travel time
POST /api/ai/generate-description   - Generate PG description
GET  /health                        - Health check
```

### Frontend (Supabase)
All data fetching uses `frontend/src/lib/supabase.ts`:
- `pgService.getAll(filters)` - Get PG listings
- `pgService.create(data)` - Post new PG
- `reviewService.getByPGId(id)` - Get reviews
- `preferencesService.getPreferences()` - Get user prefs
- `storageService.uploadPGImage(file, pgId)` - Upload image

---

## Testing the AI Features

### Test Sentiment Analysis
1. Navigate to a PG detail page with reviews
2. Component automatically calls backend
3. See sentiment summary with keywords

### Test Hidden Charge Detector
1. Post a new room (or view existing PG)
2. AI analyzes description and pricing
3. Shows risk level and missing info

### Test Preferences
1. Go to `/preferences`
2. Set budget to ₹5000-₹15000
3. Select amenities (Wi-Fi, Food)
4. Save preferences
5. Go to `/search` - results should match preferences

---

## Troubleshooting

### Backend not starting
```bash
# Check if port 5000 is free
netstat -ano | findstr :5000

# Install dependencies again
pip install -r requirements.txt

# Check Gemini API key
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('GEMINI_API_KEY'))"
```

### AI features show "Loading..."
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify `VITE_BACKEND_URL` in frontend `.env`

### Image upload fails
- Run storage RLS SQL script in Supabase
- Check authentication (must be logged in)
- Verify bucket exists: `pg-images`

### Search shows no results
- Check Supabase connection
- Verify `pg_listings` table has data
- Insert test data via Supabase dashboard

---

## Next Steps

1. **Get Gemini API Key**: https://makersuite.google.com/app/apikey
2. **Start Backend**: `cd backend && python app.py`
3. **Start Frontend**: `cd frontend && npm run dev`
4. **Test Flow**:
   - Sign up → Set preferences → Search PGs → View details
   - Post a room → Upload images → Submit

---

## Files Created/Modified

### New Files
- `backend/app.py` - Flask AI backend
- `backend/requirements.txt` - Python dependencies
- `backend/.env.example` - Environment template
- `backend/README.md` - Backend documentation
- `frontend/src/pages/UserPreferences.tsx` - Preferences page
- `frontend/src/components/ai/SentimentSummary.tsx` - Updated with AI
- `frontend/src/components/ai/HiddenChargeDetector.tsx` - Updated with AI

### Modified Files
- `frontend/.env` - Added `VITE_BACKEND_URL`
- `frontend/src/App.tsx` - Added `/preferences` route
- `frontend/src/lib/supabase.ts` - Fixed upload path to use `user.id`
- `frontend/src/pages/PostRoom.tsx` - Fixed amenity selection loop
- `frontend/src/pages/Search.tsx` - Removed hardcoded data

---

## Support

For issues:
1. Check browser console (F12)
2. Check backend terminal logs
3. Verify Supabase dashboard for data
4. Test `/health` endpoint: http://localhost:5000/health

Happy coding! 🚀
