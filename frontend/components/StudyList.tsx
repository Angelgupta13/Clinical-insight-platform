"use client";
import { useStudies } from '../hooks/useStudies';
import { motion } from 'framer-motion';
import { FileWarning, Activity, Users, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StudyList() {
    const { studies, loading, error } = useStudies();

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
        </div>
    );

    if (error) return <div className="text-red-400 font-mono text-center p-8 bg-red-900/20 rounded-xl border border-red-500/30">{error}</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studies.map((study, index) => {
                const riskColor =
                    study.risk.level === 'Critical' ? 'border-red-500 shadow-red-500/20' :
                        study.risk.level === 'High' ? 'border-orange-500 shadow-orange-500/20' :
                            study.risk.level === 'Medium' ? 'border-yellow-500 shadow-yellow-500/20' : 'border-white/10';

                const riskBadgeColor =
                    study.risk.level === 'Critical' ? 'bg-red-500 text-white' :
                        study.risk.level === 'High' ? 'bg-orange-500 text-white' :
                            study.risk.level === 'Medium' ? 'bg-yellow-500 text-black' : 'bg-emerald-500 text-white';

                return (
                    <motion.div
                        key={study.study_id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={cn(
                            "glass glass-hover p-6 rounded-2xl relative overflow-hidden group cursor-pointer border transition-all duration-300",
                            riskColor
                        )}
                    >
                        {/* Risk Badge */}
                        <div className={cn("absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider", riskBadgeColor)}>
                            {study.risk.level} Risk
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-bold text-white tracking-tight truncate w-3/5" title={study.study_id}>
                                    {study.study_id.split('_')[0].replace('Study', 'Study ')}
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <div className="text-xs text-gray-400 mb-1">Missing Pages</div>
                                        <div className={cn("text-xl font-mono font-bold", study.metrics.missing_pages > 0 ? "text-red-400" : "text-emerald-400")}>
                                            {study.metrics.missing_pages}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <div className="text-xs text-gray-400 mb-1">SAE Issues</div>
                                        <div className={cn("text-xl font-mono font-bold", study.metrics.sae_issues > 0 ? "text-orange-400" : "text-gray-200")}>
                                            {study.metrics.sae_issues}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <div className="text-xs text-gray-400 mb-1">Overdue Visits</div>
                                        <div className={cn("text-xl font-mono font-bold", study.metrics.overdue_visits > 10 ? "text-yellow-400" : "text-gray-200")}>
                                            {study.metrics.overdue_visits}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <div className="text-xs text-gray-400 mb-1">Lab Issues</div>
                                        <div className={cn("text-xl font-mono font-bold", study.metrics.lab_issues > 0 ? "text-pink-400" : "text-gray-200")}>
                                            {study.metrics.lab_issues}
                                        </div>
                                    </div>
                                </div>

                                {/* Risk Score Progress */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                                        <span>Risk Score</span>
                                        <span>{study.risk.score}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-500",
                                                study.risk.level === 'Critical' ? "bg-red-500" :
                                                    study.risk.level === 'High' ? "bg-orange-500" :
                                                        study.risk.level === 'Medium' ? "bg-yellow-500" : "bg-emerald-500"
                                            )}
                                            style={{ width: `${Math.min((study.risk.score / 500) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    );
}
