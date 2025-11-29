import os
import json
import re
import google.generativeai as genai
from .base import AIService

class GeminiService(AIService):
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash") # User requested 2.5 pro, though 1.5 is current standard, assuming user has access or meant 1.5. Sticking to user's existing code if possible, but existing code said "gemini-2.5-pro" in my read? Wait, let me check the file read again.
        # Re-checking file content from Step 5:
        # Line 28: model = genai.GenerativeModel("gemini-2.5-pro")
        # Okay, the user's existing code uses "gemini-2.5-pro". I will use that.

    def analyze_personality(self, posts: list[str]) -> dict:
        all_posts = "\n".join(posts)
        prompt = f"""
You are an AI personality analyzer.

Analyze the following social media posts.
1. Describe the user's personality in 3–5 short keywords (e.g., creative, formal, minimalist, tech-savvy).
2. Suggest exactly one theme name suitable for their web design (e.g., "dark_minimalist", "playful_vibrant").
3. **Analyze each post individually**:
    - Determine the sentiment: "Positive", "Negative", or "Neutral".
    - Give a sentiment score (0-100), where 0 is very negative, 50 is neutral, and 100 is very positive.
    - Provide a very short summary of the content (max 10 words).
4. **Analyze Big 5 Personality Traits**:
    - Give a score (0-100) for each trait: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism.
5. **Describe Work Style**:
    - Write a short paragraph (2-3 sentences) describing the user's working style based on the posts.

Posts:
{all_posts}

Respond ONLY with a single valid JSON object — no extra text, no explanation, no markdown code block.
Use this exact structure:

{{
  "personality_traits": ["string", "string", "string"],
  "suggested_theme": "string",
  "work_style": "string",
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
      "summary": "string"
    }}
  ]
}}
"""
        response = self.model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
        )

        clean_text = response.text.strip()
        print(f"DEBUG: Raw Gemini Response: {clean_text}") # Debug log

        if not clean_text.startswith("{"):
            match = re.search(r"\{.*\}", clean_text, re.DOTALL)
            clean_text = match.group(0) if match else clean_text

        data = json.loads(clean_text)
        print(f"DEBUG: Parsed JSON: {data.keys()}") # Debug log
        return data

    def chat(self, message: str) -> str:
        system_prompt = (
            "คุณคือ LivingProfile AI — "
            "ผู้ช่วยอัจฉริยะที่ช่วยผู้ใช้สร้างโปรไฟล์ส่วนตัว "
            "โดยเข้าใจบุคลิก นิสัย ความสนใจ และสไตล์ของพวกเขา "
            "พูดจาเป็นมิตร ฉลาด และอบอุ่น\n\n"
            "ตอนนี้ผู้ใช้กำลังคุยกับคุณ:\n"
        )
        full_prompt = system_prompt + message
        response = self.model.generate_content(full_prompt)
        return response.text.strip()

    def parse_resume(self, file_path: str, file_type: str) -> dict:
        # file_path is the path to the temp file
        print(f"Processing resume: {file_path}")
        
        uploaded_file = genai.upload_file(file_path)
        print(f"File uploaded to Gemini: {uploaded_file.name}")

        prompt = """
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
        response = self.model.generate_content(
            [prompt, uploaded_file],
            generation_config={"response_mime_type": "application/json"}
        )

        clean_text = response.text.strip()
        if clean_text.startswith("```"):
            clean_text = re.sub(r"^```json\s*", "", clean_text)
            clean_text = re.sub(r"\s*```$", "", clean_text)
        
        clean_text = clean_text.strip()
        
        # Cleanup handled by caller (temp file) but we might want to delete from Gemini
        # genai.delete_file(uploaded_file.name) # Optional, good practice but skipping to match existing flow exactly or improving? 
        # Existing code commented it out. I'll leave it out for now.

        return json.loads(clean_text)

    def match_jobs(self, user_data: dict, job_posts: list[dict]) -> dict:
        prompt = f"""
You are an expert AI Recruiter and Job Matcher.

User Profile:
{json.dumps(user_data, ensure_ascii=False, indent=2)}

Available Job Posts:
{json.dumps(job_posts, ensure_ascii=False, indent=2)}

