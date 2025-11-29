import os
import json
from openai import OpenAI
from .base import AIService
from utils.file_processing import extract_text_from_pdf, encode_image

class OpenAIService(AIService):
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not set")
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o"

    def analyze_personality(self, posts: list[str]) -> dict:
        all_posts = "\n".join(posts)
        prompt = f"""
You are an AI personality analyzer.

Analyze the following social media posts and describe the user's personality in 3–5 short keywords
that represent their style or vibe (e.g., creative, formal, minimalist, tech-savvy).
Then, suggest exactly one theme name suitable for their web design (e.g., "dark_minimalist", "playful_vibrant").

Posts:
{all_posts}

Respond ONLY with a single valid JSON object.
Use this exact structure:

{{
  "personality_tags": ["string", "string", "string"],
  "suggested_theme": "string"
}}
"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    def chat(self, message: str) -> str:
        system_prompt = (
            "คุณคือ LivingProfile AI — "
            "ผู้ช่วยอัจฉริยะที่ช่วยผู้ใช้สร้างโปรไฟล์ส่วนตัว "
            "โดยเข้าใจบุคลิก นิสัย ความสนใจ และสไตล์ของพวกเขา "
            "พูดจาเป็นมิตร ฉลาด และอบอุ่น"
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message.content

    def parse_resume(self, file_path: str, file_type: str) -> dict:
        # file_type might be passed as extension or mime type. 
        # We can deduce from file_path extension if needed.
        
        prompt_text = """
You are a professional resume parser. Extract information from the uploaded resume file into a JSON object.
Translate extracted data to Thai where appropriate for specific fields (like provinces, military status).
If a field is not found, use null or an empty string.

Target JSON Structure:
{
  "personal": {
    "firstNameTh": "string (Thai name if found)",
    "lastNameTh": "string (Thai surname if found)",
    "firstNameEn": "string (English name)",
    "lastNameEn": "string (English surname)",
    "title": "string (one of: mr, ms, mrs, dr or empty)",
    "gender": "string (one of: male, female, unspecified)",
    "birthDate": "string (YYYY-MM-DD)",
    "nationality": "string",
    "religion": "string",
    "phone": "string (numeric only, 10 digits)",
    "email": "string",
    "lineId": "string",
    "militaryStatus": "string (one of: exempted, completed, pending or empty)",
    "address": {
      "province": "string (Thai province name)",
      "district": "string (Thai district/amphoe)",
      "subdistrict": "string (Thai subdistrict/tambon)",
      "postalCode": "string"
    }
  },
  "education": [
    {
      "school": "string",
      "degree": "string",
      "major": "string",
      "startDate": "string (YYYY-MM-DD)",
      "endDate": "string (YYYY-MM-DD)",
      "description": "string"
    }
  ],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "positionType": "string",
      "startDate": "string (YYYY-MM-DD)",
      "endDate": "string (YYYY-MM-DD)",
      "description": "string"
    }
  ],
  "skills": ["string", "string"]
}

Rules:
1. Try to split Full Name into First and Last Name.
2. For dates, if only year is found, use YYYY-01-01.
3. Detect Province/District/Subdistrict carefully from address.
4. Return ONLY valid JSON.
"""

        messages = [{"role": "system", "content": prompt_text}]
        
        if file_path.lower().endswith('.pdf'):
            text_content = extract_text_from_pdf(file_path)
            messages.append({"role": "user", "content": f"Resume Content:\n{text_content}"})
        elif file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            base64_image = encode_image(file_path)
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this resume image."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            })
        else:
            # Fallback or error
            raise ValueError("Unsupported file format for OpenAI parsing")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)

    def match_jobs(self, user_data: dict, job_posts: list[dict]) -> dict:
        prompt = f"""
You are an expert AI Recruiter and Job Matcher.

User Profile:
{json.dumps(user_data, ensure_ascii=False, indent=2)}

Available Job Posts:
{json.dumps(job_posts, ensure_ascii=False, indent=2)}

Task:
1. Analyze the User Profile against each Job Post. Focus heavily on **Skills** and **Experience** vs Job Requirements.
2. **Strict Scoring**:
   - Give high scores (>80) ONLY if the user has most required skills AND relevant experience.
   - Give medium scores (50-79) for partial skill matches or transferable experience.
   - Give low scores (<50) for poor matches.
3. **Filter**: EXCLUDE any job with a match_score less than 50. Do not return them in the "matches" list.
4. Evaluate Location Proximity:
   - Determine if "Close" (same city/province), "Far", or "Unknown".
5. Rank the remaining jobs from best match to worst match.
6. Return the result in strict JSON format.
7. LANGUAGE: Provide 'reason', 'location_note', and 'overall_analysis' in natural Thai.
8. **Speed Optimization**: Keep 'reason' very short and concise (max 1 sentence).

Output Structure:
{{
  "matches": [
    {{
      "job_id": "string (from input)",
      "match_score": number (50-100),
      "reason": "string (concise 1 sentence explanation)",
      "location_status": "string (Close | Far | Unknown)",
      "location_note": "string"
    }}
  ],
  "overall_analysis": "string (brief summary)"
}}
"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
