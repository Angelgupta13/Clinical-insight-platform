"""
Analytics module for Clinical Insight Platform.
Calculates Data Quality Index (DQI) and other clinical trial metrics.
"""
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


@dataclass
class DQIWeights:
    """Configurable weights for Data Quality Index calculation."""
    visit_completeness: float = 0.30
    query_resolution: float = 0.25
    sdv_status: float = 0.20
    coding_completeness: float = 0.15
    form_signatures: float = 0.10

    def validate(self) -> bool:
        """Ensure weights sum to 1.0"""
        total = (self.visit_completeness + self.query_resolution + 
                 self.sdv_status + self.coding_completeness + self.form_signatures)
        return abs(total - 1.0) < 0.001


# Default weights - can be overridden per study/sponsor requirements
DEFAULT_WEIGHTS = DQIWeights()


def calculate_percentage(numerator: int, denominator: int) -> float:
    """Safely calculate percentage, avoiding division by zero."""
    if denominator == 0:
        return 100.0  # If no expected items, consider 100% complete
    return round((numerator / denominator) * 100, 2)


def calculate_visit_completeness(edc_data: List[Dict], visit_data: List[Dict]) -> float:
    """
    Calculate visit completeness percentage.
    Formula: (Completed Visits / Expected Visits) * 100
    """
    if not edc_data:
        return 0.0
    
    total_expected = len(edc_data)  # Each subject should have visits
    missing_visits = len(visit_data) if visit_data else 0
    
    completed = max(0, total_expected - missing_visits)
    return calculate_percentage(completed, total_expected)


def calculate_query_resolution_rate(edc_data: List[Dict]) -> float:
    """
    Calculate query resolution rate.
    Looks for query-related columns in EDC data.
    """
    if not edc_data:
        return 0.0
    
    total_queries = 0
    resolved_queries = 0
    
    for record in edc_data:
        # Try common column names for queries
        open_queries = record.get('Open Queries', record.get('OpenQueries', 0))
        answered_queries = record.get('Answered Queries', record.get('AnsweredQueries', 0))
        closed_queries = record.get('Closed Queries', record.get('ClosedQueries', 0))
        
        try:
            open_q = int(open_queries) if open_queries else 0
            answered_q = int(answered_queries) if answered_queries else 0
            closed_q = int(closed_queries) if closed_queries else 0
            
            total_queries += open_q + answered_q + closed_q
            resolved_queries += closed_q
        except (ValueError, TypeError):
            continue
    
    return calculate_percentage(resolved_queries, total_queries)


def calculate_sdv_completion(edc_data: List[Dict]) -> float:
    """
    Calculate Source Data Verification (SDV) completion rate.
    """
    if not edc_data:
        return 0.0
    
    total_pages = 0
    verified_pages = 0
    
    for record in edc_data:
        # Look for SDV-related columns
        total = record.get('Total Pages', record.get('TotalPages', 0))
        verified = record.get('SDV Completed', record.get('SDVCompleted', 
                   record.get('Verified Pages', 0)))
        
        try:
            total_pages += int(total) if total else 0
            verified_pages += int(verified) if verified else 0
        except (ValueError, TypeError):
            continue
    
    return calculate_percentage(verified_pages, total_pages)


def calculate_coding_completeness(coding_issues: int, total_terms: int = None) -> float:
    """
    Calculate medical coding completeness.
    If total_terms unknown, use inverse of issues with cap.
    """
    if total_terms:
        coded_terms = max(0, total_terms - coding_issues)
        return calculate_percentage(coded_terms, total_terms)
    
    # Heuristic: assume 100 expected terms per study, penalize for issues
    estimated_total = max(100, coding_issues * 2)
    coded = max(0, estimated_total - coding_issues)
    return calculate_percentage(coded, estimated_total)


def calculate_form_signature_rate(edc_data: List[Dict]) -> float:
    """
    Calculate electronic signature completion rate.
    """
    if not edc_data:
        return 0.0
    
    total_forms = 0
    signed_forms = 0
    
    for record in edc_data:
        # Look for signature-related columns
        total = record.get('Total Forms', record.get('TotalForms', 1))
        signed = record.get('Signed Forms', record.get('SignedForms',
                 record.get('eSigned', 0)))
        
        try:
            total_forms += int(total) if total else 0
            signed_forms += int(signed) if signed else 0
        except (ValueError, TypeError):
            continue
    
    # If no form data available, use reasonable default
    if total_forms == 0:
        return 75.0  # Conservative estimate
    
    return calculate_percentage(signed_forms, total_forms)