Task:
1. Analyze the User Profile against each Job Post. Focus heavily on **Skills** and **Experience** vs Job Requirements.
2. **Realistic Scoring Logic**:
   - **Fuzzy Matching**: You MUST handle variations in spelling and spacing (e.g., "Call Center" == "callcenter" == "CallCenter", "React.js" == "React"). Treat them as **EXACT MATCHES**.
   - **Excellent Match (85-100)**: User has BOTH the required skills (tags match) AND relevant experience.
   - **Good Match (70-84)**: User has relevant experience but misses some skills, OR has strong skills but experience is in a slightly different field.
   - **Potential Match (50-69)**: User has the **MATCHING SKILL** (fuzzy matched) but **NO EXPERIENCE** in that role. (This allows them to see the job but with a lower score).
   - **Weak/No Match (<50)**: No relevant skills or experience.

3. **Filter**: EXCLUDE any job with a match_score less than 50.

4. **Detailed Reasoning (Thai)**:
   - The 'reason' MUST explain the score.
   - If score is high: "Matched due to direct experience in [Role] and skills in [Skill]."
   - If score is medium (Skill match only): "Matched because you have the [Skill] skill, but the score is lower due to lack of direct experience."
   - **Be specific** about which skills or experience triggered the match.

5. Evaluate Location Proximity:
   - Determine if "Close" (same city/province), "Far", or "Unknown".

6. Return the result in strict JSON format.

Output Structure:
{{
  "matches": [
    {{
      "job_id": "string (from input)",
      "match_score": number (50-100),
      "reason": "string (Thai explanation, specific and detailed)",
      "location_status": "string (Close | Far | Unknown)",
      "location_note": "string (Thai note)"
    }}
  ],
  "overall_analysis": "string (Thai summary)"
}}
"""
        response = self.model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        clean_text = response.text.strip()
        # Handle potential markdown code blocks if API doesn't strip them
        if clean_text.startswith("```"):
            clean_text = re.sub(r"^```json\s*", "", clean_text)
            clean_text = re.sub(r"\s*```$", "", clean_text)
        
        return json.loads(clean_text)

    def calculate_ai_score(self, user_data: dict) -> dict:
        # Available positions from industry-data.ts
        available_positions = [
            "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
            "Mobile App Developer", "DevOps Engineer", "Data Scientist", "Data Analyst",
            "UX/UI Designer", "Product Manager", "QA Engineer", "Cybersecurity Specialist",
            "Digital Marketing Specialist", "Social Media Manager", "Content Creator",
            "SEO Specialist", "Marketing Manager", "Graphic Designer", "Sales Representative",
            "Business Development Manager", "Account Manager", "Financial Analyst", "Accountant",
            "HR Manager", "Recruiter", "Mechanical Engineer", "Electrical Engineer",
            "Civil Engineer", "Project Manager", "Administrative Assistant", "Customer Service",
            "Teacher", "Researcher", "Lawyer", "Nurse", "Pharmacist"
        ]
        
        # Skills database by position/industry for recommendations
        position_skills_map = {
            "Software Engineer": ["Python", "Java", "Git", "Problem Solving", "System Design", "Algorithms"],
            "Frontend Developer": ["JavaScript", "React", "TypeScript", "HTML/CSS", "Tailwind CSS", "Next.js", "Vue.js", "Responsive Design"],
            "Backend Developer": ["Node.js", "Python", "Java", "SQL", "REST API", "Docker", "PostgreSQL", "MongoDB"],
            "Full Stack Developer": ["JavaScript", "React", "Node.js", "SQL", "Git", "Docker", "TypeScript", "API Design"],
            "Mobile App Developer": ["React Native", "Flutter", "Swift", "Kotlin", "Mobile UI/UX", "Firebase"],
            "DevOps Engineer": ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux", "Terraform", "Jenkins", "Monitoring"],
            "Data Scientist": ["Python", "Machine Learning", "SQL", "Statistics", "TensorFlow", "Data Visualization", "R"],
            "Data Analyst": ["SQL", "Excel", "Python", "Data Visualization", "Power BI", "Tableau", "Statistics"],
            "UX/UI Designer": ["Figma", "Adobe XD", "User Research", "Prototyping", "Design Systems", "Wireframing"],
            "Product Manager": ["Agile/Scrum", "Product Strategy", "User Research", "Data Analysis", "Roadmapping", "Stakeholder Management"],
            "QA Engineer": ["Test Automation", "Selenium", "Manual Testing", "API Testing", "Bug Tracking", "Jest", "Cypress"],
            "Digital Marketing Specialist": ["SEO", "Google Ads", "Social Media Marketing", "Analytics", "Content Strategy", "Email Marketing"],
            "Marketing Manager": ["Marketing Strategy", "Brand Management", "Digital Marketing", "Analytics", "Team Leadership", "Budget Management"],
            "Graphic Designer": ["Adobe Photoshop", "Adobe Illustrator", "Figma", "Typography", "Brand Identity", "Print Design"],
            "Sales Representative": ["Negotiation", "CRM", "Communication", "Presentation", "Customer Relations", "Sales Strategy"],
            "Business Development Manager": ["Business Strategy", "Negotiation", "Market Analysis", "Networking", "Partnership Management"],
            "Financial Analyst": ["Financial Modeling", "Excel", "Data Analysis", "Accounting", "Forecasting", "SAP"],
            "Accountant": ["Accounting Standards", "Excel", "Tax Knowledge", "Financial Reporting", "SAP", "QuickBooks"],
            "HR Manager": ["Recruitment", "Employee Relations", "HR Policies", "Performance Management", "Labor Law", "HRIS"],
            "Project Manager": ["Project Planning", "Agile/Scrum", "Risk Management", "Stakeholder Management", "MS Project", "Communication"]
        }
        
        # Extract user's current skills and job preference
        user_skills = user_data.get("skills", []) or []
        job_preference = user_data.get("jobPreference", {}) or {}
        preferred_position = job_preference.get("position", "")
        preferred_industry = job_preference.get("industry", "")
        
        prompt = f"""
