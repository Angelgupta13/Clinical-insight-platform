"""
AI Agent for Clinical Insight Platform.
Provides natural language query processing with Gemini integration.
Production-ready with comprehensive intent recognition and fallback responses.
"""
import os
import re
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import data processor functions
from data_processor import (
    get_all_studies_summary, 
    find_study_folders, 
    get_study_summary,
    get_portfolio_summary,
    get_study_detail
)

# Configure Gemini if available
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
genai = None

if GEMINI_KEY:
    try:
        import google.generativeai as genai_module
        genai_module.configure(api_key=GEMINI_KEY)
        genai = genai_module
        logger.info("Gemini AI configured successfully")
    except ImportError:
        logger.warning("google-generativeai not installed, using heuristic responses only")
    except Exception as e:
        logger.error(f"Error configuring Gemini: {e}")


class QueryIntent(str, Enum):
    """Recognized query intents."""
    RISK_ANALYSIS = "risk_analysis"
    STUDY_DETAIL = "study_detail"
    SITE_QUERY = "site_query"
    PATIENT_QUERY = "patient_query"
    DQI_QUERY = "dqi_query"
    RECOMMENDATION = "recommendation"
    COMPARISON = "comparison"
    SUMMARY = "summary"
    REGIONAL = "regional"
    GENERAL = "general"


@dataclass
class ParsedQuery:
    """Structured representation of a parsed query."""
    intent: QueryIntent
    study_id: Optional[str] = None
    site_id: Optional[str] = None
    region: Optional[str] = None
    metric: Optional[str] = None
    raw_query: str = ""


def detect_intent(query: str) -> ParsedQuery:
    """
    Detect the intent of a natural language query.
    
    Returns a ParsedQuery with detected intent and extracted entities.
    """
    query_lower = query.lower()
    parsed = ParsedQuery(intent=QueryIntent.GENERAL, raw_query=query)
    
    # Risk-related queries
    risk_keywords = ["risk", "critical", "high risk", "dangerous", "alert", "problem", "issue"]
    if any(kw in query_lower for kw in risk_keywords):
        parsed.intent = QueryIntent.RISK_ANALYSIS
    
    # DQI queries
    dqi_keywords = ["dqi", "quality index", "data quality", "quality score", "clean"]
    if any(kw in query_lower for kw in dqi_keywords):
        parsed.intent = QueryIntent.DQI_QUERY
    
    # Site queries
    site_keywords = ["site", "center", "location", "facility"]
    if any(kw in query_lower for kw in site_keywords):
        parsed.intent = QueryIntent.SITE_QUERY
    
    # Patient queries
    patient_keywords = ["patient", "subject", "participant", "enrollment"]
    if any(kw in query_lower for kw in patient_keywords):
        parsed.intent = QueryIntent.PATIENT_QUERY
    
    # Recommendation queries
    rec_keywords = ["recommend", "suggest", "advise", "should", "action", "what to do"]
    if any(kw in query_lower for kw in rec_keywords):
        parsed.intent = QueryIntent.RECOMMENDATION
    
    # Summary queries
    summary_keywords = ["summary", "overview", "report", "status", "dashboard"]
    if any(kw in query_lower for kw in summary_keywords):
        parsed.intent = QueryIntent.SUMMARY
    
    # Regional queries
    regions = ["asia", "europe", "america", "africa", "pacific", "latam", "emea", "apac"]
    for region in regions:
        if region in query_lower:
            parsed.intent = QueryIntent.REGIONAL
            parsed.region = region
            break
    
    # Comparison queries
    comparison_keywords = ["compare", "versus", "vs", "difference", "between"]
    if any(kw in query_lower for kw in comparison_keywords):
        parsed.intent = QueryIntent.COMPARISON
    
    # Extract study ID
    study_match = re.search(r"study\s*(\d+)", query_lower, re.IGNORECASE)
    if study_match:
        parsed.study_id = study_match.group(1)
        if parsed.intent == QueryIntent.GENERAL:
            parsed.intent = QueryIntent.STUDY_DETAIL
    
    # Extract site ID
    site_match = re.search(r"site\s*(\d+)", query_lower, re.IGNORECASE)
    if site_match:
        parsed.site_id = site_match.group(1)
    
    return parsed


def find_study_by_number(study_num: str) -> Optional[str]:
    """Find a study folder by its number."""
    studies = find_study_folders()
    for study in studies:
        if f"Study {study_num}_" in study or f"Study {study_num} " in study or f"STUDY {study_num}_" in study:
            return study
    return None


