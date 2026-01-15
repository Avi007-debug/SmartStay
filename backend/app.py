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
        
        print(f"Received {len(reviews)} reviews for sentiment analysis")
        
        if not reviews:
            return jsonify({
                "overall_sentiment": "neutral",
                "positive_count": 0,
                "negative_count": 0,
                "neutral_count": 0,
                "insights": "No reviews available yet.",
                "keywords": {"positive": [], "negative": []}
            })
        
        # Create prompt for Gemini - check multiple possible field names
        reviews_text = "\n".join([
            f"- {r.get('review_text', r.get('text', r.get('comment', '')))}" 
            for r in reviews
        ])
        
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
        print(f"AI Response: {response_text[:200]}...")  # Log first 200 chars
        result_text = response_text.strip()
        
        # Remove markdown code blocks if present
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        
        result_text = result_text.strip()
        
        if not result_text:
            print("ERROR: Empty response from AI")
            return jsonify({"error": "AI returned empty response"}), 500
        
        result = json.loads(result_text)
        return jsonify(result)
        
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {str(e)}")
        print(f"Response text was: {response_text if 'response_text' in locals() else 'N/A'}")
        return jsonify({"error": f"Invalid JSON from AI: {str(e)}"}), 500
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
    Expected input: { "from_address": "Pune, Maharashtra", "to_address": "College Road, Pune", "modes": [...] }
    OR { "from": {"lat": 28.6139, "lng": 77.2090}, "to": {"lat": 28.5355, "lng": 77.3910}, "modes": [...] }
    
    Uses OpenRouteService API for both geocoding and routing
    """
    try:
        data = request.json
        from_coords = data.get('from', {})
        to_coords = data.get('to', {})
        from_address = data.get('from_address')
        to_address = data.get('to_address')
        modes = data.get('modes', ['foot-walking', 'cycling-regular', 'driving-car'])
        
        OPENROUTE_API_KEY = os.getenv('OPENROUTE_API_KEY')
        
        if not OPENROUTE_API_KEY or OPENROUTE_API_KEY == 'your_openroute_api_key_here':
            return jsonify({
                "modes": [
                    {"mode": "walking", "duration": 15, "distance": 1200},
                    {"mode": "cycling", "duration": 8, "distance": 1500},
                    {"mode": "driving", "duration": 5, "distance": 2100}
                ],
                "service": "Demo Mode - Add OPENROUTE_API_KEY to .env"
            })
        
        # Geocode addresses if provided
        if from_address and to_address:
            geocode_url = "https://api.openrouteservice.org/geocode/search"
            headers = {"Authorization": OPENROUTE_API_KEY}
            
            # Helper function to try geocoding with fallback addresses
            def geocode_with_fallback(address, label):
                # Try original address first
                addresses_to_try = [address]
                
                # Create simpler fallback versions
                # Extract city/area from complex addresses
                if ',' in address:
                    parts = [p.strip() for p in address.split(',')]
                    # Try last 2-3 parts (usually city, state)
                    if len(parts) >= 2:
                        addresses_to_try.append(f"{parts[-2]}, {parts[-1]}")
                    if len(parts) >= 3:
                        addresses_to_try.append(f"{parts[-3]}, {parts[-2]}, {parts[-1]}")
                
                for addr in addresses_to_try:
                    try:
                        print(f"Trying to geocode {label}: {addr}")
                        response = requests.get(
                            geocode_url,
                            params={"text": addr, "size": 1},
                            headers=headers,
                            timeout=10
                        )
                        print(f"Geocode {label} status: {response.status_code}")
                        
                        if response.status_code == 200:
                            data = response.json()
                            if data.get('features') and len(data['features']) > 0:
                                coords = data['features'][0]['geometry']['coordinates']
                                result = {'lng': coords[0], 'lat': coords[1]}
                                print(f"{label} coords: {result}")
                                return result
                    except Exception as e:
                        print(f"Error geocoding {label} with '{addr}': {str(e)}")
                        continue
                
                return None
            
            # Geocode 'from' address
            from_coords = geocode_with_fallback(from_address, "'from'")
            if not from_coords:
                return jsonify({"error": f"Could not locate: {from_address}"}), 400
            
            # Geocode 'to' address
            to_coords = geocode_with_fallback(to_address, "'to'")
            if not to_coords:
                return jsonify({"error": f"Could not locate: {to_address}"}), 400
        
        # Validate coordinates
        if not from_coords.get('lat') or not from_coords.get('lng'):
            return jsonify({"error": "Missing 'from' coordinates"}), 400
        if not to_coords.get('lat') or not to_coords.get('lng'):
            return jsonify({"error": "Missing 'to' coordinates"}), 400
        
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


@app.route('/api/ai/personalized-recommendations', methods=['POST'])
def personalized_recommendations():
    """
    Get AI-powered personalized PG recommendations based on user preferences
    Expected input: { 
        "user_preferences": {
            "budget": {"min": 5000, "max": 15000},
            "college": "VIT Pune",
            "amenities": ["WiFi", "Meals"],
            "gender": "any",
            "strictnessTolerance": "moderate"
        },
        "available_pgs": [{id, name, rent, amenities, ...}],
        "user_history": {
            "recently_viewed": [...],
            "saved_pgs": [...],
            "search_patterns": [...]
        }
    }
    """
    try:
        if not ai.is_configured():
            return jsonify({"error": "AI provider not configured"}), 500
        
        data = request.json
        preferences = data.get('user_preferences', {})
        available_pgs = data.get('available_pgs', [])
        user_history = data.get('user_history', {})
        
        if not available_pgs:
            return jsonify({"recommendations": []})
        
        # Limit to top 50 PGs to avoid token limits
        pgs_sample = available_pgs[:50]
        
        # Format PG data for AI
        pgs_text = "\n".join([
            f"- PG #{pg.get('id')}: {pg.get('name')} | Rent: ₹{pg.get('rent')} | "
            f"Amenities: {', '.join(pg.get('amenities', [])[:5])} | "
            f"Location: {pg.get('address', {}).get('area', 'N/A')} | "
            f"Rating: {pg.get('average_rating', 0)}/5"
            for pg in pgs_sample
        ])
        
        recently_viewed = user_history.get('recently_viewed', [])[:5]
        saved_pgs = user_history.get('saved_pgs', [])[:5]
        
        prompt = f"""Analyze these PG listings and provide personalized recommendations for the user.

