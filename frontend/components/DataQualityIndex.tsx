"use client";
import { useDQI } from '../hooks/useStudies';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface DQIComponentCardProps {
    name: string;
    score: number;
    weight: number;
}

function DQIComponentCard({ name, score, weight }: DQIComponentCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getProgressColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const formatName = (name: string) => {
        return name.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-gray-400">{formatName(name)}</span>
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-gray-400">
                    {Math.round(weight * 100)}%
                </span>
            </div>
            <div className={cn("text-2xl font-bold mb-2", getScoreColor(score))}>
                {score.toFixed(1)}%
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={cn("h-full rounded-full", getProgressColor(score))}
                />
            </div>
        </div>
    );
}

interface CircularProgressProps {
    value: number;
    size?: number;
    strokeWidth?: number;
}

function CircularProgress({ value, size = 160, strokeWidth = 12 }: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    const getColor = (value: number) => {
        if (value >= 80) return '#10b981'; // emerald-500
        if (value >= 60) return '#f59e0b'; // amber-500
        if (value >= 40) return '#f97316'; // orange-500
        return '#ef4444'; // red-500
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getColor(value)}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{value.toFixed(0)}</span>
                <span className="text-sm text-gray-400">DQI Score</span>
            </div>
        </div>
    );
}

export default function DataQualityIndex() {
    const { dqiData, loading, error } = useDQI();

    if (loading) {
        return (
            <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-400" />
                </div>
            </div>
        );
    }

    if (error || !dqiData) {
        return (
            <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="text-red-400 text-center">Failed to load DQI data</div>
            </div>
        );
    }

    const avgDQI = dqiData.average_dqi || 0;
    const lowestStudies = dqiData.lowest_dqi_studies || [];
    const highestStudies = dqiData.highest_dqi_studies || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-white/10 mb-8"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-400" />
                        Data Quality Index
                    </h2>
                    <p className="text-sm text-gray-400">
                        Portfolio-wide data quality score across {dqiData.studies?.length || 0} studies
                    </p>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium",
                    avgDQI >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                    avgDQI >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                )}>
                    {avgDQI >= 80 ? "Excellent" : avgDQI >= 60 ? "Good" : avgDQI >= 40 ? "Fair" : "Needs Attention"}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Circular Progress */}
                <div className="flex flex-col items-center justify-center">
                    <CircularProgress value={avgDQI} />
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-400">Portfolio Average</p>
                        <p className={cn(
                            "text-lg font-medium",
                            avgDQI >= 80 ? "text-emerald-400" : avgDQI >= 60 ? "text-yellow-400" : "text-red-400"
                        )}>
                            {avgDQI.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Lowest Scoring Studies */}
                <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        Needs Attention
                    </h3>
                    <div className="space-y-2">
                        {lowestStudies.slice(0, 4).map((study: any) => (
                            <div
                                key={study.study_id}
                                className="flex items-center justify-between bg-red-500/10 rounded-lg p-3 border border-red-500/20"
                            >
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                    <span className="text-sm text-white truncate max-w-[120px]">
                                        {study.study_name || study.study_id.split('_')[0]}
                                    </span>
                                </div>
                                <span className={cn(
                                    "text-sm font-mono font-bold",
                                    study.dqi_score >= 60 ? "text-yellow-400" : "text-red-400"
                                )}>
                                    {study.dqi_score?.toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Highest Scoring Studies */}
                <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Top Performers
                    </h3>
                    <div className="space-y-2">
                        {highestStudies.slice(0, 4).map((study: any) => (
                            <div
                                key={study.study_id}
                                className="flex items-center justify-between bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20"
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-white truncate max-w-[120px]">
                                        {study.study_name || study.study_id.split('_')[0]}
                                    </span>
                                </div>
                                <span className="text-sm font-mono font-bold text-emerald-400">
                                    {study.dqi_score?.toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DQI Component Breakdown */}
            {lowestStudies[0]?.components && (
                <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">
                        Component Weights (Applied to All Studies)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(lowestStudies[0].components).map(([name, data]: [string, any]) => (
                            <div key={name} className="bg-white/5 rounded-lg p-3 text-center">
                                <div className="text-xs text-gray-400 mb-1">
                                    {name.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </div>
                                <div className="text-lg font-bold text-blue-400">
                                    {Math.round(data.weight * 100)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
