"use client";
import { useState } from 'react';
import { useAlerts, Alert } from '../hooks/useStudies';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, 
    AlertTriangle, 
    AlertCircle, 
    Info, 
    Check, 
    X, 
    Filter,
    Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

interface AlertItemProps {
    alert: Alert;
    onAcknowledge: (id: string) => void;
}

function AlertItem({ alert, onAcknowledge }: AlertItemProps) {
    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'critical':
                return {
                    bg: 'bg-red-500/10 border-red-500/30',
                    icon: AlertTriangle,
                    iconColor: 'text-red-400',
                    badge: 'bg-red-500/20 text-red-400'
                };
            case 'warning':
                return {
                    bg: 'bg-orange-500/10 border-orange-500/30',
                    icon: AlertCircle,
                    iconColor: 'text-orange-400',
                    badge: 'bg-orange-500/20 text-orange-400'
                };
            default:
                return {
                    bg: 'bg-blue-500/10 border-blue-500/30',
                    icon: Info,
                    iconColor: 'text-blue-400',
                    badge: 'bg-blue-500/20 text-blue-400'
                };
        }
    };

    const styles = getTypeStyles(alert.type);
    const Icon = styles.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
                "p-4 rounded-xl border transition-all",
                styles.bg,
                alert.read && "opacity-60"
            )}
        >
            <div className="flex gap-3">
                <div className={cn("p-2 rounded-lg bg-white/5", styles.iconColor)}>
                    <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-white truncate">
                            {alert.title}
                        </h4>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full uppercase font-medium", styles.badge)}>
                            {alert.type}
                        </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(alert.created_at)}
                            </span>
                            {alert.study_id && (
                                <span className="bg-white/5 px-2 py-0.5 rounded">
                                    {alert.study_id.split('_')[0]}
                                </span>
                            )}
                        </div>
                        
                        {!alert.read && (
                            <button
                                onClick={() => onAcknowledge(alert.id)}
                                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                <Check className="w-3 h-3" />
                                Acknowledge
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function AlertsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
    const { alerts, unreadCount, loading, acknowledgeAlert, refetch } = useAlerts({
        alertType: filter === 'all' ? undefined : filter
    });

    const totalUnread = unreadCount.total || 0;

    return (
        <>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 left-6 z-50 p-4 rounded-full shadow-lg transition-colors",
                    totalUnread > 0 
                        ? "bg-red-600 hover:bg-red-500 shadow-red-500/50" 
                        : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/50"
                )}
            >
                <Bell className="w-6 h-6 text-white" />
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-white text-red-600 text-xs font-bold rounded-full flex items-center justify-center">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />
                        
                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: -300 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -300 }}
                            className="fixed left-0 top-0 bottom-0 w-full max-w-md glass border-r border-white/10 z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Bell className="w-5 h-5" />
                                        Alerts
                                        {totalUnread > 0 && (
                                            <span className="text-sm bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                                {totalUnread} unread
                                            </span>
                                        )}
                                    </h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                                
                                {/* Filter Tabs */}
                                <div className="flex gap-2">
                                    {(['all', 'critical', 'warning', 'info'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFilter(type)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
                                                filter === type
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                                            )}
                                        >
                                            {type}
                                            {type !== 'all' && unreadCount[type] > 0 && (
                                                <span className="ml-1.5 text-xs">
                                                    ({unreadCount[type]})
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Alert List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400" />
                                    </div>
                                ) : alerts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-400">No alerts</p>
                                        <p className="text-sm text-gray-500">
                                            You're all caught up!
                                        </p>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {alerts.map((alert) => (
                                            <AlertItem
                                                key={alert.id}
                                                alert={alert}
                                                onAcknowledge={acknowledgeAlert}
                                            />
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/10">
                                <button
                                    onClick={refetch}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-400 transition-colors"
                                >
                                    Refresh Alerts
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
