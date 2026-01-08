"""
Data Processor for Clinical Insight Platform.
Handles loading, parsing, and aggregating clinical trial data from multiple sources.
Production-ready with comprehensive error handling and logging.
"""
import pandas as pd
import os
import glob
import logging
from typing import Dict, List, Optional, Any, Tuple
from functools import lru_cache

from analytics import (
    calculate_dqi, 
    calculate_risk_score, 
    calculate_clean_patient_status,
    calculate_missing_pages_percentage,
    calculate_clean_crf_percentage,
    generate_recommendations
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration - use environment variable or relative path
DATASET_ROOT = os.environ.get(
    "DATASET_ROOT", 
    os.path.join(os.path.dirname(__file__), "..", "dataset", "QC Anonymized Study Files")
)


class DataLoadError(Exception):
    """Custom exception for data loading errors."""
    pass


def find_study_folders() -> List[str]:
    """
    List all study folders in the dataset root.
    
    Returns:
        List of study folder names
    """
    if not os.path.exists(DATASET_ROOT):
        logger.warning(f"Dataset root does not exist: {DATASET_ROOT}")
        return []
    
    folders = []
    for d in os.listdir(DATASET_ROOT):
        full_path = os.path.join(DATASET_ROOT, d)
        if os.path.isdir(full_path):
            folders.append(d)
    
    logger.info(f"Found {len(folders)} study folders")
    return sorted(folders)


def find_file_by_keyword(study_path: str, keyword: str) -> Optional[str]:
    """
    Find a file in the study directory containing the keyword.
    
    Args:
        study_path: Path to study folder
        keyword: Keyword to search for in filename
        
    Returns:
        Full path to matching file, or None
    """
    files = glob.glob(os.path.join(study_path, "*.xlsx"))
    for f in files:
        if keyword.lower() in os.path.basename(f).lower():
            return f
    return None


def safe_read_excel(
    filepath: str, 
    sheet_name: str = 0,
    study_id: str = "Unknown"
) -> Optional[pd.DataFrame]:
    """
    Safely read an Excel file with comprehensive error handling.
    
    Args:
        filepath: Path to Excel file
        sheet_name: Sheet name or index to read
        study_id: Study identifier for logging
        
    Returns:
        DataFrame if successful, None otherwise
    """
    try:
        df = pd.read_excel(filepath, sheet_name=sheet_name)
        logger.debug(f"Successfully loaded {os.path.basename(filepath)} for {study_id}")
        return df
    except FileNotFoundError:
        logger.warning(f"File not found: {filepath}")
    except ValueError as e:
        logger.warning(f"Sheet '{sheet_name}' not found in {filepath}: {e}")
    except Exception as e:
        logger.error(f"Error reading {filepath}: {e}")
    return None


# ============================================================================
# Data Loaders for each file type
# ============================================================================

def load_edc_metrics(study_path: str) -> Optional[List[Dict]]:
    """
    Load EDC metrics from Subject Level Metrics sheet.
    
    Contains: Subject ID, Site, Query counts, Page counts, SDV status
    """
    f = find_file_by_keyword(study_path, "EDC_Metrics")
    if not f:
        return None
    
    df = safe_read_excel(f, sheet_name="Subject Level Metrics", study_id=study_path)
    if df is not None:
        return df.to_dict(orient="records")
    return None


def load_missing_pages(study_path: str) -> Optional[List[Dict]]:
    """
    Load missing pages report.
    
    Contains: Subject, Form, Page, Visit with missing data
    """
    f = find_file_by_keyword(study_path, "Missing_Pages")
    if not f:
        return None
    
    df = safe_read_excel(f, study_id=study_path)
    if df is not None:
        return df.to_dict(orient="records")
    return None


def load_visit_projections(study_path: str) -> Tuple[Optional[List[Dict]], Optional[List[Dict]]]:
    """
    Load visit projection tracker with multiple sheets.
    
    Returns: (missing_visits, projection_data)
    """
    f = find_file_by_keyword(study_path, "Visit Projection Tracker")
    if not f:
        return None, None
    
    missing_visits = None
    projection_data = None
    
    # Try different sheet names
    df_missing = safe_read_excel(f, sheet_name="Missing Visits", study_id=study_path)
    if df_missing is not None:
        missing_visits = df_missing.to_dict(orient="records")
    
    # Try to get projection/summary sheet
    df_proj = safe_read_excel(f, sheet_name=0, study_id=study_path)
    if df_proj is not None and df_missing is None:
        # If first sheet is different from missing visits
        projection_data = df_proj.to_dict(orient="records")
    
    return missing_visits, projection_data


def load_lab_metrics(study_path: str) -> Optional[List[Dict]]:
    """
    Load missing lab names and ranges report.
    """
    f = find_file_by_keyword(study_path, "Missing_Lab_Name")
    if not f:
        return None
    
    df = safe_read_excel(f, study_id=study_path)
    if df is not None:
        return df.to_dict(orient="records")
    return None


def load_sae_dashboard(study_path: str) -> Optional[Dict[str, List[Dict]]]:
    """
    Load SAE dashboard with DM and Safety sheets.
    
    Returns: Dictionary with 'dm' and 'safety' lists
    """
    f = find_file_by_keyword(study_path, "eSAE Dashboard")
    if not f:
        return None
    
    result = {"dm": [], "safety": []}
    
    df_dm = safe_read_excel(f, sheet_name="SAE Dashboard_DM", study_id=study_path)
    if df_dm is not None:
        result["dm"] = df_dm.to_dict(orient="records")
    
    df_safety = safe_read_excel(f, sheet_name="SAE Dashboard_Safety", study_id=study_path)
    if df_safety is not None:
        result["safety"] = df_safety.to_dict(orient="records")
    
    if not result["dm"] and not result["safety"]:
        return None
    
    return result


def load_coding_reports(study_path: str) -> Dict[str, Any]:
    """
    Load MedDRA and WHODD coding reports.
    
    Returns: Dictionary with counts and details for each coding type
    """
    result = {
        "meddra": {"count": 0, "records": []},
        "whodd": {"count": 0, "records": []},
        "total_issues": 0
    }
    
    # MedDRA (Medical Dictionary for Regulatory Activities)
    meddra_f = find_file_by_keyword(study_path, "MedDRA")
    if meddra_f:
        df = safe_read_excel(meddra_f, study_id=study_path)
        if df is not None:
            result["meddra"]["count"] = len(df)
            result["meddra"]["records"] = df.head(50).to_dict(orient="records")
    
    # WHODD (WHO Drug Dictionary)
    whodd_f = find_file_by_keyword(study_path, "WHODD")
    if whodd_f:
        df = safe_read_excel(whodd_f, study_id=study_path)
        if df is not None:
            result["whodd"]["count"] = len(df)
            result["whodd"]["records"] = df.head(50).to_dict(orient="records")
    
    result["total_issues"] = result["meddra"]["count"] + result["whodd"]["count"]
    return result


def load_edrr_report(study_path: str) -> Optional[List[Dict]]:
    """
    Load Compiled EDRR (Edit Check Discrepancy Report) data.
    """
    f = find_file_by_keyword(study_path, "EDRR")
    if not f:
        return None
    
    df = safe_read_excel(f, study_id=study_path)
    if df is not None:
        return df.to_dict(orient="records")
    return None


def load_inactivated_forms(study_path: str) -> Optional[List[Dict]]:
    """
    Load Inactivated Forms, Folders and Records report.
    """
    f = find_file_by_keyword(study_path, "Inactivated")
    if not f:
        return None
    
    df = safe_read_excel(f, study_id=study_path)
    if df is not None:
        return df.to_dict(orient="records")
    return None


# ============================================================================
# Aggregation Functions
# ============================================================================

def extract_site_data(edc_data: List[Dict]) -> Dict[str, Any]:
    """
    Extract and aggregate site-level information from EDC data.
    """
    if not edc_data:
        return {"sites": [], "site_count": 0}
    
    sites = {}
    
    for record in edc_data:
        # Try common site column names
        site_id = record.get('Site', record.get('SiteID', 
                  record.get('Site ID', record.get('Site Number', 'Unknown'))))
        
        site_str = str(site_id)
        
        if site_str not in sites:
            sites[site_str] = {
                "site_id": site_str,
                "subject_count": 0,
                "open_queries": 0,
                "missing_pages": 0
            }
        
        sites[site_str]["subject_count"] += 1
        
        # Aggregate queries
        open_q = record.get('Open Queries', record.get('OpenQueries', 0))
        try:
            sites[site_str]["open_queries"] += int(open_q or 0)
        except (ValueError, TypeError):
            pass
    
    site_list = list(sites.values())
    
    # Sort by subject count descending
    site_list.sort(key=lambda x: x["subject_count"], reverse=True)
    
    return {
        "sites": site_list,
        "site_count": len(site_list)
    }


def get_study_summary(study_folder_name: str) -> Dict[str, Any]:
    """
    Aggregate comprehensive metrics for a single study.
    
    Returns a dictionary with all study-level data including DQI.
    """
    study_path = os.path.join(DATASET_ROOT, study_folder_name)
    
    # Load all data sources
    edc = load_edc_metrics(study_path)
    missing_pages_data = load_missing_pages(study_path)
    sae = load_sae_dashboard(study_path)
    missing_visits, visit_projections = load_visit_projections(study_path)
    labs = load_lab_metrics(study_path)
    coding = load_coding_reports(study_path)
    edrr = load_edrr_report(study_path)
    inactivated = load_inactivated_forms(study_path)
    
    # Calculate counts
    total_subjects = len(edc) if edc else 0
    missing_pages_count = len(missing_pages_data) if missing_pages_data else 0
    
    sae_issues = 0
    if sae:
        sae_issues = len(sae.get('dm', [])) + len(sae.get('safety', []))
    
    overdue_visits = len(missing_visits) if missing_visits else 0
    lab_issues = len(labs) if labs else 0
    coding_issues = coding["total_issues"]
    edrr_issues = len(edrr) if edrr else 0
    inactivated_count = len(inactivated) if inactivated else 0
    
    # Calculate DQI
    dqi = calculate_dqi(
        edc_data=edc or [],
        visit_data=missing_visits or [],
        missing_pages=missing_pages_count,
        coding_issues=coding_issues
    )
    
    # Calculate Risk Score
    risk = calculate_risk_score(
        sae_issues=sae_issues,
        missing_pages=missing_pages_count,
        lab_issues=lab_issues,
        overdue_visits=overdue_visits,
        coding_issues=coding_issues
    )
    
    # Calculate additional metrics
    missing_pages_pct = calculate_missing_pages_percentage(missing_pages_count, edc or [])
    clean_crf_pct = calculate_clean_crf_percentage(edc or [], missing_pages_count)
    clean_patient = calculate_clean_patient_status(edc or [], missing_pages_data or [])
    
    # Extract site data
    site_info = extract_site_data(edc or [])
    
    # Generate recommendations
    recommendations = generate_recommendations(
        risk_level=risk["level"],
        sae_issues=sae_issues,
        missing_pages=missing_pages_count,
        lab_issues=lab_issues,
        overdue_visits=overdue_visits,
        coding_issues=coding_issues,
        dqi_score=dqi["score"]
    )
    
    return {
        "study_id": study_folder_name,
        "study_name": study_folder_name.split('_')[0].strip(),
        "total_subjects": total_subjects,
        "metrics": {
            "missing_pages": missing_pages_count,
            "missing_pages_pct": missing_pages_pct,
            "sae_issues": sae_issues,
            "overdue_visits": overdue_visits,
            "lab_issues": lab_issues,
            "coding_issues": coding_issues,
            "edrr_issues": edrr_issues,
            "inactivated_records": inactivated_count,
            "clean_crf_pct": clean_crf_pct
        },
        "dqi": dqi,
        "risk": risk,
        "clean_patient_status": clean_patient,
        "site_summary": site_info,
        "recommendations": recommendations,
        "data_sources_available": {
            "edc": edc is not None,
            "missing_pages": missing_pages_data is not None,
            "sae": sae is not None,
            "visits": missing_visits is not None,
            "labs": labs is not None,
            "coding": coding["total_issues"] > 0 or True,
            "edrr": edrr is not None,
            "inactivated": inactivated is not None
        }
    }


# ... existing imports ...
import json

# Cache configuration
CACHE_DIR = os.path.join(os.path.dirname(__file__), "data_cache")
CACHE_FILE = os.path.join(CACHE_DIR, "studies_cache.json")

def load_cache() -> Optional[List[Dict[str, Any]]]:
    """Load study summaries from JSON cache."""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                logger.info(f"Loading data from cache: {CACHE_FILE}")
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading cache: {e}")
    return None

def save_cache(data: List[Dict[str, Any]]):
    """Save study summaries to JSON cache."""
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(CACHE_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved data to cache: {CACHE_FILE}")
    except Exception as e:
        logger.error(f"Error saving cache: {e}")


def get_all_studies_summary(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    Get summaries for all studies in the dataset.
    
    Args:
        force_refresh: If True, ignore cache and re-process all files.
    
    Returns:
        List of study summary dictionaries
    """
    if not force_refresh:
        cached_data = load_cache()
        if cached_data:
            return cached_data

    studies = find_study_folders()
    summaries = []
    
    for study in studies:
        try:
            summary = get_study_summary(study)
            summaries.append(summary)
        except Exception as e:
            logger.error(f"Error processing study {study}: {e}")
            # Add minimal entry for failed studies
            summaries.append({
                "study_id": study,
                "study_name": study.split('_')[0].strip(),
                "error": str(e),
                "total_subjects": 0,
                "metrics": {},
                "risk": {"level": "Unknown", "raw_score": 0}
            })
    
    # Sort by risk score descending
    summaries.sort(
        key=lambda x: x.get("risk", {}).get("raw_score", 0), 
        reverse=True
    )
    
    # Save to cache
    save_cache(summaries)
    
    return summaries


def get_study_detail(study_id: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed data for a specific study including raw data samples.
    """
    study_path = os.path.join(DATASET_ROOT, study_id)
    
    if not os.path.exists(study_path):
        # Try to find by partial match
        for folder in find_study_folders():
            if study_id.lower() in folder.lower():
                study_path = os.path.join(DATASET_ROOT, folder)
                study_id = folder
                break
        else:
            return None
    
    summary = get_study_summary(study_id)
    
    # Add detailed data samples
    edc = load_edc_metrics(study_path)
    missing_pages = load_missing_pages(study_path)
    sae = load_sae_dashboard(study_path)
    
    summary["detailed_data"] = {
        "edc_sample": (edc[:20] if edc else []),
        "missing_pages_sample": (missing_pages[:20] if missing_pages else []),
        "sae_dm_sample": (sae.get("dm", [])[:10] if sae else []),
        "sae_safety_sample": (sae.get("safety", [])[:10] if sae else [])
    }
    
    return summary


def get_portfolio_summary() -> Dict[str, Any]:
    """
    Get high-level portfolio summary across all studies.
    """
    studies = get_all_studies_summary()
    
    if not studies:
        return {"error": "No studies found"}
    
    # Aggregate metrics
    total_subjects = sum(s.get("total_subjects", 0) for s in studies)
    total_sae = sum(s.get("metrics", {}).get("sae_issues", 0) for s in studies)
    total_missing = sum(s.get("metrics", {}).get("missing_pages", 0) for s in studies)
    
    # Risk distribution
    risk_dist = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0, "Unknown": 0}
    for s in studies:
        level = s.get("risk", {}).get("level", "Unknown")
        risk_dist[level] = risk_dist.get(level, 0) + 1
    
    # Average DQI
    dqi_scores = [s.get("dqi", {}).get("score", 0) for s in studies if "dqi" in s]
    avg_dqi = sum(dqi_scores) / len(dqi_scores) if dqi_scores else 0
    
    # Top risk studies
    top_risks = [
        {
            "study_id": s["study_id"],
            "study_name": s.get("study_name", ""),
            "risk_level": s.get("risk", {}).get("level"),
            "risk_score": s.get("risk", {}).get("raw_score", 0)
        }
        for s in studies[:5]  # Already sorted by risk
    ]
    
    return {
        "study_count": len(studies),
        "total_subjects": total_subjects,
        "total_sae_issues": total_sae,
        "total_missing_pages": total_missing,
        "average_dqi": round(avg_dqi, 2),
        "risk_distribution": risk_dist,
        "top_risk_studies": top_risks,
        "studies": studies
    }