def calculate_missing_pages_percentage(missing_pages: int, edc_data: List[Dict]) -> float:
    """
    Calculate percentage of missing pages.
    Returns 0-100 where 0 = no missing pages (good), 100 = all missing (bad).
    """
    if not edc_data:
        return 0.0
    
    # Estimate total expected pages based on subjects
    # Assume average 20 pages per subject (CRF forms)
    estimated_total = len(edc_data) * 20
    
    if estimated_total == 0:
        return 0.0
    
    missing_pct = (missing_pages / estimated_total) * 100
    return min(100.0, round(missing_pct, 2))


def calculate_clean_crf_percentage(edc_data: List[Dict], missing_pages: int) -> float:
    """
    Calculate percentage of clean (error-free) CRFs.
    A clean CRF has no open queries and is complete.
    """
    if not edc_data:
        return 0.0
    
    clean_count = 0
    total_count = len(edc_data)
    
    for record in edc_data:
        open_queries = record.get('Open Queries', record.get('OpenQueries', 0))
        try:
            if int(open_queries or 0) == 0:
                clean_count += 1
        except (ValueError, TypeError):
            pass
    
    return calculate_percentage(clean_count, total_count)


def calculate_clean_patient_status(edc_data: List[Dict], missing_pages_data: List[Dict]) -> Dict[str, Any]:
    """
    Determine clean patient status across the study.
    Returns count and list of clean vs. dirty patients.
    """
    if not edc_data:
        return {
            "total": 0,
            "clean": 0,
            "dirty": 0,
            "clean_percentage": 0.0
        }
    
    # Build set of subjects with issues from missing pages
    subjects_with_issues = set()
    if missing_pages_data:
        for record in missing_pages_data:
            subject = record.get('Subject', record.get('SubjectID', 
                      record.get('Subject ID', '')))
            if subject:
                subjects_with_issues.add(str(subject))
    
    # Check each subject in EDC
    clean_subjects = []
    dirty_subjects = []
    
    for record in edc_data:
        subject = record.get('Subject', record.get('SubjectID',
                  record.get('Subject ID', '')))
        if not subject:
            continue
            
        subject_str = str(subject)
        open_queries = record.get('Open Queries', record.get('OpenQueries', 0))
        
        try:
            has_queries = int(open_queries or 0) > 0
        except (ValueError, TypeError):
            has_queries = False
        
        has_missing = subject_str in subjects_with_issues
        
        if has_queries or has_missing:
            dirty_subjects.append(subject_str)
        else:
            clean_subjects.append(subject_str)
    
    total = len(clean_subjects) + len(dirty_subjects)
    
    return {
        "total": total,
        "clean": len(clean_subjects),
        "dirty": len(dirty_subjects),
        "clean_percentage": calculate_percentage(len(clean_subjects), total) if total > 0 else 0.0,
        "clean_subjects": clean_subjects[:10],  # Limit for response size
        "dirty_subjects": dirty_subjects[:10]
    }


