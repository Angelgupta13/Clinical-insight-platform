import pandas as pd
import os
import glob
import re

# Configuration
# Configuration
# Use environment variable or default to a relative 'dataset' folder
DATASET_ROOT = os.environ.get("DATASET_ROOT", os.path.join(os.path.dirname(__file__), "..", "dataset"))

def find_study_folders():
    """List all study folders in the dataset root."""
    if not os.path.exists(DATASET_ROOT):
        return []
    return [d for d in os.listdir(DATASET_ROOT) if os.path.isdir(os.path.join(DATASET_ROOT, d))]

def find_file_by_keyword(study_path, keyword):
    """Find a file in the study directory containing the keyword."""
    # Search for xlsx files
    files = glob.glob(os.path.join(study_path, "*.xlsx"))
    for f in files:
        if keyword.lower() in os.path.basename(f).lower():
            return f
    return None

def load_edc_metrics(study_path):
    f = find_file_by_keyword(study_path, "EDC_Metrics")
    if not f: return None
    # Assuming 'Subject Level Metrics' tab is the key one based on guide
    try:
        df = pd.read_excel(f, sheet_name="Subject Level Metrics")
    except Exception as e:
        print(f"Error reading EDC Metrics for {study_path}: {e}")
        return None

def load_missing_pages(study_path):
    f = find_file_by_keyword(study_path, "Missing_Pages")
    if not f: return None
    try:
        df = pd.read_excel(f)
        return df.to_dict(orient="records")
    except:
        return None

def load_visit_projections(study_path):
    f = find_file_by_keyword(study_path, "Visit Projection Tracker")
    if not f: return None
    try:
        # Sheet: Missing Visits
        df = pd.read_excel(f, sheet_name="Missing Visits")
        return df.to_dict(orient="records")
    except:
        return None

def load_lab_metrics(study_path):
    f = find_file_by_keyword(study_path, "Missing_Lab_Name")
    if not f: return None
    try:
        df = pd.read_excel(f)
        return df.to_dict(orient="records")
    except:
        return None

def load_sae_dashboard(study_path):
    f = find_file_by_keyword(study_path, "eSAE Dashboard")
    if not f: return None
    try:
        # Guide mentions two tabs: SAE Dashboard_DM, SAE Dashboard_Safety
        df_dm = pd.read_excel(f, sheet_name="SAE Dashboard_DM")
        df_safety = pd.read_excel(f, sheet_name="SAE Dashboard_Safety")
        return {
            "dm": df_dm.to_dict(orient="records"),
            "safety": df_safety.to_dict(orient="records")
        }
    except:
        return None

def load_coding_metrics(study_path):
    # Load MedDRA and WHODD
    meddra_f = find_file_by_keyword(study_path, "MedDRA")
    whodd_f = find_file_by_keyword(study_path, "WHODD")
    
    issues = 0
    if meddra_f:
        try:
            df = pd.read_excel(meddra_f)
            # Count where "Require Coding" is Yes or similar if column exists, 
            # Or just count rows as the report seems to list items needing attention
            issues += len(df)
        except: pass
        
    if whodd_f:
        try:
            df = pd.read_excel(whodd_f)
            issues += len(df)
        except: pass
        
    return issues

def get_study_summary(study_folder_name):
    """Aggregate high-level metrics for a single study."""
    study_path = os.path.join(DATASET_ROOT, study_folder_name)
    
    edc = load_edc_metrics(study_path)
    missing_pages = load_missing_pages(study_path)
    sae = load_sae_dashboard(study_path)
    visits = load_visit_projections(study_path)
    labs = load_lab_metrics(study_path)
    coding_issues = load_coding_metrics(study_path)
    
    # Metrics
    total_subjects = len(edc) if edc else 0
    missing_pages_count = len(missing_pages) if missing_pages else 0
    
    sae_issues = 0
    if sae:
        sae_issues = len(sae.get('dm', [])) + len(sae.get('safety', []))

    overdue_visits = len(visits) if visits else 0
    lab_issues = len(labs) if labs else 0

    # Risk Score Calculation (Heuristic)
    # Weights: SAE (5x), Missing Pages (1x), Lab Issues (2x), Overdue Visits (1x)
    risk_score = (sae_issues * 5) + (missing_pages_count * 1) + (lab_issues * 2) + (overdue_visits * 1)
    
    # Normalize risk level
    risk_level = "Low"
    if risk_score > 50: risk_level = "Medium"
    if risk_score > 150: risk_level = "High"
    if risk_score > 300: risk_level = "Critical"

    return {
        "study_id": study_folder_name,
        "total_subjects": total_subjects,
        "metrics": {
            "missing_pages": missing_pages_count,
            "sae_issues": sae_issues,
            "overdue_visits": overdue_visits,
            "lab_issues": lab_issues,
            "coding_issues": coding_issues
        },
        "risk": {
            "score": risk_score,
            "level": risk_level
        },
        "details_available": {
            "edc": edc is not None,
            "missing_pages": missing_pages is not None,
            "sae": sae is not None,
            "visits": visits is not None,
            "labs": labs is not None
        }
    }

def get_all_studies_summary():
    studies = find_study_folders()
    summaries = []
    for study in studies:
        summaries.append(get_study_summary(study))
    return summaries
