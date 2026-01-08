"use client";
import { useState } from 'react';
import { useStudies, StudySummary } from '../hooks/useStudies';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileWarning, 
    Activity, 
    Users, 
    ChevronRight, 
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Beaker,
    Code,
    X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface StudyDetailModalProps {
    study: StudySummary;
    onClose: () => void;
}

function StudyDetailModal({ study, onClose }: StudyDetailModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative glass w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/20"
            >
                {/* Header */}
                <div className="sticky top-0 glass p-6 border-b border-white/10 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {study.study_name || study.study_id.split('_')[0]}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {study.total_subjects} subjects • {study.site_summary?.site_count || 0} sites
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Risk & DQI Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={cn(
                            "p-4 rounded-xl border",
                            study.risk?.level === 'Critical' ? "bg-red-500/10 border-red-500/30" :
                            study.risk?.level === 'High' ? "bg-orange-500/10 border-orange-500/30" :
                            study.risk?.level === 'Medium' ? "bg-yellow-500/10 border-yellow-500/30" :
                            "bg-emerald-500/10 border-emerald-500/30"
                        )}>
                            <div className="text-sm text-gray-400 mb-1">Risk Score</div>
                            <div className="text-3xl font-bold text-white">
                                {study.risk?.raw_score?.toFixed(0) || 0}
                            </div>
                            <div className={cn(
                                "text-sm font-medium mt-1",
                                study.risk?.level === 'Critical' ? "text-red-400" :
                                study.risk?.level === 'High' ? "text-orange-400" :
                                study.risk?.level === 'Medium' ? "text-yellow-400" :
                                "text-emerald-400"
                            )}>
                                {study.risk?.level} Risk
                            </div>
                        </div>
                        
                        <div className={cn(
                            "p-4 rounded-xl border",
                            (study.dqi?.score || 0) >= 80 ? "bg-emerald-500/10 border-emerald-500/30" :
                            (study.dqi?.score || 0) >= 60 ? "bg-yellow-500/10 border-yellow-500/30" :
                            "bg-red-500/10 border-red-500/30"
                        )}>
                            <div className="text-sm text-gray-400 mb-1">Data Quality Index</div>
                            <div className="text-3xl font-bold text-white">
                                {study.dqi?.score?.toFixed(1) || 0}%
                            </div>
                            <div className={cn(
                                "text-sm font-medium mt-1",
                                (study.dqi?.score || 0) >= 80 ? "text-emerald-400" :
                                (study.dqi?.score || 0) >= 60 ? "text-yellow-400" :
                                "text-red-400"
                            )}>
                                {study.dqi?.level || 'Unknown'}
                            </div>
                        </div>
                    </div>

                    {/* DQI Components */}
                    {study.dqi?.components && (
                        <div>
                            <h3 className="text-lg font-medium text-white mb-4">DQI Breakdown</h3>
                            <div className="grid grid-cols-5 gap-3">
                                {Object.entries(study.dqi.components).map(([name, data]) => (
                                    <div key={name} className="bg-white/5 rounded-lg p-3">
                                        <div className="text-xs text-gray-400 mb-2">
                                            {name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </div>
                                        <div className={cn(
                                            "text-xl font-bold",
                                            data.score >= 80 ? "text-emerald-400" :
                                            data.score >= 60 ? "text-yellow-400" :
                                            "text-red-400"
                                        )}>
                                            {data.score.toFixed(0)}%
                                        </div>
                                        <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full",
                                                    data.score >= 80 ? "bg-emerald-500" :
                                                    data.score >= 60 ? "bg-yellow-500" :
                                                    "bg-red-500"
                                                )}
                                                style={{ width: `${data.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metrics Grid */}
                    <div>
                        <h3 className="text-lg font-medium text-white mb-4">Key Metrics</h3>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-white/5 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                    <FileWarning className="w-4 h-4" />
                                    Missing Pages
                                </div>
                                <div className={cn(
                                    "text-2xl font-bold",
                                    study.metrics?.missing_pages > 0 ? "text-red-400" : "text-emerald-400"
                                )}>
                                    {study.metrics?.missing_pages || 0}
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    SAE Issues
                                </div>
                                <div className={cn(
                                    "text-2xl font-bold",
                                    study.metrics?.sae_issues > 0 ? "text-orange-400" : "text-emerald-400"
                                )}>
                                    {study.metrics?.sae_issues || 0}
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                    <Clock className="w-4 h-4" />
                                    Overdue Visits
                                </div>
                                <div className={cn(
                                    "text-2xl font-bold",
                                    study.metrics?.overdue_visits > 10 ? "text-yellow-400" : "text-gray-200"
                                )}>
                                    {study.metrics?.overdue_visits || 0}
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                                    <Beaker className="w-4 h-4" />
                                    Lab Issues
                                </div>
                                <div className={cn(
                                    "text-2xl font-bold",
                                    study.metrics?.lab_issues > 0 ? "text-pink-400" : "text-gray-200"
                                )}>
                                    {study.metrics?.lab_issues || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clean Patient Status */}
                    {study.clean_patient_status && (
                        <div>
                            <h3 className="text-lg font-medium text-white mb-4">Patient Status</h3>
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-400">Clean Patients</span>
                                    <span className="text-emerald-400 font-bold">
                                        {study.clean_patient_status.clean} / {study.clean_patient_status.total}
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500"
                                        style={{ width: `${study.clean_patient_status.clean_percentage}%` }}
                                    />
                                </div>
                                <div className="text-sm text-gray-400 mt-2">
                                    {study.clean_patient_status.clean_percentage.toFixed(1)}% clean
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {study.recommendations && study.recommendations.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-white mb-4">Recommendations</h3>
                            <div className="space-y-2">
                                {study.recommendations.map((rec, idx) => (
                                    <div 
                                        key={idx}
                                        className={cn(
                                            "p-3 rounded-lg border",
                                            rec.priority === 'CRITICAL' ? "bg-red-500/10 border-red-500/30" :
                                            rec.priority === 'HIGH' ? "bg-orange-500/10 border-orange-500/30" :
                                            "bg-yellow-500/10 border-yellow-500/30"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className={cn(
                                                    "text-xs font-bold uppercase",
                                                    rec.priority === 'CRITICAL' ? "text-red-400" :
                                                    rec.priority === 'HIGH' ? "text-orange-400" :
                                                    "text-yellow-400"
                                                )}>
                                                    {rec.priority} • {rec.category}
                                                </span>
                                                <p className="text-sm text-white mt-1">{rec.action}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Owner: {rec.owner} • Deadline: {rec.deadline}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function StudyList() {
    const { studies, loading, error } = useStudies();
    const [selectedStudy, setSelectedStudy] = useState<StudySummary | null>(null);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
        </div>
    );

    if (error) return (
        <div className="text-red-400 font-mono text-center p-8 bg-red-900/20 rounded-xl border border-red-500/30">
            {error}
        </div>
    );

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studies.map((study, index) => {
                    const riskColor =
                        study.risk?.level === 'Critical' ? 'border-red-500 shadow-red-500/20' :
                        study.risk?.level === 'High' ? 'border-orange-500 shadow-orange-500/20' :
                        study.risk?.level === 'Medium' ? 'border-yellow-500 shadow-yellow-500/20' : 
                        'border-white/10';

                    const riskBadgeColor =
                        study.risk?.level === 'Critical' ? 'bg-red-500 text-white' :
                        study.risk?.level === 'High' ? 'bg-orange-500 text-white' :
                        study.risk?.level === 'Medium' ? 'bg-yellow-500 text-black' : 
                        'bg-emerald-500 text-white';

                    return (
                        <motion.div
                            key={study.study_id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            onClick={() => setSelectedStudy(study)}
                            className={cn(
                                "glass glass-hover p-6 rounded-2xl relative overflow-hidden group cursor-pointer border transition-all duration-300",
                                riskColor
                            )}
                        >
                            {/* Risk Badge */}
                            <div className={cn("absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider", riskBadgeColor)}>
                                {study.risk?.level || 'Unknown'} Risk
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-xl font-bold text-white tracking-tight truncate w-3/5" title={study.study_id}>
                                        {study.study_name || study.study_id.split('_')[0].replace('Study', 'Study ')}
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-3 rounded-lg">
                                            <div className="text-xs text-gray-400 mb-1">Missing Pages</div>
                                            <div className={cn("text-xl font-mono font-bold", (study.metrics?.missing_pages || 0) > 0 ? "text-red-400" : "text-emerald-400")}>
                                                {study.metrics?.missing_pages || 0}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg">
                                            <div className="text-xs text-gray-400 mb-1">SAE Issues</div>
                                            <div className={cn("text-xl font-mono font-bold", (study.metrics?.sae_issues || 0) > 0 ? "text-orange-400" : "text-gray-200")}>
                                                {study.metrics?.sae_issues || 0}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg">
                                            <div className="text-xs text-gray-400 mb-1">DQI Score</div>
                                            <div className={cn(
                                                "text-xl font-mono font-bold",
                                                (study.dqi?.score || 0) >= 80 ? "text-emerald-400" :
                                                (study.dqi?.score || 0) >= 60 ? "text-yellow-400" :
                                                "text-red-400"
                                            )}>
                                                {study.dqi?.score?.toFixed(0) || 0}%
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-lg">
                                            <div className="text-xs text-gray-400 mb-1">Subjects</div>
                                            <div className="text-xl font-mono font-bold text-blue-400">
                                                {study.total_subjects || 0}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Risk Score Progress */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                                            <span>Risk Score</span>
                                            <span>{study.risk?.raw_score?.toFixed(0) || 0}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-500",
                                                    study.risk?.level === 'Critical' ? "bg-red-500" :
                                                    study.risk?.level === 'High' ? "bg-orange-500" :
                                                    study.risk?.level === 'Medium' ? "bg-yellow-500" : 
                                                    "bg-emerald-500"
                                                )}
                                                style={{ width: `${Math.min((study.risk?.raw_score || 0) / 5, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Click hint */}
                                    <div className="flex items-center justify-end text-xs text-gray-500 group-hover:text-blue-400 transition-colors">
                                        <span>View Details</span>
                                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedStudy && (
                    <StudyDetailModal 
                        study={selectedStudy} 
                        onClose={() => setSelectedStudy(null)} 
                    />
                )}
            </AnimatePresence>
        </>
    );
}
