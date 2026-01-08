"""
Pydantic models for Clinical Insight Platform API.
Provides type safety and validation for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"
    UNKNOWN = "Unknown"


class DQILevel(str, Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"
    CRITICAL = "Critical"


class DQIComponent(BaseModel):
    """Individual DQI component score."""
    score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)


class DQIScore(BaseModel):
    """Complete Data Quality Index score."""
    score: float = Field(ge=0, le=100)
    level: str
    components: Dict[str, DQIComponent] = {}


class RiskScore(BaseModel):
    """Risk score with breakdown."""
    raw_score: float
    normalized_score: float
    level: str
    breakdown: Dict[str, float] = {}


class StudyMetrics(BaseModel):
    """Core metrics for a study."""
    missing_pages: int = 0
    missing_pages_pct: float = 0.0
    sae_issues: int = 0
    overdue_visits: int = 0
    lab_issues: int = 0
    coding_issues: int = 0
    edrr_issues: int = 0
    inactivated_records: int = 0
    clean_crf_pct: float = 0.0


class CleanPatientStatus(BaseModel):
    """Patient cleanliness status for a study."""
    total: int = 0
    clean: int = 0
    dirty: int = 0
    clean_percentage: float = 0.0
    clean_subjects: List[str] = []
    dirty_subjects: List[str] = []


class SiteSummary(BaseModel):
    """Site-level summary."""
    site_id: str
    subject_count: int = 0
    open_queries: int = 0
    missing_pages: int = 0


class SiteInfo(BaseModel):
    """Aggregated site information for a study."""
    sites: List[SiteSummary] = []
    site_count: int = 0


class Recommendation(BaseModel):
    """AI-generated recommendation."""
    priority: str
    category: str
    action: str
    owner: str
    deadline: str


class DataSourcesAvailable(BaseModel):
    """Indicates which data sources were found for a study."""
    edc: bool = False
    missing_pages: bool = False
    sae: bool = False
    visits: bool = False
    labs: bool = False
    coding: bool = False
    edrr: bool = False
    inactivated: bool = False


class StudySummary(BaseModel):
    """Complete study summary."""
    study_id: str
    study_name: str
    total_subjects: int = 0
    metrics: StudyMetrics = StudyMetrics()
    dqi: DQIScore
    risk: RiskScore
    clean_patient_status: CleanPatientStatus = CleanPatientStatus()
    site_summary: SiteInfo = SiteInfo()
    recommendations: List[Recommendation] = []
    data_sources_available: DataSourcesAvailable = DataSourcesAvailable()


class TopRiskStudy(BaseModel):
    """Summary of a high-risk study for portfolio view."""
    study_id: str
    study_name: str
    risk_level: str
    risk_score: float


class RiskDistribution(BaseModel):
    """Risk level distribution across portfolio."""
    Low: int = 0
    Medium: int = 0
    High: int = 0
    Critical: int = 0
    Unknown: int = 0


class PortfolioSummary(BaseModel):
    """High-level portfolio summary."""
    study_count: int
    total_subjects: int
    total_sae_issues: int
    total_missing_pages: int
    average_dqi: float
    risk_distribution: RiskDistribution
    top_risk_studies: List[TopRiskStudy] = []


class AgentQuery(BaseModel):
    """Agent query request."""
    query: str = Field(min_length=1, max_length=1000)


class AgentResponse(BaseModel):
    """Agent query response."""
    response: str
    intent: Optional[str] = None
    context_used: Optional[bool] = None


class SearchResult(BaseModel):
    """Individual search result."""
    type: str  # study, site, subject
    study_id: str
    site_id: Optional[str] = None
    subject_id: Optional[str] = None
    subject_count: Optional[int] = None
    risk_level: Optional[str] = None


class SearchResponse(BaseModel):
    """Search results response."""
    query: str
    field: str
    result_count: int
    results: List[SearchResult] = []


class FilterOptions(BaseModel):
    """Available filter options."""
    risk_levels: List[str] = []
    dqi_levels: List[str] = []
    sort_options: List[str] = []
    study_count: int = 0


class ExportData(BaseModel):
    """Export data wrapper."""
    generated_at: datetime
    report_type: str
    data: Any


class AlertType(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class Alert(BaseModel):
    """System alert."""
    id: str
    type: AlertType
    title: str
    message: str
    study_id: Optional[str] = None
    created_at: datetime
    read: bool = False


class Comment(BaseModel):
    """Comment/note on a study or issue."""
    id: str
    study_id: str
    user: str
    content: str
    created_at: datetime
    tags: List[str] = []


class CommentCreate(BaseModel):
    """Request to create a new comment."""
    study_id: str
    content: str = Field(min_length=1, max_length=2000)
    tags: List[str] = []
