"""
Collaboration module for Clinical Insight Platform.
Handles alerts, comments, notifications, and team collaboration features.
"""
import json
import os
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict, field
from enum import Enum
from pathlib import Path

logger = logging.getLogger(__name__)


# Storage directory for collaboration data
STORAGE_DIR = Path(os.path.dirname(__file__)) / ".storage"
STORAGE_DIR.mkdir(exist_ok=True)

ALERTS_FILE = STORAGE_DIR / "alerts.json"
COMMENTS_FILE = STORAGE_DIR / "comments.json"
NOTIFICATIONS_FILE = STORAGE_DIR / "notifications.json"


class AlertType(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class AlertCategory(str, Enum):
    SAFETY = "safety"
    DATA_QUALITY = "data_quality"
    OPERATIONS = "operations"
    COMPLIANCE = "compliance"
    SYSTEM = "system"


@dataclass
class Alert:
    """System alert for clinical trial issues."""
    id: str
    type: AlertType
    category: AlertCategory
    title: str
    message: str
    study_id: Optional[str] = None
    site_id: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    read: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Alert":
        return cls(**data)


@dataclass
class Comment:
    """Comment/note on a study or issue."""
    id: str
    study_id: str
    content: str
    user: str = "system"
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: Optional[str] = None
    parent_id: Optional[str] = None  # For threaded replies
    tags: List[str] = field(default_factory=list)
    mentions: List[str] = field(default_factory=list)  # @mentioned users
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Comment":
        return cls(**data)


@dataclass
class Notification:
    """User notification."""
    id: str
    user: str
    type: str  # alert, mention, comment, system
    title: str
    message: str
    link: Optional[str] = None  # Link to relevant resource
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    read: bool = False
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Notification":
        return cls(**data)


# ============================================================================
# Storage Functions
# ============================================================================

def _load_json(filepath: Path, default: List = None) -> List[Dict]:
    """Load JSON file, return default if not exists."""
    if default is None:
        default = []
    try:
        if filepath.exists():
            with open(filepath, 'r') as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"Error loading {filepath}: {e}")
    return default


def _save_json(filepath: Path, data: List[Dict]) -> bool:
    """Save data to JSON file."""
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        return True
    except Exception as e:
        logger.error(f"Error saving {filepath}: {e}")
        return False


# ============================================================================
# Alert Management
# ============================================================================

def create_alert(
    alert_type: AlertType,
    category: AlertCategory,
    title: str,
    message: str,
    study_id: Optional[str] = None,
    site_id: Optional[str] = None
) -> Alert:
    """Create a new alert."""
    alert = Alert(
        id=str(uuid.uuid4()),
        type=alert_type,
        category=category,
        title=title,
        message=message,
        study_id=study_id,
        site_id=site_id
    )
    
    # Save to storage
    alerts = _load_json(ALERTS_FILE)
    alerts.insert(0, alert.to_dict())  # Most recent first
    
    # Keep only last 1000 alerts
    alerts = alerts[:1000]
    _save_json(ALERTS_FILE, alerts)
    
    return alert


def get_alerts(
    unread_only: bool = False,
    alert_type: Optional[AlertType] = None,
    category: Optional[AlertCategory] = None,
    study_id: Optional[str] = None,
    limit: int = 50
) -> List[Alert]:
    """Get alerts with optional filtering."""
    alerts_data = _load_json(ALERTS_FILE)
    alerts = [Alert.from_dict(a) for a in alerts_data]
    
    # Apply filters
    if unread_only:
        alerts = [a for a in alerts if not a.read]
    
    if alert_type:
        alerts = [a for a in alerts if a.type == alert_type]
    
    if category:
        alerts = [a for a in alerts if a.category == category]
    
    if study_id:
        alerts = [a for a in alerts if a.study_id == study_id]
    
    return alerts[:limit]


def acknowledge_alert(alert_id: str, user: str) -> Optional[Alert]:
    """Mark an alert as acknowledged."""
    alerts_data = _load_json(ALERTS_FILE)
    
    for alert_dict in alerts_data:
        if alert_dict['id'] == alert_id:
            alert_dict['read'] = True
            alert_dict['acknowledged_by'] = user
            alert_dict['acknowledged_at'] = datetime.now().isoformat()
            _save_json(ALERTS_FILE, alerts_data)
            return Alert.from_dict(alert_dict)
    
    return None


