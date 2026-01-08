"use client";
import { usePortfolio } from '../hooks/useStudies';
import { motion } from 'framer-motion';
import { 
    Download, 
    AlertTriangle, 
    CheckCircle, 
    FileText, 
    TrendingUp,
    Users,
    Activity,
    Shield
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function QualityReportView() {
    const { portfolio, loading, error } = usePortfolio();

    if (loading) return (
        <div className="w-full h-64 flex items-center justify-center text-white/50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-400 mx-auto mb-4" />
                Generating Quality Report...
            </div>
        </div>
    );

    if (error || !portfolio) return (
        <div className="text-red-400 text-center p-8 bg-red-900/20 rounded-xl border border-red-500/30">
            Failed to load portfolio data
        </div>
    );

    const studies = portfolio.studies || [];
    const criticalRisks = (portfolio.risk_distribution?.Critical || 0) + (portfolio.risk_distribution?.High || 0);
    const totalIssues = portfolio.total_sae_issues + portfolio.total_missing_pages;

    const handleExport = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/export/summary`);
            const data = await response.json();
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clinical-portfolio-report-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    return (
        <div className="w-full space-y-6 mb-12">
            {/* Executive Summary Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-6 rounded-xl border-l-4 border-blue-500"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Active Studies</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{portfolio.study_count}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {portfolio.total_subjects.toLocaleString()} total subjects
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-6 rounded-xl border-l-4 border-emerald-500"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Average DQI</h3>
                    </div>
                    <div className={cn(
                        "text-3xl font-bold",
                        portfolio.average_dqi >= 80 ? "text-emerald-400" :
                        portfolio.average_dqi >= 60 ? "text-yellow-400" :
                        "text-red-400"
                    )}>
                        {portfolio.average_dqi.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {portfolio.average_dqi >= 80 ? "Excellent" : portfolio.average_dqi >= 60 ? "Good" : "Needs Attention"}
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass p-6 rounded-xl border-l-4 border-red-500"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">High Risk</h3>
                    </div>
                    <div className="text-3xl font-bold text-red-400">{criticalRisks}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {portfolio.risk_distribution?.Critical || 0} critical, {portfolio.risk_distribution?.High || 0} high
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass p-6 rounded-xl border-l-4 border-orange-500"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-orange-400" />
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">SAE Issues</h3>
                    </div>
                    <div className="text-3xl font-bold text-orange-400">{portfolio.total_sae_issues}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        Safety events requiring review
                    </div>
                </motion.div>
            </div>

            {/* Report Actions */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-light text-white">
                    <FileText className="inline-block w-6 h-6 mr-2 text-blue-400" />
                    Quality Assurance Report
                </h2>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                    <Download className="w-4 h-4" />
                    Export JSON
                </button>
            </div>

            {/* Data Table */}
            <div className="glass rounded-xl overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-white/5 text-xs uppercase font-medium text-gray-400">
                            <tr>
                                <th className="p-4">Study ID</th>
                                <th className="p-4">Subjects</th>
                                <th className="p-4">DQI</th>
                                <th className="p-4">Missing Pages</th>
                                <th className="p-4">SAE Issues</th>
                                <th className="p-4">Clean CRF %</th>
                                <th className="p-4">Risk Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {studies.map((study: any) => (
                                <tr key={study.study_id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                    <td className="p-4 font-medium text-white group-hover:text-blue-300 transition-colors">
                                        {study.study_name || study.study_id.split('_')[0]}
                                    </td>
                                    <td className="p-4 font-mono">{study.total_subjects || 0}</td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "font-mono font-bold",
                                            (study.dqi?.score || 0) >= 80 ? "text-emerald-400" :
                                            (study.dqi?.score || 0) >= 60 ? "text-yellow-400" :
                                            "text-red-400"
                                        )}>
                                            {study.dqi?.score?.toFixed(1) || 0}%
                                        </span>
                                    </td>
                                    <td className={cn("p-4 font-mono", (study.metrics?.missing_pages || 0) > 0 ? "text-red-300" : "text-emerald-300")}>
                                        {study.metrics?.missing_pages || 0}
                                    </td>
                                    <td className={cn("p-4 font-mono", (study.metrics?.sae_issues || 0) > 0 ? "text-orange-300" : "text-gray-300")}>
                                        {study.metrics?.sae_issues || 0}
                                    </td>
                                    <td className="p-4">
                                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full",
                                                    (study.metrics?.clean_crf_pct || 0) >= 80 ? "bg-emerald-500" :
                                                    (study.metrics?.clean_crf_pct || 0) >= 60 ? "bg-yellow-500" :
                                                    "bg-red-500"
                                                )}
                                                style={{ width: `${study.metrics?.clean_crf_pct || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500">{(study.metrics?.clean_crf_pct || 0).toFixed(0)}%</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                                            study.risk?.level === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                            study.risk?.level === 'High' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                                            study.risk?.level === 'Medium' ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                                            "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        )}>
                                            {study.risk?.level || 'Unknown'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
