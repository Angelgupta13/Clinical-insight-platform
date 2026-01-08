import os
import re
import google.generativeai as genai
from .data_processor import get_all_studies_summary, find_study_folders, get_study_summary

# Configure Gemini if available
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

def query_gemini(context: str, user_query: str):
    """Call Gemini Pro to generate a response based on data context."""
    if not GEMINI_KEY:
        return None
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"""You are a Clinical Trial Insight Agent. 
        Analyze the following study data summary and answer the user's question.
        Be professional, concise, and highlight risks.

        DATA CONTEXT:
        {context}

        USER QUESTION:
        {user_query}
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return None

def process_query(query: str):
    """
    Hybrid Agent:
    1. Tries to match specific high-value intents (Risk analysis, Metrics).
    2. If no direct match AND API key exists, asks GenAI.
    3. Fallback to heuristic responses.
    """
    query = query.lower()
    
    # 1. Intent: High Risk / Missing Pages Analysis
    if "risk" in query or "missing pages" in query or "anomalies" in query:
        summaries = get_all_studies_summary()
        # Sort by risk score
        sorted_studies = sorted(summaries, key=lambda x: x['risk']['score'], reverse=True)
        top = sorted_studies[0]
        
        # Prepare context for GenAI or Template
        context = f"Top Risk Study: {top['study_id']}. Risk Score: {top['risk']['score']}. Missing Pages: {top['metrics']['missing_pages']}. SAEs: {top['metrics']['sae_issues']}."
        
        # Try GenAI first for a rich explanation
        gen_response = query_gemini(context, query)
        if gen_response:
            return gen_response
            
        # Fallback Template
        return f"""**Analysis Complete.**
        
Detected **{top['study_id']}** as the Critical Risk Study.
- 🔴 Risk Score: {top['risk']['score']} (Critical)
- 📄 Missing Pages: {top['metrics']['missing_pages']}
- 🧪 Lab Issues: {top['metrics']['lab_issues']}
- 🏥 SAEs: {top['metrics']['sae_issues']}

**Recommended Action:**
1. Generate Quality Alert for Site Monitor.
2. Schedule immediate specific data review for Lab Data.
"""

    # 2. Intent: Specific Study Details
    if "study" in query:
        # Extract study ID (simple heuristic)
        match = re.search(r"study\s*(\d+)", query, re.IGNORECASE)
        if match:
            num = match.group(1)
            studies = find_study_folders()
            target = next((s for s in studies if f"Study {num}_" in s or f"Study {num} " in s), None)
            if target:
                summary = get_study_summary(target)
                
                context = f"Study: {target}. Risk Level: {summary['risk']['level']}. Metrics: {summary['metrics']}."
                gen_response = query_gemini(context, query)
                if gen_response:
                    return gen_response

                return f"""**{target} Analysis**
- **Risk Level**: {summary['risk']['level']} (Score: {summary['risk']['score']})
- **Data Gaps**: {summary['metrics']['missing_pages']} pages
- **Operational**: {summary['metrics']['overdue_visits']} overdue visits
- **Safety**: {summary['metrics']['sae_issues']} SAE issues

> Suggestion: {"Review Visit Compliance" if summary['metrics']['overdue_visits'] > 10 else "Monitor Safety Signals"}
"""
    
    # 3. General Conversation
    return "I am connected to the Clinical Data Lake. I can analyze risks, find outliers in missing pages, or detail specific study performance. Try asking 'Which study is at highest risk?'"
