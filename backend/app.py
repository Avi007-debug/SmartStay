from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:8080", "http://localhost:5173"])

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables")
    model = None

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
        if not model:
            return jsonify({"error": "Gemini API not configured"}), 500
        
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
        
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
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
        if not model:
            return jsonify({"error": "Gemini API not configured"}), 500
        
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
        
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
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
    Expected input: { "from": {"lat": 28.6139, "lng": 77.2090}, "to": "destination", "modes": ["foot-walking", "cycling-regular", "driving-car"] }
    
    Alternative to Google Maps API - uses OpenRouteService (free, open source)
    Get API key from: https://openrouteservice.org/dev/#/signup
    """
    try:
        data = request.json
        from_coords = data.get('from', {})
        to_coords = data.get('to', '')
        modes = data.get('modes', ['foot-walking', 'cycling-regular', 'driving-car'])
        
        # OpenRouteService API integration
        # In production, add OPENROUTE_API_KEY to .env and use actual API
        # For now, return estimated data based on coordinates
        
        # Example: If you have OpenRouteService API key:
        # OPENROUTE_API_KEY = os.getenv('OPENROUTE_API_KEY')
        # if OPENROUTE_API_KEY:
        #     url = "https://api.openrouteservice.org/v2/directions/..."
        #     headers = {"Authorization": OPENROUTE_API_KEY}
        #     response = requests.get(url, headers=headers)
        #     return jsonify(response.json())
        
        # Fallback: Return estimated data
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
                    "duration": 12,
                    "distance": 2100
                }
            ],
            "service": "OpenRouteService (Demo Mode)"
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
        if not model:
            return jsonify({"error": "Gemini API not configured"}), 500
        
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
        
        response = model.generate_content(prompt)
        description = response.text.strip()
        
        return jsonify({"description": description})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "gemini_configured": model is not None
    })


if __name__ == '__main__':
    print("Starting SmartStay AI Backend...")
    print(f"Gemini API configured: {model is not None}")
    app.run(debug=True, host='0.0.0.0', port=5000)