def get_unread_alert_count() -> Dict[str, int]:
    """Get count of unread alerts by type."""
    alerts = get_alerts(unread_only=True)
    
    counts = {
        "critical": 0,
        "warning": 0,
        "info": 0,
        "total": 0
    }
    
    for alert in alerts:
        counts[alert.type.value] = counts.get(alert.type.value, 0) + 1
        counts["total"] += 1
    
    return counts


# ============================================================================
# Auto-Alert Generation
# ============================================================================

def generate_study_alerts(study_summary: Dict) -> List[Alert]:
    """Automatically generate alerts based on study metrics."""
    alerts = []
    study_id = study_summary.get('study_id')
    study_name = study_summary.get('study_name', study_id)
    metrics = study_summary.get('metrics', {})
    risk = study_summary.get('risk', {})
    dqi = study_summary.get('dqi', {})
    
    # Critical risk alert
    if risk.get('level') == 'Critical':
        alerts.append(create_alert(
            alert_type=AlertType.CRITICAL,
            category=AlertCategory.DATA_QUALITY,
            title=f"Critical Risk: {study_name}",
            message=f"Study has reached CRITICAL risk level with score {risk.get('raw_score', 0)}. Immediate review required.",
            study_id=study_id
        ))
    
    # SAE alert
    sae_issues = metrics.get('sae_issues', 0)
    if sae_issues > 0:
        alerts.append(create_alert(
            alert_type=AlertType.CRITICAL,
            category=AlertCategory.SAFETY,
            title=f"SAE Issues: {study_name}",
            message=f"{sae_issues} unresolved SAE case(s) require safety team review.",
            study_id=study_id
        ))
    
    # Low DQI alert
    dqi_score = dqi.get('score', 100)
    if dqi_score < 60:
        alerts.append(create_alert(
            alert_type=AlertType.WARNING,
            category=AlertCategory.DATA_QUALITY,
            title=f"Low Data Quality: {study_name}",
            message=f"DQI score of {dqi_score}% is below acceptable threshold. Data review needed.",
            study_id=study_id
        ))
    
    # Overdue visits alert
    overdue = metrics.get('overdue_visits', 0)
    if overdue > 20:
        alerts.append(create_alert(
            alert_type=AlertType.WARNING,
            category=AlertCategory.OPERATIONS,
            title=f"Visit Compliance: {study_name}",
            message=f"{overdue} overdue visits detected. CRA follow-up recommended.",
            study_id=study_id
        ))
    
    return alerts


# ============================================================================
# Comment Management
# ============================================================================

def create_comment(
    study_id: str,
    content: str,
    user: str = "system",
    tags: List[str] = None,
    parent_id: Optional[str] = None
) -> Comment:
    """Create a new comment on a study."""
    if tags is None:
        tags = []
    
    # Extract @mentions from content
    mentions = extract_mentions(content)
    
    comment = Comment(
        id=str(uuid.uuid4()),
        study_id=study_id,
        content=content,
        user=user,
        tags=tags,
        mentions=mentions,
        parent_id=parent_id
    )
    
    # Save to storage
    comments = _load_json(COMMENTS_FILE)
    comments.insert(0, comment.to_dict())
    _save_json(COMMENTS_FILE, comments)
    
    # Create notifications for mentioned users
    for mentioned_user in mentions:
        create_notification(
            user=mentioned_user,
            notification_type="mention",
            title=f"Mentioned in {study_id}",
            message=f"{user} mentioned you: {content[:100]}...",
            link=f"/studies/{study_id}"
        )
    
    return comment


def get_comments(
    study_id: Optional[str] = None,
    user: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 50
) -> List[Comment]:
    """Get comments with optional filtering."""
    comments_data = _load_json(COMMENTS_FILE)
    comments = [Comment.from_dict(c) for c in comments_data]
    
    if study_id:
        comments = [c for c in comments if c.study_id == study_id]
    
    if user:
        comments = [c for c in comments if c.user == user]
    
    if tag:
        comments = [c for c in comments if tag in c.tags]
    
    return comments[:limit]


def update_comment(comment_id: str, content: str) -> Optional[Comment]:
    """Update an existing comment."""
    comments_data = _load_json(COMMENTS_FILE)
    
    for comment_dict in comments_data:
        if comment_dict['id'] == comment_id:
            comment_dict['content'] = content
            comment_dict['updated_at'] = datetime.now().isoformat()
            comment_dict['mentions'] = extract_mentions(content)
            _save_json(COMMENTS_FILE, comments_data)
            return Comment.from_dict(comment_dict)
    
    return None