def query_gemini(context: str, user_query: str) -> Optional[str]:
    """
    Call Gemini Pro to generate a response based on data context.
    
    Returns AI-generated response or None if unavailable.
    """
    if not genai:
        return None
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"""You are an expert Clinical Trial Data Analyst AI Agent. 
Analyze the following clinical study data and provide actionable insights.
Be professional, concise, and focus on:
1. Key findings and risks
2. Specific recommendations
3. Priority actions

Use markdown formatting for clarity.

DATA CONTEXT:
{context}

USER QUESTION:
{user_query}

Provide a helpful, data-driven response:"""
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return None


def format_risk_response(studies: List[Dict]) -> str:
    """Format a response about study risks."""
    sorted_studies = sorted(studies, key=lambda x: x.get('risk', {}).get('raw_score', 0), reverse=True)
    
    if not sorted_studies:
        return "No studies found in the database."
    
    top = sorted_studies[0]
    risk_level = top.get('risk', {}).get('level', 'Unknown')
    risk_score = top.get('risk', {}).get('raw_score', 0)
    
    response = f"""## 🔴 Risk Analysis Complete

**Highest Risk Study: {top.get('study_name', top.get('study_id'))}**

| Metric | Value |
|--------|-------|
| Risk Level | **{risk_level}** |
| Risk Score | {risk_score} |
| SAE Issues | {top.get('metrics', {}).get('sae_issues', 0)} |
| Missing Pages | {top.get('metrics', {}).get('missing_pages', 0)} |
| Lab Issues | {top.get('metrics', {}).get('lab_issues', 0)} |
| Overdue Visits | {top.get('metrics', {}).get('overdue_visits', 0)} |

### Risk Distribution
"""
    
    # Add risk distribution
    risk_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for s in sorted_studies:
        level = s.get('risk', {}).get('level', 'Unknown')
        if level in risk_counts:
            risk_counts[level] += 1
    
    response += f"- 🔴 Critical: {risk_counts['Critical']} studies\n"
    response += f"- 🟠 High: {risk_counts['High']} studies\n"
    response += f"- 🟡 Medium: {risk_counts['Medium']} studies\n"
    response += f"- 🟢 Low: {risk_counts['Low']} studies\n"
    
    # Add recommendations from top risk study
    recs = top.get('recommendations', [])
    if recs:
        response += "\n### 📋 Priority Actions\n"
        for rec in recs[:3]:
            response += f"- **{rec.get('priority')}**: {rec.get('action')} ({rec.get('owner')})\n"
    
    return response


def format_study_response(study: Dict) -> str:
    """Format a response about a specific study."""
    risk = study.get('risk', {})
    dqi = study.get('dqi', {})
    metrics = study.get('metrics', {})
    
    response = f"""## 📊 {study.get('study_name', study.get('study_id'))} Analysis

### Overall Status
| Metric | Value |
|--------|-------|
| Risk Level | **{risk.get('level', 'Unknown')}** (Score: {risk.get('raw_score', 0)}) |
| Data Quality Index | **{dqi.get('score', 0)}%** ({dqi.get('level', 'Unknown')}) |
| Total Subjects | {study.get('total_subjects', 0)} |

### Key Metrics
- 📄 Missing Pages: {metrics.get('missing_pages', 0)} ({metrics.get('missing_pages_pct', 0)}%)
- 🔬 SAE Issues: {metrics.get('sae_issues', 0)}
- 📅 Overdue Visits: {metrics.get('overdue_visits', 0)}
- 🧪 Lab Issues: {metrics.get('lab_issues', 0)}
- 💊 Coding Issues: {metrics.get('coding_issues', 0)}
- ✅ Clean CRF Rate: {metrics.get('clean_crf_pct', 0)}%

### DQI Components
"""
    
    components = dqi.get('components', {})
    for name, data in components.items():
        score = data.get('score', 0)
        emoji = "✅" if score >= 80 else "⚠️" if score >= 60 else "❌"
        response += f"- {emoji} {name.replace('_', ' ').title()}: {score}%\n"
    
    # Add recommendations
    recs = study.get('recommendations', [])
    if recs:
        response += "\n### 📋 Recommendations\n"
        for rec in recs:
            priority_emoji = "🔴" if rec.get('priority') == 'CRITICAL' else "🟠" if rec.get('priority') == 'HIGH' else "🟡"
            response += f"{priority_emoji} **{rec.get('category')}**: {rec.get('action')}\n"
    
    return response


