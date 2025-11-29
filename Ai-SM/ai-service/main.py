import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pydantic import BaseModel
from services import GeminiService, OpenAIService, GroqService, MistralService

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Configuration
DEFAULT_AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower()

# Service Cache
services_cache = {}

def get_service(provider_name=None):
    """
    Retrieve an AI service instance. 
    If provider_name is None, uses DEFAULT_AI_PROVIDER.
    Lazily initializes the service if not already in cache.
    """
    provider_name = (provider_name or DEFAULT_AI_PROVIDER).lower()
    
    if provider_name in services_cache:
        return services_cache[provider_name]

    print(f"Initializing AI Service: {provider_name}")
    if provider_name == "gemini":
        service = GeminiService()
    elif provider_name == "openai":
        service = OpenAIService()
    elif provider_name == "groq":
        service = GroqService()
    elif provider_name == "mistral":
        service = MistralService()
    else:
        raise ValueError(f"Unsupported AI_PROVIDER: {provider_name}")
        
    services_cache[provider_name] = service
    return service

# Initialize default service on startup to ensure at least one works
try:
    get_service() 
    print(f"Initialized Default AI Service: {DEFAULT_AI_PROVIDER}")
except Exception as e:
    print(f"Error initializing default AI Service: {e}")

class AIAnalysisRequest(BaseModel):
    user_id: str
    posts: list[str]

@app.route("/analyze-personality", methods=["POST"])
def analyze_personality_endpoint():
    try:
        target_provider = request.args.get("provider")
        ai_service = get_service(target_provider)
        request_data = AIAnalysisRequest(**request.get_json())
        result = ai_service.analyze_personality(request_data.posts)
        return jsonify(result)
    except Exception as e:
        print(f"Error in analyze-personality: {e}")
        return jsonify({"error": "Failed to process AI request", "details": str(e)}), 500

@app.route("/chat", methods=["POST"])
def chat_endpoint():
    try:
        target_provider = request.args.get("provider")
        ai_service = get_service(target_provider)
        data = request.get_json()
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "Missing 'message' field"}), 400

        reply = ai_service.chat(user_message)
        return jsonify({"reply": reply})

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": "Failed to process chat", "details": str(e)}), 500

@app.route("/parse-resume", methods=["POST"])
def parse_resume_endpoint():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    temp_path = None
    try:
        target_provider = request.args.get("provider")
        ai_service = get_service(target_provider)
        
        # Create a temporary file to store the uploaded content
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        print(f"Processing resume: {file.filename} at {temp_path}")

        result = ai_service.parse_resume(temp_path, suffix)
        
        return jsonify(result)

    except Exception as e:
        print(f"Resume parsing error: {e}")
        return jsonify({"error": "Failed to parse resume", "details": str(e)}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

@app.route("/match-jobs", methods=["POST"])
def match_jobs_endpoint():
    """
    Endpoint for matching user profile with job posts.
    Allows specifying 'provider' in query params, defaults to 'gemini' for this specific task
    as requested by user, or falls back to DEFAULT_AI_PROVIDER if logic changes.
    """
    # User specifically asked for Gemini for matching.
    # We can default to 'gemini' here explicitly, or use the system default.
    # Given the request "run one py file but use multiple AI services... I might want to separate this model",
    # let's default this endpoint to 'gemini' unless specified otherwise.
    target_provider = request.args.get("provider", "gemini")
    
    try:
        ai_service = get_service(target_provider)
        data = request.get_json()
        
        user_profile = data.get("user_profile")
        job_posts = data.get("job_posts")
        
        if not user_profile:
             return jsonify({"error": "Missing 'user_profile'"}), 400
        if not job_posts:
             return jsonify({"error": "Missing 'job_posts'"}), 400
             
        result = ai_service.match_jobs(user_profile, job_posts)
        return jsonify(result)
        
    except Exception as e:
        print(f"Job matching error: {e}")
        return jsonify({"error": "Failed to match jobs", "details": str(e)}), 500

@app.route("/ai-score", methods=["POST"])
def ai_score_endpoint():
    """
    Endpoint for calculating AI Score.
    Defaults to 'groq' as requested by user.
    """
    target_provider = request.args.get("provider", "groq")
    
    try:
        ai_service = get_service(target_provider)
        
        # Check if the service supports calculate_ai_score
        if not hasattr(ai_service, 'calculate_ai_score'):
             return jsonify({"error": f"Provider '{target_provider}' does not support AI Score calculation"}), 400

        user_data = request.get_json()
        if not user_data:
             return jsonify({"error": "Missing user data"}), 400
             
        result = ai_service.calculate_ai_score(user_data)
        return jsonify(result)
        
    except Exception as e:
        print(f"AI Score calculation error: {e}")
        return jsonify({"error": "Failed to calculate AI Score", "details": str(e)}), 500

@app.route("/translate", methods=["POST"])
def translate_endpoint():
    """
    Endpoint for translating text.
    Supports n8n webhook via N8N_TRANSLATE_WEBHOOK env var.
    Defaults to 'groq' internal service if webhook is not set.
    """
    target_provider = request.args.get("provider", "groq")
    
    try:
        data = request.get_json()
        text = data.get("text")
        target_language = data.get("target_language", "en")
        
        if not text:
             return jsonify({"error": "Missing 'text'"}), 400

        # 1. Check for n8n Webhook
        n8n_webhook_url = os.getenv("N8N_TRANSLATE_WEBHOOK")
        if n8n_webhook_url:
            print(f"Forwarding translation request to n8n: {n8n_webhook_url}")
            try:
                # Forward request to n8n
                import requests
                response = requests.post(
                    n8n_webhook_url, 
                    json={"text": text, "target_language": target_language},
                    timeout=10 # Set a timeout
                )
                response.raise_for_status()
                return jsonify(response.json())
            except Exception as e:
                print(f"n8n Webhook failed: {e}. Falling back to internal service.")
                # Fallback to internal service below
        
        # 2. Internal Service Fallback
        ai_service = get_service(target_provider)
        
        # Check if the service supports translate_text
        if not hasattr(ai_service, 'translate_text'):
             return jsonify({"error": f"Provider '{target_provider}' does not support translation"}), 400
             
        result = ai_service.translate_text(text, target_language)
        return jsonify(result)
        
    except Exception as e:
        print(f"Translation error: {e}")
        return jsonify({"error": "Failed to translate text", "details": str(e)}), 500

if __name__ == "__main__":
    print("Starting AI Service with Flask... (Reloaded for Mistral Update)")
    port = int(os.getenv("PORT", 8001))
    app.run(host="0.0.0.0", port=port, debug=True)
