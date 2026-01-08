import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// Types
// ============================================================================

export interface DQIComponent {
    score: number;
    weight: number;
}

export interface DQIScore {
    score: number;
    level: string;
    components: Record<string, DQIComponent>;
}

export interface RiskScore {
    raw_score: number;
    normalized_score: number;
    level: string;
    breakdown: Record<string, number>;
}

export interface StudyMetrics {
    missing_pages: number;
    missing_pages_pct: number;
    sae_issues: number;
    overdue_visits: number;
    lab_issues: number;
    coding_issues: number;
    edrr_issues: number;
    inactivated_records: number;
    clean_crf_pct: number;
}

export interface CleanPatientStatus {
    total: number;
    clean: number;
    dirty: number;
    clean_percentage: number;
    clean_subjects: string[];
    dirty_subjects: string[];
}

export interface SiteSummary {
    site_id: string;
    subject_count: number;
    open_queries: number;
    missing_pages: number;
}

export interface SiteInfo {
    sites: SiteSummary[];
    site_count: number;
}

export interface Recommendation {
    priority: string;
    category: string;
    action: string;
    owner: string;
    deadline: string;
}

export interface DataSourcesAvailable {
    edc: boolean;
    missing_pages: boolean;
    sae: boolean;
    visits: boolean;
    labs: boolean;
    coding: boolean;
    edrr: boolean;
    inactivated: boolean;
}

export interface StudySummary {
    study_id: string;
    study_name: string;
    total_subjects: number;
    metrics: StudyMetrics;
    dqi: DQIScore;
    risk: RiskScore;
    clean_patient_status: CleanPatientStatus;
    site_summary: SiteInfo;
    recommendations: Recommendation[];
    data_sources_available: DataSourcesAvailable;
}

export interface PortfolioSummary {
    study_count: number;
    total_subjects: number;
    total_sae_issues: number;
    total_missing_pages: number;
    average_dqi: number;
    risk_distribution: Record<string, number>;
    top_risk_studies: Array<{
        study_id: string;
        study_name: string;
        risk_level: string;
        risk_score: number;
    }>;
    studies: StudySummary[];
}

export interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    category: string;
    title: string;
    message: string;
    study_id?: string;
    site_id?: string;
    created_at: string;
    read: boolean;
    acknowledged_by?: string;
    acknowledged_at?: string;
}

export interface Comment {
    id: string;
    study_id: string;
    content: string;
    user: string;
    created_at: string;
    updated_at?: string;
    parent_id?: string;
    tags: string[];
    mentions: string[];
}

// ============================================================================
// Studies Hook
// ============================================================================

export function useStudies(options?: {
    sortBy?: 'risk' | 'dqi' | 'name' | 'subjects';
    riskLevel?: string;
    limit?: number;
}) {
    const [studies, setStudies] = useState<StudySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudies = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (options?.sortBy) params.append('sort_by', options.sortBy);
            if (options?.riskLevel) params.append('risk_level', options.riskLevel);
            if (options?.limit) params.append('limit', options.limit.toString());
            
            const response = await axios.get(`${API_URL}/api/studies?${params}`);
            setStudies(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load studies');
            console.error('Error fetching studies:', err);
        } finally {
            setLoading(false);
        }
    }, [options?.sortBy, options?.riskLevel, options?.limit]);

    useEffect(() => {
        fetchStudies();
    }, [fetchStudies]);

    return { studies, loading, error, refetch: fetchStudies };
}

// ============================================================================
// Single Study Hook
// ============================================================================

