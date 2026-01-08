"use client";
import { useStudies, StudySummary } from '../hooks/useStudies';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { Flame, TrendingDown, AlertTriangle } from 'lucide-react';

export default function RiskHeatmap() {
    const { studies, loading } = useStudies();
    const [hoveredStudy, setHoveredStudy] = useState<string | null>(null);

    if (loading) return (
        <div className="w-full p-6 glass rounded-2xl border border-white/10 mb-8">
            <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400" />
            </div>
        </div>
    );

    if (!studies || studies.length === 0) return null;

    // Sort by risk so the "hottest" items are first
    const sortedStudies = [...studies].sort((a, b) => 
        (b.risk?.raw_score || 0) - (a.risk?.raw_score || 0)
    );

    // Calculate statistics
    const criticalCount = studies.filter(s => s.risk?.level === 'Critical').length;
    const highCount = studies.filter(s => s.risk?.level === 'High').length;
    const avgRisk = studies.reduce((acc, s) => acc + (s.risk?.raw_score || 0), 0) / studies.length;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-6 glass rounded-2xl border border-white/10 mb-8"
        >
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <Flame className="w-6 h-6 text-orange-400" />
                        Portfolio Risk Heatmap
                    </h2>
                    <p className="text-sm text-gray-400">
                        Real-time risk distribution across {studies.length} active studies
                    </p>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500/50 rounded"></div> 
                        <span className="text-gray-400">Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div> 
                        <span className="text-gray-400">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded"></div> 
                        <span className="text-gray-400">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div> 
                        <span className="text-gray-400">Critical</span>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        Critical Studies
                    </div>
                    <div className="text-2xl font-bold text-white">{criticalCount}</div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-orange-400 text-sm mb-1">
                        <TrendingDown className="w-4 h-4" />
                        High Risk
                    </div>
                    <div className="text-2xl font-bold text-white">{highCount}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="text-gray-400 text-sm mb-1">Avg Risk Score</div>
                    <div className="text-2xl font-bold text-white">{avgRisk.toFixed(0)}</div>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {sortedStudies.map((study, i) => {
                    const color =
                        study.risk?.level === 'Critical' ? 'bg-red-500' :
                        study.risk?.level === 'High' ? 'bg-orange-500' :
                        study.risk?.level === 'Medium' ? 'bg-yellow-500' : 
                        'bg-emerald-500/50';

                    const hoverGlow =
                        study.risk?.level === 'Critical' ? 'hover:shadow-red-500/50' :
                        study.risk?.level === 'High' ? 'hover:shadow-orange-500/50' :
                        study.risk?.level === 'Medium' ? 'hover:shadow-yellow-500/50' : 
                        'hover:shadow-emerald-500/50';

                    return (
                        <motion.div
                            key={study.study_id}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.02 }}
                            onHoverStart={() => setHoveredStudy(study.study_id)}
                            onHoverEnd={() => setHoveredStudy(null)}
                            className={cn(
                                "aspect-square rounded-lg cursor-pointer relative group transition-all duration-300 hover:scale-110 hover:z-10",
                                color,
                                "border border-white/5 hover:border-white/50 hover:shadow-lg",
                                hoverGlow
                            )}
                        >
                            {/* Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-20 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/95 text-white text-xs p-3 rounded-lg border border-white/20 pointer-events-none z-20 transition-opacity">
                                <div className="font-bold text-sm mb-1">
                                    {study.study_name || study.study_id.split('_')[0]}
                                </div>
                                <div className="flex gap-4 text-gray-300">
                                    <span>Risk: <span className="text-white font-mono">{study.risk?.raw_score?.toFixed(0) || 0}</span></span>
                                    <span>DQI: <span className="text-white font-mono">{study.dqi?.score?.toFixed(0) || 0}%</span></span>
                                </div>
                                <div className="text-gray-400 mt-1">
                                    {study.total_subjects || 0} subjects
                                </div>
                                {/* Arrow */}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/95 border-r border-b border-white/20 transform rotate-45" />
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Top Risk Studies List */}
            <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Top Risk Studies Requiring Attention</h3>
                <div className="flex flex-wrap gap-2">
                    {sortedStudies.slice(0, 5).map(study => (
                        <div 
                            key={study.study_id}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2",
                                study.risk?.level === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                study.risk?.level === 'High' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                                "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            )}
                        >
                            <span>{study.study_name || study.study_id.split('_')[0]}</span>
                            <span className="text-xs opacity-70">({study.risk?.raw_score?.toFixed(0) || 0})</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
