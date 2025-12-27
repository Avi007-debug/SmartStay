# SmartStay AI Backend

AI-powered backend service for SmartStay using Google Gemini API for intelligent features.

## Features

- **Sentiment Analysis**: Analyzes PG reviews to provide sentiment insights
- **Hidden Charge Detection**: Identifies potential hidden costs and missing information
- **Travel Time Estimation**: Calculates travel time between PG and destinations
- **AI Description Generator**: Creates compelling property descriptions

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get Gemini API Key:**
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in `.env`

### 3. Run the Server

```bash
python app.py
```

Server will start on `http://localhost:5000`

## API Endpoints

### 1. Sentiment Analysis
**POST** `/api/ai/sentiment-analysis`

Analyzes reviews and provides sentiment insights.

**Request:**
```json
{
  "reviews": [
    {"text": "Great PG with amazing food"},
    {"text": "Clean rooms but Wi-Fi is slow"}
  ],
  "pg_name": "Sunshine PG"
}
```

**Response:**
```json
{
  "overall_sentiment": "positive",
  "positive_count": 8,
  "negative_count": 2,
  "neutral_count": 1,
  "insights": "Most residents appreciate the food quality...",
  "keywords": {
    "positive": ["food", "clean", "staff"],
    "negative": ["wifi", "curfew"]
  }
}
```

### 2. Hidden Charge Detection
**POST** `/api/ai/hidden-charges`

Detects potential hidden charges from listing details.

**Request:**
```json
{
  "description": "Spacious PG near college",
  "rent": 8500,
  "deposit": 5000,
  "amenities": ["Wi-Fi", "Food"],
  "rules": "Curfew at 10 PM"
}
```

**Response:**
```json
{
  "risk_level": "medium",
  "potential_hidden_charges": [
    {
      "charge": "Electricity charges",
      "reason": "Not mentioned in description"
    }
  ],
  "missing_information": ["Maintenance charges", "Water charges"],
  "questions_to_ask": [
    "Are electricity charges included?",
    "What are the maintenance fees?"
  ],
  "transparency_score": 65
}
```

### 3. Travel Time Estimation
**POST** `/api/ai/travel-time`

Estimates travel time between locations.

**Request:**
```json
{
  "from": "28.6139,77.2090",
  "to": "28.7041,77.1025",
  "mode": "walking"
}
```

**Response:**
```json
{
  "distance_km": 2.5,
  "duration_minutes": 25,
  "mode": "walking",
  "route_summary": "Via Main Road"
}
```

### 4. Generate Description
**POST** `/api/ai/generate-description`

Generates compelling property description using AI.

**Request:**
```json
{
  "amenities": ["Wi-Fi", "Food", "AC"],
  "location": "Near Delhi University",
  "rent": 8500,
  "room_type": "Shared"
}
```

**Response:**
```json
{
  "description": "Comfortable shared accommodation near Delhi University..."
}
```

### 5. Health Check
**GET** `/health`

Check backend service status.

**Response:**
```json
{
  "status": "healthy",
  "gemini_configured": true
}
```

## Frontend Integration

The frontend automatically connects to the backend at `http://localhost:5000`.

**Components using AI:**
- `SentimentSummary.tsx` - Displays AI sentiment analysis
- `HiddenChargeDetector.tsx` - Shows potential hidden charges
- `TravelTimeEstimator.tsx` - Calculates travel times

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Error message"
}
```

Common errors:
- `500`: Gemini API not configured or API error
- `400`: Invalid request data

## Development

**Enable Debug Mode:**
```env
FLASK_ENV=development
FLASK_DEBUG=1
```

**CORS:** Configured for `localhost:8080` and `localhost:5173`

## Production Deployment

1. Set `FLASK_ENV=production` in `.env`
2. Use a production WSGI server (Gunicorn, uWSGI)
3. Configure proper CORS origins
4. Secure API keys using environment variables

## Troubleshooting

**Backend not responding:**
- Check if server is running on port 5000
- Verify `VITE_BACKEND_URL` in frontend `.env`

**AI features not working:**
- Verify `GEMINI_API_KEY` is valid
- Check `/health` endpoint
- Review backend console logs

**CORS errors:**
- Ensure frontend URL is in CORS allowed origins
- Check browser console for specific CORS error

## License

MIT License - See LICENSE file for details