export function useStudy(studyId: string | undefined) {
    const [study, setStudy] = useState<StudySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = studyId;
        if (!id) {
            setStudy(null);
            setLoading(false);
            return;
        }

        async function fetchStudy() {
            if (!id) return;
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/studies/${encodeURIComponent(id)}`);
                setStudy(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to load study details');
                console.error('Error fetching study:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchStudy();
    }, [studyId]);

    return { study, loading, error };
}

// ============================================================================
// Portfolio Hook
// ============================================================================

export function usePortfolio() {
    const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPortfolio() {
            try {
                const response = await axios.get(`${API_URL}/api/portfolio`);
                setPortfolio(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to load portfolio');
                console.error('Error fetching portfolio:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchPortfolio();
    }, []);

    return { portfolio, loading, error };
}

// ============================================================================
// Alerts Hook
// ============================================================================

export function useAlerts(options?: {
    unreadOnly?: boolean;
    alertType?: string;
    studyId?: string;
}) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [unreadCount, setUnreadCount] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (options?.unreadOnly) params.append('unread_only', 'true');
            if (options?.alertType) params.append('alert_type', options.alertType);
            if (options?.studyId) params.append('study_id', options.studyId);
            
            const [alertsRes, countRes] = await Promise.all([
                axios.get(`${API_URL}/api/alerts?${params}`),
                axios.get(`${API_URL}/api/alerts/count`)
            ]);
            
            setAlerts(alertsRes.data);
            setUnreadCount(countRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to load alerts');
            console.error('Error fetching alerts:', err);
        } finally {
            setLoading(false);
        }
    }, [options?.unreadOnly, options?.alertType, options?.studyId]);

    const acknowledgeAlert = async (alertId: string, user: string = 'current_user') => {
        try {
            await axios.post(`${API_URL}/api/alerts/${alertId}/acknowledge?user=${user}`);
            await fetchAlerts();
        } catch (err) {
            console.error('Error acknowledging alert:', err);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    return { alerts, unreadCount, loading, error, refetch: fetchAlerts, acknowledgeAlert };
}

// ============================================================================
// Comments Hook
// ============================================================================

export function useComments(studyId?: string) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        try {
            setLoading(true);
            const params = studyId ? `?study_id=${encodeURIComponent(studyId)}` : '';
            const response = await axios.get(`${API_URL}/api/comments${params}`);
            setComments(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load comments');
            console.error('Error fetching comments:', err);
        } finally {
            setLoading(false);
        }
    }, [studyId]);

    const addComment = async (content: string, tags: string[] = [], user: string = 'current_user') => {
        if (!studyId) return null;
        
        try {
            const response = await axios.post(`${API_URL}/api/comments`, {
                study_id: studyId,
                content,
                tags,
                user
            });
            await fetchComments();
            return response.data;
        } catch (err) {
            console.error('Error adding comment:', err);
            return null;
        }
    };

    const deleteComment = async (commentId: string) => {
        try {
            await axios.delete(`${API_URL}/api/comments/${commentId}`);
            await fetchComments();
            return true;
        } catch (err) {
            console.error('Error deleting comment:', err);
            return false;
        }
    };

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    return { comments, loading, error, refetch: fetchComments, addComment, deleteComment };
}

// ============================================================================
// Agent Hook
// ============================================================================

export function useAgent() {
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const askAgent = async (query: string) => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`${API_URL}/api/agent?query=${encodeURIComponent(query)}`);
            setResponse(res.data.response);
            return res.data.response;
        } catch (err) {
            const message = "I'm having trouble connecting to the data source right now.";
            setError(message);
            setResponse(message);
            return message;
        } finally {
            setLoading(false);
        }
    };

    return { response, loading, error, askAgent };
}

// ============================================================================
// Search Hook
// ============================================================================

export function useSearch() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = async (query: string, field: string = 'all') => {
        if (!query.trim()) {
            setResults([]);
            return [];
        }

        try {
            setLoading(true);
            const response = await axios.get(
                `${API_URL}/api/search?q=${encodeURIComponent(query)}&field=${field}`
            );
            setResults(response.data.results);
            setError(null);
            return response.data.results;
        } catch (err) {
            setError('Search failed');
            console.error('Error searching:', err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    return { results, loading, error, search };
}

// ============================================================================
// DQI Hook
// ============================================================================

export function useDQI() {
    const [dqiData, setDqiData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDQI() {
            try {
                const response = await axios.get(`${API_URL}/api/portfolio/dqi`);
                setDqiData(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to load DQI data');
                console.error('Error fetching DQI:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchDQI();
    }, []);

    return { dqiData, loading, error };
}

// ============================================================================
// Team Roles Hook
// ============================================================================

export function useTeamRoles() {
    const [roles, setRoles] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRoles() {
            try {
                const response = await axios.get(`${API_URL}/api/team/roles`);
                setRoles(response.data);
            } catch (err) {
                console.error('Error fetching team roles:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchRoles();
    }, []);

    const notifyTeam = async (role: string, title: string, message: string, studyId?: string) => {
        try {
            await axios.post(`${API_URL}/api/team/notify`, {
                role,
                title,
                message,
                study_id: studyId
            });
            return true;
        } catch (err) {
            console.error('Error notifying team:', err);
            return false;
        }
    };

    return { roles, loading, notifyTeam };
}
