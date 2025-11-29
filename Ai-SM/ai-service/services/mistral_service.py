import os
import json
from mistralai import Mistral
from .base import AIService
from utils.file_processing import extract_text_from_pdf, encode_image

class MistralService(AIService):
    def __init__(self):
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("MISTRAL_API_KEY is not set")
        self.client = Mistral(api_key=api_key)
        self.text_model = "mistral-small-latest"
        self.vision_model = "pixtral-12b-2409"

    def analyze_personality(self, posts: list[str]) -> dict:
        all_posts = "\n".join(posts)
        prompt = f"""
You are an expert AI personality analyzer.

Analyze the following social media posts.
1. **Describe the user's personality**: Provide 3–5 short keywords in **THAI** (e.g., สร้างสรรค์, ทันสมัย, ชอบเข้าสังคม).
2. **Suggest exactly one theme name** suitable for their web design (e.g., "dark_minimalist", "playful_vibrant").
3. **Analyze each post individually**:
    - Determine the sentiment: "Positive", "Negative", or "Neutral".
    - Give a sentiment score (0-100).
    - Provide a very short summary of the content in **THAI** (max 10 words).
4. **Analyze Big 5 Personality Traits**:
    - Give a score (0-100) for each trait.
5. **Describe Work Style**:
    - Write a short paragraph (2-3 sentences) in **THAI** describing the user's working style based on the posts.

Posts:
{all_posts}

Respond ONLY with a single valid JSON object.
Use this exact structure:

{{
  "personality_traits": ["string (Thai)", "string (Thai)", "string (Thai)"],
  "suggested_theme": "string",
  "work_style": "string (Thai)",
  "big_five_scores": {{
    "Openness": number,
    "Conscientiousness": number,
    "Extraversion": number,
    "Agreeableness": number,
    "Neuroticism": number
  }},
  "analyzed_posts": [
    {{
      "content_snippet": "string (start of post)",
      "sentiment": "string (Positive/Negative/Neutral)",
      "sentiment_score": number (0-100),
      "summary": "string (Thai)"
    }}
  ]
}}
"""
        response = self.client.chat.complete(
            model=self.text_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        # Mistral response structure
        content = response.choices[0].message.content
        if isinstance(content, str):
             return json.loads(content)
        return content # Should be dict if parsed automatically, but usually string

    def chat(self, message: str) -> str:
        system_prompt = (
            "คุณคือ LivingProfile AI — "
            "ผู้ช่วยอัจฉริยะที่ช่วยผู้ใช้สร้างโปรไฟล์ส่วนตัว "
            "โดยเข้าใจบุคลิก นิสัย ความสนใจ และสไตล์ของพวกเขา "
            "พูดจาเป็นมิตร ฉลาด และอบอุ่น"
        )
        response = self.client.chat.complete(
            model=self.text_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message.content

    def parse_resume(self, file_path: str, file_type: str) -> dict:
        prompt_text = """
You are an expert Resume Parser with high proficiency in Thai language OCR.
Your task is to extract structured data from the provided resume image.

CRITICAL INSTRUCTIONS:
1. **Language**: The resume is likely in Thai. You must accurately read Thai characters.

2. **Name Extraction**: 
   - Look for keywords like: "ชื่อ", "ชื่อจริง", "ชื่อ-นามสกุล", "Name", "Full Name", "First Name".
   - The name is often at the very top, in a Large/Bold font.
   - Do NOT confuse labels with values. If you see "ชื่อจริง: ทาเคฮิโร่", the value is "ทาเคฮิโร่".
   - If the name is split (e.g., "First Name: ... Last Name: ..."), combine or split them correctly into the target fields.

3. **Date Conversion (IMPORTANT)**:
   - Thai resumes often use Buddhist Era (B.E.) years (e.g., 2540, 2566).
   - You MUST convert all B.E. years to Christian Era (C.E./A.D.) by subtracting 543.
   - Example: "2540" -> "1997", "2566" -> "2023".
   - Return ALL dates in `YYYY-MM-DD` format (C.E.).

4. **Address Extraction**: Look for "ที่อยู่", "Address", "Contact".
   - If the address is English placeholder text (e.g., "Anywhere St"), extract it as is.

5. **Labels vs Values**: Distinguish between the field label and the field value.
   - "โทร" or "Phone" is a label. The number following it is the value.

Target JSON Structure:
{
  "personal": {
    "firstNameTh": "string (Thai name if found)",
    "lastNameTh": "string (Thai surname if found)",
    "firstNameEn": "string (English name)",
    "lastNameEn": "string (English surname)",
    "title": "string (one of: mr, ms, mrs, dr or empty)",
    "gender": "string (one of: male, female, unspecified)",
    "birthDate": "string (YYYY-MM-DD, converted to C.E.)",
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
      "startDate": "string (YYYY-MM-DD, converted to C.E.)",
      "endDate": "string (YYYY-MM-DD, converted to C.E.)",
      "description": "string"
    }
  ],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "positionType": "string",
      "startDate": "string (YYYY-MM-DD, converted to C.E.)",
      "endDate": "string (YYYY-MM-DD, converted to C.E.)",
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
             raise ValueError("Unsupported file format for Mistral parsing")

        response = self.client.chat.complete(
            model=model_to_use,
            messages=messages,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if isinstance(content, str):
             return json.loads(content)
        return content

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
      "location_status": "string (Close | Far | Unknown)"
    }}
  ]
}}
"""
        response = self.client.chat.complete(
            model=self.text_model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        if isinstance(content, str):
             return json.loads(content)
        return content
