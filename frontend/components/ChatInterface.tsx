"use client";
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, MessageSquare, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ChatInterface() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleAsk = async () => {
        if (!query.trim()) return;
        setLoading(true);
        // keep previous response visible while loading new one
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await axios.get(`${apiUrl}/api/agent?query=${encodeURIComponent(query)}`);
            setResponse(res.data.response);
        } catch (e) {
            setResponse("I'm having trouble connecting to the data source right now.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [response, loading]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center group"
                    >
                        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="glass w-[400px] h-[500px] rounded-3xl flex flex-col overflow-hidden shadow-2xl ring-1 ring-white/20"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-600/80 to-violet-600/80 backdrop-blur-md flex justify-between items-center cursor-move">
                            <div className="flex items-center gap-2 text-white">
                                <Sparkles className="w-5 h-5 fill-yellow-300 stroke-yellow-300" />
                                <span className="font-bold tracking-wide">Insight Agent</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                <Minimize2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-blue-300" />
                                </div>
                                <div className="glass p-3 rounded-2xl rounded-tl-none text-sm text-gray-200">
                                    Hello! I analyzing 23 clinical studies. Ask me about outliers, missing pages, or safety events.
                                </div>
                            </div>

                            {response && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <Sparkles className="w-4 h-4 text-blue-300" />
                                    </div>
                                    <div className="glass p-3 rounded-2xl rounded-tl-none text-sm text-gray-100 whitespace-pre-wrap">
                                        {response}
                                    </div>
                                </motion.div>
                            )}

                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <Sparkles className="w-4 h-4 text-blue-300" />
                                    </div>
                                    <div className="glass p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white/5 border-t border-white/10">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                    placeholder="Ask a question..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-light"
                                />
                                <button
                                    onClick={handleAsk}
                                    disabled={loading}
                                    className="absolute right-2 top-2 p-1.5 bg-blue-600 rounded-lg text-white disabled:opacity-50 hover:bg-blue-500 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
