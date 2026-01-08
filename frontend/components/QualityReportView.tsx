"use client";
import { useStudies } from '../hooks/useStudies';
import { motion } from 'framer-motion';
import { Download, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

export default function QualityReportView() {
    const { studies, loading } = useStudies();

    if (loading) return (
        <div className="w-full h-64 flex items-center justify-center text-white/50">
            Generating Quality Report...
        </div>
    );

    const criticalRisks = studies.filter(s => s.risk.level === 'Critical' || s.risk.level === 'High').length;
    const totalIssues = studies.reduce((acc, s) => acc + s.metrics.missing_pages + s.metrics.sae_issues, 0);

    return (
        <div className="w-full space-y-6 mb-12">
            {/* Executive Summary Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-6 rounded-xl border-l-4 border-blue-500">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Active Studies</h3>
                    <div className="text-3xl font-bold text-white mt-1">{studies.length}</div>
                </div>
                <div className="glass p-6 rounded-xl border-l-4 border-red-500">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Critical Risk Alerts</h3>
                    <div className="text-3xl font-bold text-red-400 mt-1">{criticalRisks}</div>
                </div>
                <div className="glass p-6 rounded-xl border-l-4 border-orange-500">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Open Data Queries</h3>
                    <div className="text-3xl font-bold text-orange-400 mt-1">{totalIssues}</div>
                </div>
            </div>

            {/* Report Actions */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-light text-white">
                    <FileText className="inline-block w-6 h-6 mr-2 text-blue-400" />
                    Quality Assurance Report
                </h2>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                    <Download className="w-4 h-4" />
                    Export PDF
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
                                <th className="p-4">Missing Pages</th>
                                <th className="p-4">SAE Issues</th>
                                <th className="p-4">Visit Adherence</th>
                                <th className="p-4">Risk Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {studies.map((study) => (
                                <tr key={study.study_id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                    <td className="p-4 font-medium text-white group-hover:text-blue-300 transition-colors">
                                        {study.study_id.split('_')[0]}
                                    </td>
                                    <td className="p-4 font-mono">{study.total_subjects}</td>
                                    <td className={cn("p-4 font-mono", study.metrics.missing_pages > 0 ? "text-red-300" : "text-emerald-300")}>
                                        {study.metrics.missing_pages}
                                    </td>
                                    <td className="p-4 font-mono">{study.metrics.sae_issues}</td>
                                    <td className="p-4">
                                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full", study.metrics.overdue_visits > 5 ? "bg-red-500" : "bg-emerald-500")}
                                                style={{ width: `${Math.max(10, 100 - (study.metrics.overdue_visits * 2))}%` }}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                                            study.risk.level === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                                study.risk.level === 'High' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                                                    study.risk.level === 'Medium' ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                                                        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        )}>
                                            {study.risk.level}
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
