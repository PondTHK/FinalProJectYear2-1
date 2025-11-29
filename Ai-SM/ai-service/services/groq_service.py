import os
import json
from groq import Groq
from .base import AIService
from utils.file_processing import extract_text_from_pdf, encode_image

class GroqService(AIService):
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set")
        self.client = Groq(api_key=api_key)
        self.text_model = "llama-3.3-70b-versatile"
        self.vision_model = "llama-3.2-90b-vision-preview"

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
            model=self.text_model,
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
            model=self.text_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message.content

    def parse_resume(self, file_path: str, file_type: str) -> dict:
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
        model_to_use = self.text_model

        if file_path.lower().endswith('.pdf'):
            text_content = extract_text_from_pdf(file_path)
            messages.append({"role": "user", "content": f"Resume Content:\n{text_content}"})
        elif file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            model_to_use = self.vision_model
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
             raise ValueError("Unsupported file format for Groq parsing")

        response = self.client.chat.completions.create(
            model=model_to_use,
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
            model=self.text_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    def calculate_ai_score(self, user_data: dict) -> dict:
        prompt = f"""
You are an expert Career Coach and HR Specialist.
Analyze the following User Profile and calculate a "Professional Score" (0-100).

User Profile:
{json.dumps(user_data, ensure_ascii=False, indent=2)}

Task:
1. **Score Calculation** (0-100):
   - **CRITICAL**: You must be consistent. If the profile is the same, the score MUST be the same.
   - **Base Score**: Start with 0.
   - **+20 points**: If Profile Picture is present (check 'profile_image_url').
   - **+20 points**: If Contact Info is complete (Email, Phone, Address).
   - **+20 points**: If at least 1 Work Experience is listed with description.
   - **+20 points**: If at least 1 Education is listed.
   - **+10 points**: If at least 3 Skills are listed.
   - **+10 points**: Quality check (descriptions are detailed, data is consistent).
   - **Deduct points**: If fields are "null", "empty", or "unknown".
   
2. **Level Assessment**:
   - 0-40: Beginner
   - 41-70: Intermediate
   - 71-90: Professional
   - 91-100: Expert

3. **Analysis**:
   - Write a brief, encouraging analysis of the profile (in Thai).

4. **Suggestions for Improvement** ("Next Step"):
   - Provide 3-5 concrete, actionable suggestions to increase the score.
   - For each suggestion, explain *how* to do it and *why* it helps.
   - Estimate the potential score increase for each action based on the missing points above.
   - **CRITICAL**: Be specific. Don't just say "Add skills". Say "Add 2-3 more technical skills related to [Industry] to reach 80%".

Output JSON Structure:
{{
  "score": number (0-100),
  "level": "string (Beginner | Intermediate | Professional | Expert)",
  "analysis": "string (Thai)",
  "suggestions": [
    {{
      "action": "string (Thai, e.g., 'เพิ่มทักษะเฉพาะทาง')",
      "reason": "string (Thai, e.g., 'เพื่อให้ตรงกับตำแหน่งงานที่คุณสนใจมากขึ้น')",
      "how_to": "string (Thai, e.g., 'ระบุโปรแกรมหรือเครื่องมือที่คุณใช้คล่อง')",
      "expected_score_increase": "string (e.g., '+5-10 คะแนน')"
    }}
  ]
}}
"""
        response = self.client.chat.completions.create(
            model=self.text_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.0  # Set to 0 for deterministic results
        )
        return json.loads(response.choices[0].message.content)

    def translate_text(self, text: str, target_language: str = "en") -> dict:
        prompt = f"""
Translate the following text to {target_language}.
Maintain the professional tone and formatting.
Return ONLY the translated text as a JSON object with a 'translated_text' key.

Text to translate:
{text}

Output JSON Structure:
{{
  "translated_text": "string"
}}
"""
        response = self.client.chat.completions.create(
            model=self.text_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
