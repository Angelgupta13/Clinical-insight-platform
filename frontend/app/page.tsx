import StudyList from "../components/StudyList";
import ChatInterface from "../components/ChatInterface";
import QualityReportView from '../components/QualityReportView';
import RiskHeatmap from '../components/RiskHeatmap';
import DataQualityIndex from '../components/DataQualityIndex';
import AlertsPanel from '../components/AlertsPanel';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-background text-white">
            {/* Header */}
            <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex mb-12">
                <div className="fixed left-0 top-0 flex w-full justify-center border-b border-white/10 bg-black/20 backdrop-blur-2xl py-4 lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-white/5 lg:p-4">
                    <code className="font-mono font-bold text-white/80">Clinical Insight Platform v2.0</code>
                </div>
                <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-black via-black/80 lg:static lg:h-auto lg:w-auto lg:bg-none">
                    <div className="flex gap-2 p-4">
                        <div className="w-3 h-3 rounded-full bg-red-500/50 animate-pulse" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50 animate-pulse delay-75" />
                        <div className="w-3 h-3 rounded-full bg-blue-500/50 animate-pulse delay-150" />
                        <span className="text-white/40 text-xs ml-2">System Active</span>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative flex place-items-center mb-16">
                <div className="absolute -z-10 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
                <div className="text-center">
                    <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-white to-purple-400 pb-4 tracking-tighter drop-shadow-2xl">
                        Insight Flow
                    </h1>
                    <p className="text-lg text-blue-200/60 font-light tracking-wide max-w-2xl mx-auto">
                        Next-generation harmonization for clinical trial data.
                        Real-time operational metrics meets Agentic Intelligence.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="mb-32 w-full max-w-7xl px-4 lg:mb-0 lg:text-left">
                {/* Data Quality Index - New Feature */}
                <DataQualityIndex />

                {/* Quality Report View */}
                <QualityReportView />

                {/* Risk Heatmap - Now visible */}
                <RiskHeatmap />

                {/* Active Studies Section */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
                    <h2 className="text-2xl font-light tracking-widest text-white/60 uppercase">Active Studies</h2>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
                </div>
                <StudyList />
            </div>

            {/* Floating Components */}
            <ChatInterface />
            <AlertsPanel />
        </main>
    );
}
