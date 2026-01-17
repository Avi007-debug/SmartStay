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

# Configure CORS for production and development
allowed_origins = [
    "http://localhost:8080",
    "http://localhost:5173",
    "https://smartstay-ruddy.vercel.app",
    os.getenv("FRONTEND_URL", "")
]
# Filter out empty strings
allowed_origins = [origin for origin in allowed_origins if origin]
CORS(app, origins=allowed_origins, supports_credentials=True)

# ============================================
# AI ENDPOINTS
# ============================================
@app.route("/")
def home():
    return "SmartStay backend is running"

@app.route("/api/health")
def health():
    return {"status": "ok"}

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
    Expected input: { "description": "...", "rent": 8500, "deposit": 5000, "amenities": [...], "rules": "...", "maintenanceCharges": "", "electricityCharges": "", "foodIncluded": false }
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
        maintenance_charges = data.get('maintenanceCharges', '')
        electricity_charges = data.get('electricityCharges', '')
        food_included = data.get('foodIncluded', False)
        
        # Prepare comprehensive listing text
        amenities_text = ', '.join(amenities) if amenities else 'Not specified'
        
        # Format additional charge information
        maintenance_text = f"₹{maintenance_charges}/month" if maintenance_charges and str(maintenance_charges).strip() and str(maintenance_charges) != '0' else "Not specified"
        electricity_text = electricity_charges if electricity_charges and str(electricity_charges).strip() else "Not specified"
        food_text = "Yes, food is included" if food_included else "Not specified"
        
        # Check what information is actually provided
        has_description = bool(description and len(description.strip()) > 20)
        has_amenities = bool(amenities and len(amenities) > 0)
        has_rules = bool(rules and len(str(rules).strip()) > 10)
        
        prompt = f"""You are analyzing a PG (Paying Guest) listing for transparency and potential hidden charges.

COMPLETE LISTING INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Monthly Rent: ₹{rent}
Security Deposit: ₹{deposit}

Amenities Provided: {amenities_text}

**MAINTENANCE CHARGES:** {maintenance_text}
**ELECTRICITY CHARGES:** {electricity_text}
**FOOD AVAILABILITY:** {food_text}

Property Description:
{description if description else 'No description provided'}

House Rules & Terms:
{rules if rules else 'No rules specified'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ CRITICAL INSTRUCTIONS - READ THE DATA ABOVE FIRST! ⚠️

STEP 1: CHECK WHAT IS ACTUALLY SPECIFIED
Look at the three fields marked with ** above:
✓ If MAINTENANCE CHARGES shows "₹[amount]/month" or a number → IT IS SPECIFIED
✓ If ELECTRICITY CHARGES shows a number or rate (like "200" or "₹5/unit") → IT IS SPECIFIED  
✓ If FOOD AVAILABILITY says "Yes" or describes food → IT IS SPECIFIED
✗ ONLY if it says "Not specified" → THEN it is missing

STEP 2: CALCULATE TRANSPARENCY SCORE

BASE: 40 points (rent + deposit provided)

ADD points for SPECIFIED information:
+ Maintenance IS specified (has ₹ or number): +15 points
+ Electricity IS specified (has number/rate): +15 points
+ Food IS specified (says Yes or details): +10 points
+ Amenities list with 3+ items: +10 points
+ Description 50+ words: +5 points
+ Rules specified: +5 points

DEDUCT points for MISSING information:
- Maintenance shows "Not specified": -10 points
- Electricity shows "Not specified": -10 points
- Food shows "Not specified": -5 points
- No description or very short: -5 points

SCORE RANGES:
85-100: Excellent (all critical info provided)
70-84: Very Good (most info clear)
55-69: Good (basic transparency)
40-54: Fair (missing some details)
0-39: Poor (many details missing)

STEP 3: LIST ONLY ACTUAL MISSING INFO

For "potential_hidden_charges" and "missing_information":
- ONLY include items that show "Not specified" in the data above
- DO NOT flag maintenance if it shows "₹500/month" 
- DO NOT flag electricity if it shows "200" or any value
- DO NOT flag food if it says "Yes, food is included"

EXAMPLE:
Data shows: "MAINTENANCE CHARGES: ₹500/month"
✓ Correct: Add +15 to score, do NOT add to potential_hidden_charges
✗ Wrong: Add "Maintenance Charges" to potential_hidden_charges with reason "Not specified"

Return ONLY valid JSON (no markdown, no text before/after):
{{
  "risk_level": "low/medium/high",
  "potential_hidden_charges": [
    {{"charge": "name", "reason": "why hidden"}}
  ],
  "missing_information": ["only items showing 'Not specified'"],
  "questions_to_ask": ["questions about unclear items"],
  "transparency_score": <number 0-100>
}}

START WITH {{ - NO OTHER TEXT!
        
        response_text = ai.generate(prompt, temperature=0)
        
        # Debug logging
        if not response_text or not response_text.strip():
            print("ERROR: AI returned empty response")
            print(f"Prompt was: {prompt[:200]}...")
            raise ValueError("AI returned empty response")
        
        result_text = response_text.strip()
        print(f"AI Response (first 200 chars): {result_text[:200]}")
        
        # Remove markdown code blocks and headers
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        
        # Remove common AI response prefixes
        prefixes_to_remove = [
            "Here's the analysis:",
            "Based on the provided listing, here's the analysis:",
            "Based on the listing:",
            "Here is the analysis:",
            "Analysis:",
        ]
        for prefix in prefixes_to_remove:
            if result_text.startswith(prefix):
                result_text = result_text[len(prefix):].strip()
                break
        
        # Remove markdown code blocks
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]
        
        # Extract JSON if there's extra text
        result_text = result_text.strip()
        if '{' in result_text and '}' in result_text:
            start = result_text.find('{')
            end = result_text.rfind('}') + 1
            result_text = result_text[start:end]
        else:
            print(f"ERROR: No JSON found in response: {result_text}")
            raise ValueError("No valid JSON in AI response")
        
        result = json.loads(result_text)
        
        # Validate and sanitize response
        if not isinstance(result, dict):
            result = {}
        
        # Ensure risk_level is valid
        risk_level = result.get('risk_level', 'medium')
        if risk_level not in ['low', 'medium', 'high']:
            risk_level = 'medium'
        result['risk_level'] = risk_level
        
        # Ensure transparency_score is valid (0-100)
        transparency_score = result.get('transparency_score', 50)
        try:
            transparency_score = float(transparency_score)
            transparency_score = max(0, min(100, transparency_score))
        except (ValueError, TypeError):
            transparency_score = 50
        result['transparency_score'] = int(transparency_score)
        
        # Ensure arrays exist and are valid
        if 'potential_hidden_charges' not in result or not isinstance(result['potential_hidden_charges'], list):
            result['potential_hidden_charges'] = []
        
        # Validate charge objects
        valid_charges = []
        for charge in result['potential_hidden_charges']:
            if isinstance(charge, dict) and 'charge' in charge and 'reason' in charge:
                valid_charges.append({
                    'charge': str(charge['charge']),
                    'reason': str(charge['reason'])
                })
        result['potential_hidden_charges'] = valid_charges
        
        # Post-processing: Remove false positives - charges that were actually provided
        # Check if maintenance, electricity, or food were specified
        has_maintenance = maintenance_charges and str(maintenance_charges).strip() and str(maintenance_charges) != '0'
        has_electricity = electricity_charges and str(electricity_charges).strip()
        has_food = food_included
        
        # Filter out charges that are actually specified
        filtered_charges = []
        for charge in result['potential_hidden_charges']:
            charge_name_lower = charge['charge'].lower()
            
            # Skip if maintenance was provided and this charge is about maintenance
            if has_maintenance and ('maintenance' in charge_name_lower):
                continue
            
            # Skip if electricity was provided and this charge is about electricity
            if has_electricity and ('electricity' in charge_name_lower or 'electric' in charge_name_lower):
                continue
            
            # Skip if food was provided and this charge is about food
            if has_food and ('food' in charge_name_lower):
                continue
            
            filtered_charges.append(charge)
        
        result['potential_hidden_charges'] = filtered_charges
        
        # Also filter missing_information
        filtered_missing = []
        for item in result.get('missing_information', []):
            item_lower = item.lower()
            
            if has_maintenance and 'maintenance' in item_lower:
                continue
            if has_electricity and ('electricity' in item_lower or 'electric' in item_lower):
                continue
            if has_food and 'food' in item_lower:
                continue
            
            filtered_missing.append(item)
        
        result['missing_information'] = filtered_missing
        
        # Recalculate transparency score if we removed charges
        original_charge_count = len(valid_charges)
        filtered_charge_count = len(filtered_charges)
        if original_charge_count > filtered_charge_count and result['transparency_score'] < 70:
            # Boost score since we removed false positives
            score_boost = (original_charge_count - filtered_charge_count) * 10
            result['transparency_score'] = min(100, result['transparency_score'] + score_boost)
        
        if 'questions_to_ask' not in result or not isinstance(result['questions_to_ask'], list):
            result['questions_to_ask'] = []
        result['questions_to_ask'] = [str(x) for x in result['questions_to_ask'] if x]
        
        # Ensure at least some questions
        if len(result['questions_to_ask']) < 3:
            default_questions = [
                "Are there any additional charges apart from rent and deposit?",
                "What utilities are included in the rent?",
                "Is there a maintenance fee, and what does it cover?"
            ]
            for q in default_questions:
                if q not in result['questions_to_ask']:
                    result['questions_to_ask'].append(q)
                if len(result['questions_to_ask']) >= 3:
                    break
        
        return jsonify(result)
        
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error in hidden charge detection: {str(e)}")
        print(f"Response text was: {response_text if 'response_text' in locals() else 'N/A'}")
        # Return a safe fallback response
        return jsonify({
            "risk_level": "medium",
            "potential_hidden_charges": [],
            "missing_information": ["Unable to analyze - please verify all charges with owner"],
            "questions_to_ask": [
                "Are there any additional charges apart from rent and deposit?",
                "What utilities are included in the rent?",
                "Is there a maintenance fee?"
            ],
            "transparency_score": 50,
            "error": "Analysis temporarily unavailable"
        })
    except Exception as e:
        print(f"Error in hidden charge detection: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        if 'response_text' in locals():
            print(f"Response was: {response_text[:500] if response_text else 'EMPTY'}")
        # Return fallback response instead of 500 error
        return jsonify({
            "risk_level": "medium",
            "potential_hidden_charges": [],
            "missing_information": ["Unable to analyze listing at this time"],
            "questions_to_ask": [
                "Please verify all charges and fees with the owner",
                "Ask about electricity, maintenance, and any other costs",
                "Confirm what amenities are included in the rent"
            ],
            "transparency_score": 50,
            "error": str(e)
        })


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


# ============================================
# RECENTLY VIEWED ENDPOINTS
# ============================================

@app.route('/api/recently-viewed', methods=['POST'])
def add_recently_viewed():
    """
    Add/update recently viewed PG for a user
    Expected input: { "user_id": "...", "pg_id": "..." }
    """
    try:
        data = request.json
        user_id = data.get('user_id')
        pg_id = data.get('pg_id')
        
        if not user_id or not pg_id:
            return jsonify({"error": "user_id and pg_id are required"}), 400
        
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not SUPABASE_URL or not SUPABASE_KEY:
            return jsonify({"error": "Supabase not configured"}), 500
        
        # Upsert into recently_viewed (will update viewed_at if exists)
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        }
        
        payload = {
            'user_id': user_id,
            'pg_id': pg_id,
            'viewed_at': 'now()'
        }
        
        response = requests.post(
            f'{SUPABASE_URL}/rest/v1/recently_viewed',
            headers=headers,
            json=payload
        )
        
        if response.status_code in [200, 201]:
            return jsonify({"success": True, "message": "Added to recently viewed"})
        else:
            return jsonify({"error": response.text}), response.status_code
            
    except Exception as e:
        print(f"Error adding recently viewed: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ============================================
# MODERATION / CONTENT REPORTS ENDPOINTS
# ============================================

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """
    Get all content reports (admin only)
    Query params: ?status=pending&content_type=listing
    """
    try:
        status = request.args.get('status')
        content_type = request.args.get('content_type')
        
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        }
        
        url = f'{SUPABASE_URL}/rest/v1/content_reports?select=*,reporter:profiles!reporter_id(full_name)&order=created_at.desc'
        
        if status:
            url += f'&status=eq.{status}'
        if content_type:
            url += f'&content_type=eq.{content_type}'
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": response.text}), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/reports', methods=['POST'])
def create_report():
    """
    Create a new content report
    Expected input: { "reporter_id": "...", "content_type": "listing", "content_id": "...", "reason": "spam", "description": "..." }
    """
    try:
        data = request.json
        required = ['reporter_id', 'content_type', 'content_id', 'reason']
        
        if not all(k in data for k in required):
            return jsonify({"error": "Missing required fields"}), 400
        
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        response = requests.post(
            f'{SUPABASE_URL}/rest/v1/content_reports',
            headers=headers,
            json=data
        )
        
        if response.status_code in [200, 201]:
            return jsonify(response.json()[0])
        else:
            return jsonify({"error": response.text}), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/reports/<report_id>/review', methods=['POST'])
def review_report(report_id):
    """
    Admin action: review and resolve a report
    Expected input: { "admin_id": "...", "action": "resolve|dismiss", "resolution_notes": "...", "content_action": "remove|warn|none" }
    """
    try:
        data = request.json
        action = data.get('action')
        admin_id = data.get('admin_id')
        resolution_notes = data.get('resolution_notes', '')
        content_action = data.get('content_action', 'none')
        
        if not action or not admin_id:
            return jsonify({"error": "action and admin_id required"}), 400
        
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        # Get report details first
        report_response = requests.get(
            f'{SUPABASE_URL}/rest/v1/content_reports?id=eq.{report_id}',
            headers=headers
        )
        
        if report_response.status_code != 200 or not report_response.json():
            return jsonify({"error": "Report not found"}), 404
        
        report = report_response.json()[0]
        
        # Update report status
        update_data = {
            'status': 'resolved' if action == 'resolve' else 'dismissed',
            'reviewed_by': admin_id,
            'resolution_notes': resolution_notes,
            'resolved_at': 'now()'
        }
        
        response = requests.patch(
            f'{SUPABASE_URL}/rest/v1/content_reports?id=eq.{report_id}',
            headers=headers,
            json=update_data
        )
        
        # If action is resolve and content should be removed
        if action == 'resolve' and content_action == 'remove':
            content_type = report['content_type']
            content_id = report['content_id']
            
            if content_type == 'listing':
                requests.patch(
                    f'{SUPABASE_URL}/rest/v1/pg_listings?id=eq.{content_id}',
                    headers=headers,
                    json={'status': 'removed'}
                )
            elif content_type == 'review':
                requests.patch(
                    f'{SUPABASE_URL}/rest/v1/reviews?id=eq.{content_id}',
                    headers=headers,
                    json={'is_flagged': True}
                )
        
        # Send notification to reporter
        notification_data = {
            'user_id': report['reporter_id'],
            'type': 'listing_flagged',
            'title': 'Report Reviewed',
            'message': f'Your report has been {action}ed. {resolution_notes}',
            'payload': {'report_id': report_id}
        }
        
        requests.post(
            f'{SUPABASE_URL}/rest/v1/notifications',
            headers=headers,
            json=notification_data
        )
        
        return jsonify({"success": True, "message": f"Report {action}ed successfully"})
        
    except Exception as e:
        print(f"Error reviewing report: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ============================================
# DOCUMENT VERIFICATION ENDPOINTS
# ============================================

@app.route('/api/verification/upload-url', methods=['POST'])
def get_upload_url():
    """
    Generate a signed upload URL for verification documents
    Expected input: { "owner_id": "...", "file_name": "...", "content_type": "image/jpeg" }
    Returns: { "upload_url": "...", "file_path": "..." }
    """
    try:
        data = request.json
        owner_id = data.get('owner_id')
        file_name = data.get('file_name')
        content_type = data.get('content_type', 'application/pdf')
        
        if not owner_id or not file_name:
            return jsonify({"error": "owner_id and file_name required"}), 400
        
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        # Generate unique file path
        import uuid
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_path = f"verification/{owner_id}/{timestamp}_{uuid.uuid4().hex[:8]}_{file_name}"
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        }
        
        # Create signed upload URL
        response = requests.post(
            f'{SUPABASE_URL}/storage/v1/object/verification-docs/{file_path}',
            headers={**headers, 'Content-Type': content_type},
            data=b''  # Empty file to create placeholder
        )
        
        if response.status_code in [200, 201]:
            return jsonify({
                "file_path": file_path,
                "upload_url": f'{SUPABASE_URL}/storage/v1/object/verification-docs/{file_path}',
                "public_url": f'{SUPABASE_URL}/storage/v1/object/public/verification-docs/{file_path}'
            })
        else:
            return jsonify({"error": response.text}), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/verification/documents', methods=['POST'])
def create_verification_document():
    """
    Create verification document record after upload
    Expected input: { "owner_id": "...", "document_type": "trade_license", "file_url": "...", "file_name": "...", "pg_id": "..." }
    """
    try:
        data = request.json
        required = ['owner_id', 'document_type', 'file_url']
        
        if not all(k in data for k in required):
            return jsonify({"error": "Missing required fields"}), 400
        
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        response = requests.post(
            f'{SUPABASE_URL}/rest/v1/verification_documents',
            headers=headers,
            json=data
        )
        
        if response.status_code in [200, 201]:
            return jsonify(response.json()[0])
        else:
            return jsonify({"error": response.text}), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/verification/documents', methods=['GET'])
def get_verification_documents():
    """
    Get verification documents (filtered by owner_id or status)
    Query params: ?owner_id=...&status=pending
    """
    try:
        owner_id = request.args.get('owner_id')
        status = request.args.get('status')
        
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        }
        
        url = f'{SUPABASE_URL}/rest/v1/verification_documents?select=*,owner:profiles!owner_id(full_name)&order=created_at.desc'
        
        if owner_id:
            url += f'&owner_id=eq.{owner_id}'
        if status:
            url += f'&status=eq.{status}'
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": response.text}), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/verification/documents/<doc_id>/review', methods=['POST'])
def review_verification_document(doc_id):
    """
    Admin action: approve or reject verification document
    Expected input: { "admin_id": "...", "status": "approved|rejected", "review_notes": "..." }
    """
    try:
        data = request.json
        status = data.get('status')
        admin_id = data.get('admin_id')
        review_notes = data.get('review_notes', '')
        
        if not status or not admin_id or status not in ['approved', 'rejected']:
            return jsonify({"error": "Invalid status or missing admin_id"}), 400
        
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        # Get document to find owner
        doc_response = requests.get(
            f'{SUPABASE_URL}/rest/v1/verification_documents?id=eq.{doc_id}',
            headers=headers
        )
        
        if doc_response.status_code != 200 or not doc_response.json():
            return jsonify({"error": "Document not found"}), 404
        
        document = doc_response.json()[0]
        
        # Update document
        update_data = {
            'status': status,
            'reviewed_by': admin_id,
            'review_notes': review_notes,
            'reviewed_at': 'now()'
        }
        
        response = requests.patch(
            f'{SUPABASE_URL}/rest/v1/verification_documents?id=eq.{doc_id}',
            headers=headers,
            json=update_data
        )
        
        # If approved, update owner's is_verified status
        if status == 'approved':
            requests.patch(
                f'{SUPABASE_URL}/rest/v1/profiles?id=eq.{document["owner_id"]}',
                headers=headers,
                json={'is_verified': True}
            )
        
        # Send notification to owner
        notification_data = {
            'user_id': document['owner_id'],
            'type': f'verification_{status}',
            'title': f'Document {status.capitalize()}',
            'message': f'Your {document["document_type"]} has been {status}. {review_notes}',
            'payload': {'document_id': doc_id}
        }
        
        requests.post(
            f'{SUPABASE_URL}/rest/v1/notifications',
            headers=headers,
            json=notification_data
        )
        
        return jsonify({"success": True, "message": f"Document {status}"})
        
    except Exception as e:
        print(f"Error reviewing document: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ============================================
# ANALYTICS / METRICS ENDPOINTS
# ============================================

@app.route('/api/analytics/increment', methods=['POST'])
def increment_metric():
    """
    Increment a metric for a PG listing
    Expected input: { "pg_id": "...", "metric": "views|inquiries|saves|clicks" }
    """
    try:
        data = request.json
        pg_id = data.get('pg_id')
        metric = data.get('metric')
        
        if not pg_id or not metric:
            return jsonify({"error": "pg_id and metric required"}), 400
        
        if metric not in ['views', 'inquiries', 'saves', 'clicks']:
            return jsonify({"error": "Invalid metric type"}), 400
        
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
        }
        
        from datetime import datetime
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Try to get existing record for today
        get_response = requests.get(
            f'{SUPABASE_URL}/rest/v1/pg_metrics?pg_id=eq.{pg_id}&date=eq.{today}',
            headers=headers
        )
        
        if get_response.status_code == 200 and get_response.json():
            # Update existing record
            existing = get_response.json()[0]
            new_value = existing[metric] + 1
            
            requests.patch(
                f'{SUPABASE_URL}/rest/v1/pg_metrics?pg_id=eq.{pg_id}&date=eq.{today}',
                headers=headers,
                json={metric: new_value}
            )
        else:
            # Create new record
            requests.post(
                f'{SUPABASE_URL}/rest/v1/pg_metrics',
                headers={**headers, 'Prefer': 'resolution=merge-duplicates'},
                json={
                    'pg_id': pg_id,
                    'date': today,
                    metric: 1
                }
            )
        
        return jsonify({"success": True, "message": f"{metric} incremented"})
        
    except Exception as e:
        print(f"Error incrementing metric: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/analytics/dashboard', methods=['GET'])
def get_analytics_dashboard():
    """
    Get analytics dashboard data
    Query params: ?owner_id=...&days=30
    """
    try:
        owner_id = request.args.get('owner_id')
        days = int(request.args.get('days', 30))
        
        if not owner_id:
            return jsonify({"error": "owner_id required"}), 400
        
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
        
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
        }
        
        # Get owner's PG listings
        pgs_response = requests.get(
            f'{SUPABASE_URL}/rest/v1/pg_listings?owner_id=eq.{owner_id}&select=id,name',
            headers=headers
        )
        
        if pgs_response.status_code != 200:
            return jsonify({"error": "Failed to fetch listings"}), 500
        
        pgs = pgs_response.json()
        pg_ids = [pg['id'] for pg in pgs]
        
        if not pg_ids:
            return jsonify({
                "total_views": 0,
                "total_inquiries": 0,
                "total_saves": 0,
                "total_clicks": 0,
                "daily_metrics": [],
                "top_performing": []
            })
        
        # Get metrics for last N days
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        metrics_url = f'{SUPABASE_URL}/rest/v1/pg_metrics?pg_id=in.({",".join(pg_ids)})&date=gte.{start_date.strftime("%Y-%m-%d")}&order=date.desc'
        
        metrics_response = requests.get(metrics_url, headers=headers)
        
        if metrics_response.status_code != 200:
            return jsonify({"error": "Failed to fetch metrics"}), 500
        
        metrics = metrics_response.json()
        
        # Aggregate data
        total_views = sum(m['views'] for m in metrics)
        total_inquiries = sum(m['inquiries'] for m in metrics)
        total_saves = sum(m['saves'] for m in metrics)
        total_clicks = sum(m['clicks'] for m in metrics)
        
        # Group by date
        from collections import defaultdict
        daily_data = defaultdict(lambda: {'views': 0, 'inquiries': 0, 'saves': 0, 'clicks': 0})
        
        for m in metrics:
            date = m['date']
            daily_data[date]['views'] += m['views']
            daily_data[date]['inquiries'] += m['inquiries']
            daily_data[date]['saves'] += m['saves']
            daily_data[date]['clicks'] += m['clicks']
        
        daily_metrics = [
            {'date': date, **data}
            for date, data in sorted(daily_data.items())
        ]
        
        # Top performing PGs
        pg_performance = defaultdict(lambda: {'views': 0, 'inquiries': 0, 'saves': 0})
        
        for m in metrics:
            pg_performance[m['pg_id']]['views'] += m['views']
            pg_performance[m['pg_id']]['inquiries'] += m['inquiries']
            pg_performance[m['pg_id']]['saves'] += m['saves']
        
        # Find PG names
        pg_map = {pg['id']: pg['name'] for pg in pgs}
        
        top_performing = [
            {
                'pg_id': pg_id,
                'pg_name': pg_map.get(pg_id, 'Unknown'),
                **data
            }
            for pg_id, data in sorted(
                pg_performance.items(),
                key=lambda x: x[1]['views'],
                reverse=True
            )[:5]
        ]
        
        return jsonify({
            "total_views": total_views,
            "total_inquiries": total_inquiries,
            "total_saves": total_saves,
            "total_clicks": total_clicks,
            "daily_metrics": daily_metrics,
            "top_performing": top_performing
        })
        
    except Exception as e:
        print(f"Error fetching analytics: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("Starting SmartStay AI Backend...")
    print(f"AI provider configured: {ai.is_configured()} (provider={os.getenv('AI_PROVIDER', 'groq')})")
    if ai.is_configured():
        print("✅ AI provider initialized successfully")
    else:
        print("⚠️  Warning: AI provider not configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env")
    
    # Use debug mode only in development
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