def format_dqi_response(studies: List[Dict]) -> str:
    """Format a response about Data Quality Index."""
    if not studies:
        return "No studies found in the database."
    
    # Calculate average DQI
    dqi_scores = [s.get('dqi', {}).get('score', 0) for s in studies]
    avg_dqi = sum(dqi_scores) / len(dqi_scores)
    
    # Sort by DQI (lowest first)
    sorted_studies = sorted(studies, key=lambda x: x.get('dqi', {}).get('score', 0))
    
    response = f"""## 📈 Data Quality Index Overview

### Portfolio Summary
- **Average DQI**: {avg_dqi:.1f}%
- **Total Studies**: {len(studies)}

### Studies Requiring Attention (Lowest DQI)

| Study | DQI Score | Level | Key Issue |
|-------|-----------|-------|-----------|
"""
    
    for s in sorted_studies[:5]:
        dqi = s.get('dqi', {})
        # Find lowest component
        components = dqi.get('components', {})
        lowest = min(components.items(), key=lambda x: x[1].get('score', 100)) if components else (None, {'score': 0})
        
        response += f"| {s.get('study_name', s.get('study_id'))} | {dqi.get('score', 0)}% | {dqi.get('level', 'Unknown')} | {lowest[0].replace('_', ' ').title() if lowest[0] else 'N/A'} |\n"
    
    response += "\n### 💡 Recommendations\n"
    response += "1. Focus on studies with DQI < 70% for immediate quality improvement\n"
    response += "2. Review Visit Completeness across low-scoring studies\n"
    response += "3. Prioritize Query Resolution for upcoming data cuts\n"
    
    return response


def format_summary_response() -> str:
    """Format a portfolio summary response."""
    summary = get_portfolio_summary()
    
    response = f"""## 📊 Clinical Portfolio Summary

### Overview
| Metric | Value |
|--------|-------|
| Active Studies | {summary.get('study_count', 0)} |
| Total Subjects | {summary.get('total_subjects', 0):,} |
| Average DQI | {summary.get('average_dqi', 0)}% |
| Total SAE Issues | {summary.get('total_sae_issues', 0)} |
| Total Missing Pages | {summary.get('total_missing_pages', 0)} |

### Risk Distribution
"""
    
    risk_dist = summary.get('risk_distribution', {})
    response += f"- 🔴 Critical: {risk_dist.get('Critical', 0)} studies\n"
    response += f"- 🟠 High: {risk_dist.get('High', 0)} studies\n"
    response += f"- 🟡 Medium: {risk_dist.get('Medium', 0)} studies\n"
    response += f"- 🟢 Low: {risk_dist.get('Low', 0)} studies\n"
    
    response += "\n### 🔥 Top Risk Studies\n"
    for s in summary.get('top_risk_studies', [])[:3]:
        response += f"- **{s.get('study_name', s.get('study_id'))}**: {s.get('risk_level')} (Score: {s.get('risk_score', 0)})\n"
    
    return response


def handle_site_query(parsed: ParsedQuery, studies: List[Dict]) -> str:
    """Handle queries about sites."""
    response = "## 🏥 Site Analysis\n\n"
    
    # If specific study mentioned
    if parsed.study_id:
        study_folder = find_study_by_number(parsed.study_id)
        if study_folder:
            study = get_study_summary(study_folder)
            sites = study.get('site_summary', {}).get('sites', [])
            
            response += f"### Sites in Study {parsed.study_id}\n\n"
            response += "| Site ID | Subjects | Open Queries |\n"
            response += "|---------|----------|--------------|\n"
            
            for site in sites[:10]:
                response += f"| {site.get('site_id')} | {site.get('subject_count', 0)} | {site.get('open_queries', 0)} |\n"
            
            if len(sites) > 10:
                response += f"\n*...and {len(sites) - 10} more sites*\n"
            
            return response
    
    # General site overview
    total_sites = 0
    sites_with_issues = []
    
    for study in studies:
        site_info = study.get('site_summary', {})
        total_sites += site_info.get('site_count', 0)
        
        for site in site_info.get('sites', []):
            if site.get('open_queries', 0) > 10:
                sites_with_issues.append({
                    "study": study.get('study_name'),
                    "site_id": site.get('site_id'),
                    "queries": site.get('open_queries', 0)
                })
    
    response += f"**Total Sites Across Portfolio**: {total_sites}\n\n"
    
    if sites_with_issues:
        response += "### ⚠️ Sites with High Query Volume (>10)\n\n"
        sites_with_issues.sort(key=lambda x: x['queries'], reverse=True)
        for s in sites_with_issues[:10]:
            response += f"- **{s['study']}** - Site {s['site_id']}: {s['queries']} open queries\n"
    
    return response