You are an expert Career Coach and HR Specialist in Thailand.
Analyze the following User Profile and provide a comprehensive career assessment.

User Profile:
{json.dumps(user_data, ensure_ascii=False, indent=2)}

User's Current Skills:
{json.dumps(user_skills, ensure_ascii=False)}

User's Job Preference:
- Position: {preferred_position}
- Industry: {preferred_industry}

Available Career Positions:
{json.dumps(available_positions, ensure_ascii=False)}

Skills Database by Position:
{json.dumps(position_skills_map, ensure_ascii=False, indent=2)}

Task:
1. **Score Calculation** (0-100):
   - Calculate the overall professional score based on profile completeness and quality.
   - Also calculate individual scores for:
     - education_score (0-100): Based on education level, institution reputation, relevance
     - experience_score (0-100): Based on years, positions held, descriptions quality
     - skill_score (0-100): Based on user's actual skills vs required skills for their preferred position

2. **Best Matching Position**:
   - Analyze the user's education, experience, skills, and stated job preference
   - Recommend the BEST matching position from the available positions list
   - This should be realistic based on their actual qualifications

3. **Skills Recommendation**:
   - recommended_skills: List 5-7 skills the user SHOULD learn based on their preferred position AND industry
     - Use the Skills Database to recommend relevant skills for their target position
     - Focus on skills that are ESSENTIAL for success in that position/industry
     - Do NOT include skills the user already has (check their skills array)

4. **Analysis** (in Thai):
   - Write a detailed analysis explaining:
     - Why the recommended position suits them
     - What strengths they have for this role (mention their actual skills)
     - What skills they are missing and should develop
     - Specific actions they should take to increase their chances
   - Be honest and constructive, not just encouraging
   - Reference their actual education, experience, and skills data

5. **Level Assessment**:
   - Beginner (0-40): New to workforce or career changers
   - Intermediate (41-70): Some relevant experience
   - Professional (71-90): Strong qualifications
   - Expert (91-100): Exceptional profile

Output JSON Structure:
{{
  "score": number (0-100),
  "education_score": number (0-100),
  "experience_score": number (0-100),
  "skill_score": number (0-100),
  "level": "string (Beginner | Intermediate | Professional | Expert)",
  "recommended_position": "string (from available positions list)",
  "analysis": "string (detailed Thai analysis, 4-6 sentences)",
  "recommended_skills": ["string", "string", ...] (5-7 skills user should learn for their position/industry)
}}

CRITICAL RULES:
- Use ONLY Thai for the analysis field
- Be specific about their actual data (school names, companies, positions, skills)
- recommended_skills should be skills they should learn (NOT already in their skills array)
- recommended_skills MUST be relevant to their preferred position AND industry
- If user selected an industry, recommend skills specific to that industry
- If data is missing, mention it in the analysis
- recommended_position must be from the available positions list
- Scores must be realistic and justified
"""
        response = self.model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.0
            }
        )

        clean_text = response.text.strip()
        if clean_text.startswith("```"):
            clean_text = re.sub(r"^```json\s*", "", clean_text)
            clean_text = re.sub(r"\s*```$", "", clean_text)
        
        return json.loads(clean_text)
