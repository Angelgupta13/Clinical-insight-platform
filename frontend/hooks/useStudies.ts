import { useEffect, useState } from 'react';
import axios from 'axios';

export interface StudySummary {
    study_id: string;
    total_subjects: number;
    metrics: {
        missing_pages: number;
        sae_issues: number;
        overdue_visits: number;
        lab_issues: number;
        coding_issues: number;
    };
    risk: {
        score: number;
        level: string;
    };
    details_available: {
        edc: boolean;
        missing_pages: boolean;
        sae: boolean;
        visits: boolean;
        labs: boolean;
    };
}

export function useStudies() {
    const [studies, setStudies] = useState<StudySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStudies() {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${apiUrl}/api/studies`);
                setStudies(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load studies');
                setLoading(false);
            }
        }

        fetchStudies();
    }, []);

    return { studies, loading, error };
}