def process_query(query: str) -> str:
    """
    Main entry point for processing natural language queries.
    
    Uses intent detection, data gathering, and optionally Gemini AI
    to generate comprehensive responses.
    """
    # Parse the query
    parsed = detect_intent(query)
    logger.info(f"Query: '{query}' -> Intent: {parsed.intent}")
    
    # Get studies data
    studies = get_all_studies_summary()
    
    # Handle based on intent
    if parsed.intent == QueryIntent.RISK_ANALYSIS:
        context = json.dumps([{
            "study": s.get("study_name"),
            "risk_level": s.get("risk", {}).get("level"),
            "risk_score": s.get("risk", {}).get("raw_score"),
            "sae_issues": s.get("metrics", {}).get("sae_issues")
        } for s in studies[:10]], indent=2)
        
        gen_response = query_gemini(context, query)
        if gen_response:
            return gen_response
        
        return format_risk_response(studies)
    
    elif parsed.intent == QueryIntent.STUDY_DETAIL:
        study_folder = find_study_by_number(parsed.study_id)
        if study_folder:
            study = get_study_summary(study_folder)
            
            context = json.dumps({
                "study": study.get("study_name"),
                "metrics": study.get("metrics"),
                "risk": study.get("risk"),
                "dqi": study.get("dqi"),
                "recommendations": study.get("recommendations")
            }, indent=2)
            
            gen_response = query_gemini(context, query)
            if gen_response:
                return gen_response
            
            return format_study_response(study)
        else:
            return f"Study {parsed.study_id} not found. Available studies: " + ", ".join([s.get('study_name', 'Unknown')[:15] for s in studies[:10]])
    
    elif parsed.intent == QueryIntent.DQI_QUERY:
        context = json.dumps([{
            "study": s.get("study_name"),
            "dqi_score": s.get("dqi", {}).get("score"),
            "dqi_level": s.get("dqi", {}).get("level")
        } for s in studies], indent=2)
        
        gen_response = query_gemini(context, query)
        if gen_response:
            return gen_response
        
        return format_dqi_response(studies)
    
    elif parsed.intent == QueryIntent.SITE_QUERY:
        return handle_site_query(parsed, studies)
    
    elif parsed.intent == QueryIntent.RECOMMENDATION:
        # Get top risk study recommendations
        if studies:
            top_study = studies[0]  # Already sorted by risk
            recs = top_study.get('recommendations', [])
            
            response = f"## 📋 Priority Recommendations\n\n"
            response += f"Based on analysis of **{top_study.get('study_name')}** (highest risk):\n\n"
            
            for rec in recs:
                priority_emoji = "🔴" if rec.get('priority') == 'CRITICAL' else "🟠" if rec.get('priority') == 'HIGH' else "🟡"
                response += f"{priority_emoji} **{rec.get('category')}** ({rec.get('priority')})\n"
                response += f"   - Action: {rec.get('action')}\n"
                response += f"   - Owner: {rec.get('owner')}\n"
                response += f"   - Deadline: {rec.get('deadline')}\n\n"
            
            return response
        return "No recommendations available - no studies found."
    
    elif parsed.intent == QueryIntent.SUMMARY:
        return format_summary_response()
    
    elif parsed.intent == QueryIntent.REGIONAL:
        # Note: Would need region data in the actual dataset
        return f"Regional analysis for **{parsed.region.upper()}** is not available yet. Site-level geographic data is needed to enable this feature."
    
    # General/fallback response
    summary = get_portfolio_summary()
    
    return f"""## 👋 Clinical Data Lake Connected

I can analyze **{summary.get('study_count', 0)}** active clinical studies.

### Try asking:
- "Which study has the highest risk?"
- "Show me the DQI scores"
- "What are the recommendations for Study 15?"
- "Give me a portfolio summary"
- "Which sites have the most issues?"

**Current Portfolio Status:**
- Average DQI: {summary.get('average_dqi', 0)}%
- Critical Risk Studies: {summary.get('risk_distribution', {}).get('Critical', 0)}
- Total SAE Issues: {summary.get('total_sae_issues', 0)}
"""
