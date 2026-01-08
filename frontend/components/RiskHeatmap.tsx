"use client";
import { useStudies } from '../hooks/useStudies';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useState } from 'react';

export default function RiskHeatmap() {
    const { studies, loading } = useStudies();
    const [hoveredStudy, setHoveredStudy] = useState<string | null>(null);

    if (loading) return null;

    // Sort by risk so the "hottest" items are top-left or handled visually
    const sortedStudies = [...studies].sort((a, b) => b.risk.score - a.risk.score);

    return (
        <div className="w-full p-6 glass rounded-2xl border border-white/10 mb-8">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Portfolio Risk Heatmap</h2>
                    <p className="text-sm text-gray-400">Real-time risk distribution across {studies.length} active studies.</p>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded"></div> Low</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded"></div> Medium</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-500 rounded"></div> High</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded"></div> Critical</div>
                </div>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {sortedStudies.map((study, i) => {
                    const color =
                        study.risk.level === 'Critical' ? 'bg-red-500' :
                            study.risk.level === 'High' ? 'bg-orange-500' :
                                study.risk.level === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500/50';

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
                                "border border-white/5 hover:border-white/50 hover:shadow-lg hover:shadow-white/10"
                            )}
                        >
                            {/* Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 text-white text-xs px-2 py-1 rounded border border-white/20 pointer-events-none z-20 transition-opacity">
                                <div className="font-bold">{study.study_id}</div>
                                <div>Score: {study.risk.score}</div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
}
