"""
Clinical Trial Insight Platform - FastAPI Backend
Production-ready API with comprehensive endpoints for clinical data analysis.
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Clinical Trial Insight Platform",
    description="Real-Time Clinical Trial Data Quality and Operational Intelligence Dashboard API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Pydantic Models for API Responses
# ============================================================================

class HealthResponse(BaseModel):
    status: str
    message: str
    version: str


class ConfigResponse(BaseModel):
    dataset_path: str
    cwd: str
    study_count: int


# ============================================================================
# Core Endpoints
# ============================================================================

@app.get("/", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "Clinical Insight Platform Backend is running",
        "version": "2.0.0"
    }


@app.get("/config", response_model=ConfigResponse)
def get_config():
    """Return current configuration for debugging."""
    from data_processor import DATASET_ROOT, find_study_folders
    
    return {
        "dataset_path": DATASET_ROOT,
        "cwd": os.getcwd(),
        "study_count": len(find_study_folders())
    }


# ============================================================================
# Study Endpoints
# ============================================================================

@app.get("/api/studies")
def list_studies(
    sort_by: str = Query("risk", description="Sort by: risk, dqi, name, subjects"),
    limit: Optional[int] = Query(None, description="Limit number of results"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level: Low, Medium, High, Critical")
):
    """
    Get summary for all studies with optional filtering and sorting.
    """
    from data_processor import get_all_studies_summary
    
    studies = get_all_studies_summary()
    
    # Filter by risk level if specified
    if risk_level:
        studies = [s for s in studies if s.get("risk", {}).get("level", "").lower() == risk_level.lower()]
    
    # Sort
    if sort_by == "dqi":
        studies.sort(key=lambda x: x.get("dqi", {}).get("score", 0), reverse=True)
    elif sort_by == "name":
        studies.sort(key=lambda x: x.get("study_name", ""))
    elif sort_by == "subjects":
        studies.sort(key=lambda x: x.get("total_subjects", 0), reverse=True)
    # Default: already sorted by risk
    
    # Apply limit
    if limit:
        studies = studies[:limit]
    
    return studies


@app.get("/api/studies/{study_id}")
def get_study(study_id: str):
    """
    Get detailed information for a specific study.
    """
    from data_processor import get_study_detail
    
    result = get_study_detail(study_id)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Study '{study_id}' not found")
    
    return result


@app.get("/api/studies/{study_id}/sites")
def get_study_sites(study_id: str):
    """
    Get site-level breakdown for a specific study.
    """
    from data_processor import get_study_detail
    
    result = get_study_detail(study_id)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Study '{study_id}' not found")
    
    return {
        "study_id": study_id,
        "study_name": result.get("study_name"),
        "site_summary": result.get("site_summary", {}),
        "total_subjects": result.get("total_subjects", 0)
    }


@app.get("/api/studies/{study_id}/patients")
def get_study_patients(study_id: str):
    """
    Get patient-level data for a specific study.
    """
    from data_processor import get_study_detail
    
    result = get_study_detail(study_id)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Study '{study_id}' not found")
    
    return {
        "study_id": study_id,
        "study_name": result.get("study_name"),
        "clean_patient_status": result.get("clean_patient_status", {}),
        "total_subjects": result.get("total_subjects", 0),
        "patient_sample": result.get("detailed_data", {}).get("edc_sample", [])
    }


@app.get("/api/studies/{study_id}/recommendations")
def get_study_recommendations(study_id: str):
    """
    Get AI-generated recommendations for a specific study.
    """
    from data_processor import get_study_detail
    
    result = get_study_detail(study_id)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Study '{study_id}' not found")
    
    return {
        "study_id": study_id,
        "study_name": result.get("study_name"),
        "risk_level": result.get("risk", {}).get("level"),
        "dqi_score": result.get("dqi", {}).get("score"),
        "recommendations": result.get("recommendations", [])
    }


# ============================================================================
# Portfolio/Dashboard Endpoints
# ============================================================================

@app.get("/api/portfolio")
def get_portfolio():
    """
    Get high-level portfolio summary across all studies.
    """
    from data_processor import get_portfolio_summary
    
    return get_portfolio_summary()


@app.get("/api/portfolio/risks")
def get_portfolio_risks():
    """
    Get risk distribution and top risk studies.
    """
    from data_processor import get_portfolio_summary
    
    summary = get_portfolio_summary()
    
    return {
        "risk_distribution": summary.get("risk_distribution", {}),
        "top_risk_studies": summary.get("top_risk_studies", []),
        "critical_count": summary.get("risk_distribution", {}).get("Critical", 0),
        "high_count": summary.get("risk_distribution", {}).get("High", 0)
    }


@app.get("/api/portfolio/dqi")
def get_portfolio_dqi():
    """
    Get DQI metrics across portfolio.
    """
    from data_processor import get_all_studies_summary
    
    studies = get_all_studies_summary()
    
    dqi_data = []
    for s in studies:
        dqi = s.get("dqi", {})
        dqi_data.append({
            "study_id": s.get("study_id"),
            "study_name": s.get("study_name"),
            "dqi_score": dqi.get("score", 0),
            "dqi_level": dqi.get("level", "Unknown"),
            "components": dqi.get("components", {})
        })
    
    # Sort by DQI score
    dqi_data.sort(key=lambda x: x["dqi_score"])
    
    avg_dqi = sum(d["dqi_score"] for d in dqi_data) / len(dqi_data) if dqi_data else 0
    
    return {
        "average_dqi": round(avg_dqi, 2),
        "studies": dqi_data,
        "lowest_dqi_studies": dqi_data[:5],
        "highest_dqi_studies": dqi_data[-5:][::-1] if len(dqi_data) >= 5 else dqi_data[::-1]
    }


# ============================================================================
# AI Agent Endpoint
# ============================================================================

@app.get("/api/agent")
def ask_agent(query: str = Query(..., description="Natural language query")):
    """
    AI-powered agent for natural language queries about clinical data.
    """
    from agent import process_query
    
    response = process_query(query)
    return {"response": response}


# ============================================================================
# Search and Filter Endpoints
# ============================================================================

@app.get("/api/search")
def search_studies(
    q: str = Query(..., description="Search query"),
    field: str = Query("all", description="Field to search: all, study_id, site, subject")
):
    """
    Search across studies, sites, or subjects.
    """
    from data_processor import get_all_studies_summary
    
    studies = get_all_studies_summary()
    results = []
    
    query_lower = q.lower()
    
    for study in studies:
        if field in ["all", "study_id"]:
            if query_lower in study.get("study_id", "").lower():
                results.append({
                    "type": "study",
                    "study_id": study.get("study_id"),
                    "study_name": study.get("study_name"),
                    "risk_level": study.get("risk", {}).get("level")
                })
        
        if field in ["all", "site"]:
            sites = study.get("site_summary", {}).get("sites", [])
            for site in sites:
                if query_lower in str(site.get("site_id", "")).lower():
                    results.append({
                        "type": "site",
                        "study_id": study.get("study_id"),
                        "site_id": site.get("site_id"),
                        "subject_count": site.get("subject_count")
                    })
    
    return {
        "query": q,
        "field": field,
        "result_count": len(results),
        "results": results[:50]  # Limit results
    }


@app.get("/api/filters")
def get_filter_options():
    """
    Get available filter options for the dashboard.
    """
    from data_processor import get_all_studies_summary
    
    studies = get_all_studies_summary()
    
    # Extract unique values
    risk_levels = set()
    dqi_levels = set()
    
    for s in studies:
        risk_levels.add(s.get("risk", {}).get("level", "Unknown"))
        dqi_levels.add(s.get("dqi", {}).get("level", "Unknown"))
    
    return {
        "risk_levels": sorted(list(risk_levels)),
        "dqi_levels": sorted(list(dqi_levels)),
        "sort_options": ["risk", "dqi", "name", "subjects"],
        "study_count": len(studies)
    }


# ============================================================================
# Export Endpoints
# ============================================================================

@app.get("/api/export/summary")
def export_summary():
    """
    Export portfolio summary data in a format suitable for reports.
    """
    from data_processor import get_portfolio_summary
    import json
    from datetime import datetime
    
    summary = get_portfolio_summary()
    
    export_data = {
        "generated_at": datetime.now().isoformat(),
        "report_type": "Portfolio Summary",
        "data": summary
    }
    
    return export_data


@app.get("/api/export/study/{study_id}")
def export_study(study_id: str):
    """
    Export detailed study data for reporting.
    """
    from data_processor import get_study_detail
    from datetime import datetime
    
    result = get_study_detail(study_id)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Study '{study_id}' not found")
    
    export_data = {
        "generated_at": datetime.now().isoformat(),
        "report_type": "Study Detail",
        "data": result
    }
    
    return export_data


# ============================================================================
# Collaboration Endpoints - Alerts
# ============================================================================

@app.get("/api/alerts")
def get_alerts(
    unread_only: bool = Query(False, description="Only return unread alerts"),
    alert_type: Optional[str] = Query(None, description="Filter by type: critical, warning, info"),
    study_id: Optional[str] = Query(None, description="Filter by study"),
    limit: int = Query(50, ge=1, le=200)
):
    """Get system alerts with optional filtering."""
    from collaboration import get_alerts as fetch_alerts, AlertType
    
    type_filter = None
    if alert_type:
        try:
            type_filter = AlertType(alert_type.lower())
        except ValueError:
            pass
    
    alerts = fetch_alerts(
        unread_only=unread_only,
        alert_type=type_filter,
        study_id=study_id,
        limit=limit
    )
    
    return [a.to_dict() for a in alerts]


@app.get("/api/alerts/count")
def get_alert_count():
    """Get count of unread alerts by type."""
    from collaboration import get_unread_alert_count
    return get_unread_alert_count()


@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    user: str = Query("system", description="User acknowledging the alert")
):
    """Acknowledge an alert."""
    from collaboration import acknowledge_alert as ack_alert
    
    result = ack_alert(alert_id, user)
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return result.to_dict()


@app.post("/api/alerts/generate")
def generate_alerts_for_study(study_id: str):
    """Generate alerts for a specific study based on its metrics."""
    from data_processor import get_study_detail
    from collaboration import generate_study_alerts
    
    study = get_study_detail(study_id)
    if not study:
        raise HTTPException(status_code=404, detail=f"Study '{study_id}' not found")
    
    alerts = generate_study_alerts(study)
    return [a.to_dict() for a in alerts]


# ============================================================================
# Collaboration Endpoints - Comments
# ============================================================================

class CommentCreate(BaseModel):
    study_id: str
    content: str
    user: str = "system"
    tags: List[str] = []


@app.get("/api/comments")
def get_comments(
    study_id: Optional[str] = Query(None, description="Filter by study"),
    user: Optional[str] = Query(None, description="Filter by user"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    limit: int = Query(50, ge=1, le=200)
):
    """Get comments with optional filtering."""
    from collaboration import get_comments as fetch_comments
    
    comments = fetch_comments(
        study_id=study_id,
        user=user,
        tag=tag,
        limit=limit
    )
    
    return [c.to_dict() for c in comments]


@app.post("/api/comments")
def create_comment(comment: CommentCreate):
    """Create a new comment on a study."""
    from collaboration import create_comment as add_comment
    
    new_comment = add_comment(
        study_id=comment.study_id,
        content=comment.content,
        user=comment.user,
        tags=comment.tags
    )
    
    return new_comment.to_dict()


@app.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: str):
    """Delete a comment."""
    from collaboration import delete_comment as remove_comment
    
    success = remove_comment(comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return {"status": "deleted", "comment_id": comment_id}


# ============================================================================
# Collaboration Endpoints - Notifications
# ============================================================================

@app.get("/api/notifications/{user}")
def get_user_notifications(
    user: str,
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200)
):
    """Get notifications for a user."""
    from collaboration import get_notifications
    
    notifications = get_notifications(
        user=user,
        unread_only=unread_only,
        limit=limit
    )
    
    return [n.to_dict() for n in notifications]


@app.post("/api/notifications/{notification_id}/read")
def mark_notification_as_read(notification_id: str):
    """Mark a notification as read."""
    from collaboration import mark_notification_read
    
    result = mark_notification_read(notification_id)
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return result.to_dict()


@app.post("/api/notifications/{user}/read-all")
def mark_all_notifications_read(user: str):
    """Mark all notifications as read for a user."""
    from collaboration import mark_all_notifications_read as mark_all_read
    
    count = mark_all_read(user)
    return {"status": "success", "marked_read": count}


# ============================================================================
# Collaboration Endpoints - Team
# ============================================================================

@app.get("/api/team/roles")
def get_team_roles():
    """Get available team roles."""
    from collaboration import get_team_roles
    return get_team_roles()


class TeamNotification(BaseModel):
    role: str
    title: str
    message: str
    study_id: Optional[str] = None


@app.post("/api/team/notify")
def notify_team(notification: TeamNotification):
    """Send notification to a team role."""
    from collaboration import notify_team as send_team_notification
    
    result = send_team_notification(
        role=notification.role,
        title=notification.title,
        message=notification.message,
        study_id=notification.study_id
    )
    
    return [n.to_dict() for n in result]


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