def calculate_dqi(
    edc_data: List[Dict],
    visit_data: List[Dict],
    missing_pages: int,
    coding_issues: int,
    weights: DQIWeights = None
) -> Dict[str, Any]:
    """
    Calculate comprehensive Data Quality Index (DQI).
    
    Returns a score from 0-100 along with component breakdowns.
    Higher score = better data quality.
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS
    
    # Calculate component scores (all 0-100)
    visit_score = calculate_visit_completeness(edc_data, visit_data)
    query_score = calculate_query_resolution_rate(edc_data)
    sdv_score = calculate_sdv_completion(edc_data)
    coding_score = calculate_coding_completeness(coding_issues)
    signature_score = calculate_form_signature_rate(edc_data)
    
    # Calculate weighted DQI
    dqi = (
        (weights.visit_completeness * visit_score) +
        (weights.query_resolution * query_score) +
        (weights.sdv_status * sdv_score) +
        (weights.coding_completeness * coding_score) +
        (weights.form_signatures * signature_score)
    )
    
    # Determine quality level
    if dqi >= 90:
        quality_level = "Excellent"
    elif dqi >= 75:
        quality_level = "Good"
    elif dqi >= 60:
        quality_level = "Fair"
    elif dqi >= 40:
        quality_level = "Poor"
    else:
        quality_level = "Critical"
    
    return {
        "score": round(dqi, 2),
        "level": quality_level,
        "components": {
            "visit_completeness": {
                "score": round(visit_score, 2),
                "weight": weights.visit_completeness
            },
            "query_resolution": {
                "score": round(query_score, 2),
                "weight": weights.query_resolution
            },
            "sdv_status": {
                "score": round(sdv_score, 2),
                "weight": weights.sdv_status
            },
            "coding_completeness": {
                "score": round(coding_score, 2),
                "weight": weights.coding_completeness
            },
            "form_signatures": {
                "score": round(signature_score, 2),
                "weight": weights.form_signatures
            }
        }
    }


def calculate_risk_score(
    sae_issues: int,
    missing_pages: int,
    lab_issues: int,
    overdue_visits: int,
    coding_issues: int
) -> Dict[str, Any]:
    """
    Calculate weighted risk score with improved algorithm.
    
    Weights:
    - SAE (Safety): 5x (most critical)
    - Lab Issues: 3x (high impact)
    - Coding Issues: 2x (affects submissions)
    - Missing Pages: 1.5x (data completeness)
    - Overdue Visits: 1x (operational)
    """
    weighted_score = (
        (sae_issues * 5.0) +
        (lab_issues * 3.0) +
        (coding_issues * 2.0) +
        (missing_pages * 1.5) +
        (overdue_visits * 1.0)
    )
    
    # Normalize to 0-100 scale (cap at 500 raw score = 100)
    normalized = min(100, (weighted_score / 5))
    
    # Determine risk level
    if weighted_score > 300:
        level = RiskLevel.CRITICAL
    elif weighted_score > 150:
        level = RiskLevel.HIGH
    elif weighted_score > 50:
        level = RiskLevel.MEDIUM
    else:
        level = RiskLevel.LOW
    
    return {
        "raw_score": round(weighted_score, 2),
        "normalized_score": round(normalized, 2),
        "level": level.value,
        "breakdown": {
            "sae_contribution": round(sae_issues * 5.0, 2),
            "lab_contribution": round(lab_issues * 3.0, 2),
            "coding_contribution": round(coding_issues * 2.0, 2),
            "missing_pages_contribution": round(missing_pages * 1.5, 2),
            "overdue_visits_contribution": round(overdue_visits * 1.0, 2)
        }
    }


def generate_recommendations(
    risk_level: str,
    sae_issues: int,
    missing_pages: int,
    lab_issues: int,
    overdue_visits: int,
    coding_issues: int,
    dqi_score: float
) -> List[Dict[str, str]]:
    """
    Generate AI-style actionable recommendations based on metrics.
    """
    recommendations = []
    
    # Critical safety issues
    if sae_issues > 0:
        recommendations.append({
            "priority": "CRITICAL",
            "category": "Safety",
            "action": f"Review {sae_issues} unresolved SAE cases immediately",
            "owner": "Safety Team",
            "deadline": "24 hours"
        })
    
    # Lab reconciliation
    if lab_issues > 10:
        recommendations.append({
            "priority": "HIGH",
            "category": "Lab Data",
            "action": f"Reconcile {lab_issues} lab value discrepancies with central lab",
            "owner": "Data Manager",
            "deadline": "3 days"
        })
    
    # Visit compliance
    if overdue_visits > 15:
        recommendations.append({
            "priority": "HIGH",
            "category": "Operations",
            "action": f"Schedule CRA follow-up for {overdue_visits} overdue visits",
            "owner": "CRA Lead",
            "deadline": "5 days"
        })
    
    # Missing pages
    if missing_pages > 20:
        recommendations.append({
            "priority": "MEDIUM",
            "category": "Data Entry",
            "action": f"Generate missing page report and assign to sites",
            "owner": "Site Monitor",
            "deadline": "1 week"
        })
    
    # Coding backlog
    if coding_issues > 30:
        recommendations.append({
            "priority": "MEDIUM",
            "category": "Coding",
            "action": f"Clear {coding_issues} term coding backlog before next cut-off",
            "owner": "Medical Coder",
            "deadline": "2 weeks"
        })
    
    # DQI improvement
    if dqi_score < 70:
        recommendations.append({
            "priority": "MEDIUM",
            "category": "Quality",
            "action": f"DQI at {dqi_score}% - schedule quality improvement review",
            "owner": "QA Lead",
            "deadline": "1 week"
        })
    
    # If no issues, add positive feedback
    if not recommendations:
        recommendations.append({
            "priority": "INFO",
            "category": "Status",
            "action": "Study data quality is excellent - maintain current processes",
            "owner": "Study Team",
            "deadline": "N/A"
        })
    
    return recommendations