USER PREFERENCES:
- Budget: ₹{preferences.get('budget', {}).get('min', 5000)} - ₹{preferences.get('budget', {}).get('max', 15000)}
- College/Workplace: {preferences.get('college', 'Not specified')}
- Preferred Amenities: {', '.join(preferences.get('amenities', []))}
- Gender Preference: {preferences.get('gender', 'any')}
- Strictness Tolerance: {preferences.get('strictnessTolerance', 'moderate')}

USER BEHAVIOR:
- Recently Viewed: {len(recently_viewed)} PGs
- Saved PGs: {len(saved_pgs)} PGs

AVAILABLE PG LISTINGS:
{pgs_text}

Recommend the TOP 5 best-matching PGs. For each, provide:
1. Match score (0-100)
2. 2-3 specific reasons why it matches user preferences
3. Consider: budget fit, amenities match, location, ratings, user's past behavior

CRITICAL: Return ONLY valid JSON with no extra text. Use double quotes for strings. Escape any quotes in text.

Exact format:
{{
  "recommendations": [
    {{
      "pg_id": "id_here",
      "match_score": 85,
      "match_reasons": ["Within budget", "Has WiFi"]
    }}
  ]
}}"""
        
        # Increase max_tokens for longer response with 5 recommendations
        response_text = ai.generate(prompt, max_tokens=2048)
        result_text = response_text.strip()
        
        # Remove markdown code blocks
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        
        result_text = result_text.strip()
        
        # Try to extract valid JSON even if response is truncated
        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            # If parsing fails, try to find the JSON object
            import re
            json_match = re.search(r'\{[\s\S]*\}', result_text)
            if json_match:
                try:
                    result = json.loads(json_match.group())
                except:
                    raise
            else:
                raise
        
        return jsonify(result)
        
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error in recommendations: {str(e)}")
        print(f"Raw AI response: {response_text[:500] if 'response_text' in locals() else 'N/A'}")
        # Return empty recommendations as fallback
        return jsonify({
            "recommendations": [],
            "error": "AI response formatting issue. Please try again."
        }), 200
    except Exception as e:
        print(f"Error in personalized recommendations: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/ai/chatbot', methods=['POST'])
def chatbot_support():
    """
    Customer support chatbot using AI
    Expected input: { 
        "message": "user question",
        "chat_history": [{"role": "user", "content": "..."}, {"role": "bot", "content": "..."}],
        "context": {"current_page": "home", "user_role": "user"}
    }
    """
    try:
        if not ai.is_configured():
            return jsonify({"error": "AI provider not configured"}), 500
        
        data = request.json
        user_message = data.get('message', '')
        chat_history = data.get('chat_history', [])
        context = data.get('context', {})
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        # Build conversation context
        history_text = ""
        if chat_history:
            history_text = "\n".join([
                f"{'User' if msg.get('role') == 'user' else 'Bot'}: {msg.get('content', '')}"
                for msg in chat_history[-5:]  # Last 5 messages
            ])
        
        current_page = context.get('current_page', 'unknown')
        user_role = context.get('user_role', 'guest')
        
        prompt = f"""You are SmartStay Assistant, a helpful customer support chatbot for SmartStay - a platform for finding PG/hostel accommodations.

USER CONTEXT:
- Current Page: {current_page}
- User Role: {user_role}

CONVERSATION HISTORY:
{history_text if history_text else 'No previous messages'}

USER: {user_message}

Provide a helpful, friendly, and concise response (2-4 sentences). You can help with:
- Finding PG listings
- Understanding features (reviews, Q&A, vacancy alerts, price tracking)
- How to post a PG (for owners)
- Account and verification help
- Explaining AI features (sentiment analysis, hidden charge detector, travel time)

Return ONLY valid JSON:
{{
  "response": "<your helpful response text>",
  "suggested_actions": ["action1", "action2"]
}}

Suggested actions are optional quick-reply buttons like "Search PGs", "View Dashboard", "Contact Support"."""
        
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
        
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error in chatbot: {str(e)}")
        # Fallback response
        return jsonify({
            "response": "I'm here to help! You can ask me about finding PGs, understanding features, or using the platform.",
            "suggested_actions": ["Search PGs", "View Dashboard"]
        })
    except Exception as e:
        print(f"Error in chatbot: {str(e)}")
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