def delete_comment(comment_id: str) -> bool:
    """Delete a comment."""
    comments_data = _load_json(COMMENTS_FILE)
    original_len = len(comments_data)
    
    comments_data = [c for c in comments_data if c['id'] != comment_id]
    
    if len(comments_data) < original_len:
        _save_json(COMMENTS_FILE, comments_data)
        return True
    
    return False


def extract_mentions(content: str) -> List[str]:
    """Extract @mentions from content."""
    import re
    mentions = re.findall(r'@(\w+)', content)
    return list(set(mentions))


# ============================================================================
# Notification Management
# ============================================================================

def create_notification(
    user: str,
    notification_type: str,
    title: str,
    message: str,
    link: Optional[str] = None
) -> Notification:
    """Create a notification for a user."""
    notification = Notification(
        id=str(uuid.uuid4()),
        user=user,
        type=notification_type,
        title=title,
        message=message,
        link=link
    )
    
    notifications = _load_json(NOTIFICATIONS_FILE)
    notifications.insert(0, notification.to_dict())
    
    # Keep only last 500 per user (rough)
    notifications = notifications[:2000]
    _save_json(NOTIFICATIONS_FILE, notifications)
    
    return notification


def get_notifications(
    user: str,
    unread_only: bool = False,
    limit: int = 50
) -> List[Notification]:
    """Get notifications for a user."""
    notifications_data = _load_json(NOTIFICATIONS_FILE)
    notifications = [Notification.from_dict(n) for n in notifications_data]
    
    # Filter by user
    notifications = [n for n in notifications if n.user == user]
    
    if unread_only:
        notifications = [n for n in notifications if not n.read]
    
    return notifications[:limit]


def mark_notification_read(notification_id: str) -> Optional[Notification]:
    """Mark a notification as read."""
    notifications_data = _load_json(NOTIFICATIONS_FILE)
    
    for notif_dict in notifications_data:
        if notif_dict['id'] == notification_id:
            notif_dict['read'] = True
            _save_json(NOTIFICATIONS_FILE, notifications_data)
            return Notification.from_dict(notif_dict)
    
    return None


def mark_all_notifications_read(user: str) -> int:
    """Mark all notifications as read for a user."""
    notifications_data = _load_json(NOTIFICATIONS_FILE)
    count = 0
    
    for notif_dict in notifications_data:
        if notif_dict['user'] == user and not notif_dict['read']:
            notif_dict['read'] = True
            count += 1
    
    _save_json(NOTIFICATIONS_FILE, notifications_data)
    return count


# ============================================================================
# Team Tagging
# ============================================================================

# Predefined team roles
TEAM_ROLES = {
    "cra": "Clinical Research Associate",
    "dm": "Data Manager",
    "safety": "Safety Team",
    "qa": "Quality Assurance",
    "coder": "Medical Coder",
    "pm": "Project Manager",
    "monitor": "Site Monitor",
    "stat": "Statistician"
}


def get_team_roles() -> Dict[str, str]:
    """Get available team roles."""
    return TEAM_ROLES


def notify_team(
    role: str,
    title: str,
    message: str,
    study_id: Optional[str] = None,
    link: Optional[str] = None
) -> List[Notification]:
    """Send notification to all members of a team role."""
    # In a real system, this would look up users by role
    # For now, create a notification for the role as a pseudo-user
    notification = create_notification(
        user=f"team_{role}",
        notification_type="team",
        title=title,
        message=message,
        link=link or (f"/studies/{study_id}" if study_id else None)
    )
    
    return [notification]


# ============================================================================
# Activity Log
# ============================================================================

def log_activity(
    action: str,
    user: str,
    study_id: Optional[str] = None,
    details: Optional[Dict] = None
) -> Dict:
    """Log an activity for audit trail."""
    activity = {
        "id": str(uuid.uuid4()),
        "action": action,
        "user": user,
        "study_id": study_id,
        "details": details or {},
        "timestamp": datetime.now().isoformat()
    }
    
    # In production, this would go to a database
    # For now, we just return the activity record
    logger.info(f"Activity: {action} by {user} on {study_id}")
    
    return activity
