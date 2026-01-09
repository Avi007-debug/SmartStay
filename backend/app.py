from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import json
import requests

# AI adapter
from ai_provider import ai

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:8080", "http://localhost:5173"])

# ============================================
# AI ENDPOINTS
# ============================================

@app.route('/api/ai/sentiment-analysis', methods=['POST'])
def sentiment_analysis():
    """
    Analyze sentiment from reviews of a PG listing
    Expected input: { "reviews": [...], "pg_name": "..." }
    """
    try:
        if not ai.is_configured():
            return jsonify({"error": "AI provider not configured"}), 500
        
        data = request.json
        reviews = data.get('reviews', [])
        pg_name = data.get('pg_name', 'this property')
        
        if not reviews:
            return jsonify({
                "overall_sentiment": "neutral",
                "positive_count": 0,
                "negative_count": 0,
                "neutral_count": 0,
                "insights": "No reviews available yet.",
                "keywords": {"positive": [], "negative": []}
            })
        
        # Create prompt for Gemini
        reviews_text = "\n".join([f"- {r.get('text', r.get('comment', ''))}" for r in reviews])
        
        prompt = f"""Analyze the following reviews for {pg_name} and provide a comprehensive sentiment analysis.

Reviews:
{reviews_text}

Please provide:
1. Overall sentiment (positive/negative/neutral)
2. Count of positive, negative, and neutral reviews
3. Key insights (2-3 bullet points)
4. Top 3 positive keywords and top 3 negative keywords

Return ONLY a valid JSON object with this exact structure:
{{
  "overall_sentiment": "positive/negative/neutral",
  "positive_count": <number>,
  "negative_count": <number>,
  "neutral_count": <number>,
  "insights": "<2-3 sentence summary>",
  "keywords": {{
    "positive": ["keyword1", "keyword2", "keyword3"],
    "negative": ["keyword1", "keyword2", "keyword3"]
  }}
}}"""
        
        response_text = ai.generate(prompt)
        result_text = response_text.strip()
        
        # Remove markdown code blocks if present
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        
        result = json.loads(result_text.strip())
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in sentiment analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/ai/hidden-charges', methods=['POST'])
def detect_hidden_charges():
    """
    Detect potential hidden charges from PG listing details
    Expected input: { "description": "...", "rent": 8500, "deposit": 5000, ... }
    """
    try:
        if not ai.is_configured():
            return jsonify({"error": "AI provider not configured"}), 500
        
        data = request.json
        description = data.get('description', '')
        rent = data.get('rent', 0)
        deposit = data.get('deposit', 0)
        amenities = data.get('amenities', [])
        rules = data.get('rules', '')
        
        prompt = f"""Analyze this PG listing for potential hidden charges or missing cost information.

Listing Details:
- Monthly Rent: ₹{rent}
- Security Deposit: ₹{deposit}
- Amenities: {', '.join(amenities) if amenities else 'Not specified'}
- Description: {description}
- Rules: {rules}

Identify:
1. Potential hidden charges that are NOT clearly mentioned (electricity, maintenance, food, parking, etc.)
2. Vague cost information that needs clarification
3. Risk level (low/medium/high)
4. Specific questions tenants should ask

Return ONLY a valid JSON object:
{{
  "risk_level": "low/medium/high",
  "potential_hidden_charges": [
    {{"charge": "charge name", "reason": "why it might be hidden"}}
  ],
  "missing_information": ["info1", "info2"],
  "questions_to_ask": ["question1", "question2"],
  "transparency_score": <number 0-100>
}}"""
        
        response_text = ai.generate(prompt)
        result_text = response_text.strip()
        
        # Remove markdown code blocks
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        
        result = json.loads(result_text.strip())
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in hidden charge detection: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/ai/travel-time', methods=['POST'])
def estimate_travel_time():
    """
    Estimate travel time between PG and destination using OpenRouteService
    Expected input: { "from": {"lat": 28.6139, "lng": 77.2090}, "to": {"lat": 28.5355, "lng": 77.3910}, "modes": ["foot-walking", "cycling-regular", "driving-car"] }
    
    Uses OpenRouteService API - free and open source alternative to Google Maps
    Get API key from: https://openrouteservice.org/dev/#/signup
    """
    try:
        data = request.json
        from_coords = data.get('from', {})
        to_coords = data.get('to', {})
        modes = data.get('modes', ['foot-walking', 'cycling-regular', 'driving-car'])
        
        # Validate coordinates
        if not from_coords.get('lat') or not from_coords.get('lng'):
            return jsonify({"error": "Missing 'from' coordinates (lat, lng)"}), 400
        if not to_coords.get('lat') or not to_coords.get('lng'):
            return jsonify({"error": "Missing 'to' coordinates (lat, lng)"}), 400
        
        # OpenRouteService API integration
        OPENROUTE_API_KEY = os.getenv('OPENROUTE_API_KEY')
        
        if OPENROUTE_API_KEY and OPENROUTE_API_KEY != 'your_openroute_api_key_here':
            # Real API implementation
            results = []
            base_url = "https://api.openrouteservice.org/v2/directions"
            
            # Map frontend modes to OpenRouteService profiles
            mode_mapping = {
                'foot-walking': 'foot-walking',
                'cycling-regular': 'cycling-regular', 
                'driving-car': 'driving-car',
                'walking': 'foot-walking',
                'cycling': 'cycling-regular',
                'driving': 'driving-car'
            }
            
            headers = {
                "Authorization": OPENROUTE_API_KEY,
                "Content-Type": "application/json"
            }
            
            for mode in modes:
                try:
                    profile = mode_mapping.get(mode, mode)
                    url = f"{base_url}/{profile}"
                    
                    payload = {
                        "coordinates": [
                            [from_coords['lng'], from_coords['lat']],  # OpenRouteService uses [lng, lat]
                            [to_coords['lng'], to_coords['lat']]
                        ]
                    }
                    
                    response = requests.post(url, json=payload, headers=headers, timeout=10)
                    
                    if response.status_code == 200:
                        route_data = response.json()
                        
                        if 'routes' in route_data and len(route_data['routes']) > 0:
                            route = route_data['routes'][0]
                            summary = route.get('summary', {})
                            
                            # Convert seconds to minutes
                            duration_min = round(summary.get('duration', 0) / 60)
                            # Distance in meters
                            distance_m = round(summary.get('distance', 0))
                            
                            results.append({
                                "mode": mode.replace('foot-walking', 'walking').replace('cycling-regular', 'cycling').replace('driving-car', 'driving'),
                                "duration": duration_min,  # in minutes
                                "distance": distance_m  # in meters
                            })
                    else:
                        print(f"OpenRouteService API error for {mode}: {response.status_code}")
                        
                except Exception as e:
                    print(f"Error fetching route for {mode}: {str(e)}")
                    continue
            
            if results:
                return jsonify({
                    "modes": results,
                    "service": "OpenRouteService",
                    "from": from_coords,
                    "to": to_coords
                })
        
        # Fallback: Return estimated data if no API key or API fails
        return jsonify({
            "modes": [
                {
                    "mode": "walking",
                    "duration": 15,
                    "distance": 1200
                },
                {
                    "mode": "cycling",
                    "duration": 8,
                    "distance": 1500
                },
                {
                    "mode": "driving",
                    "duration": 5,
                    "distance": 2100
                }
            ],
            "service": "OpenRouteService (Demo Mode - Add API key to .env)",
            "from": from_coords,
            "to": to_coords
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ai/generate-description', methods=['POST'])
def generate_description():
    """
    Generate compelling PG description using AI
    Expected input: { "amenities": [...], "location": "...", "rent": 8500, ... }
    """
    try:
        if not ai.is_configured():
            return jsonify({"error": "AI provider not configured"}), 500

        data = request.json
        amenities = data.get('amenities', [])
        location = data.get('location', '')
        rent = data.get('rent', 0)
        room_type = data.get('room_type', 'Shared')
        
        prompt = f"""Write a compelling and honest property description for a PG/hostel listing with these details:

- Location: {location}
- Monthly Rent: ₹{rent}
- Room Type: {room_type}
- Amenities: {', '.join(amenities)}

Write a 3-4 sentence description that:
1. Highlights key features
2. Mentions location benefits
3. Targets student/working professional audience
4. Sounds authentic and trustworthy

Return only the description text, no JSON."""
        
        response_text = ai.generate(prompt)
        description = response_text.strip()

        return jsonify({"description": description})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "ai_provider_configured": ai.is_configured(),
        "ai_provider": os.getenv('AI_PROVIDER', 'groq')
    })


if __name__ == '__main__':
    print("Starting SmartStay AI Backend...")
    print(f"AI provider configured: {ai.is_configured()} (provider={os.getenv('AI_PROVIDER', 'groq')})")
    if ai.is_configured():
        print("✅ AI provider initialized successfully")
    else:
        print("⚠️  Warning: AI provider not configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env")
    app.run(debug=True, host='0.0.0.0', port=5000)
