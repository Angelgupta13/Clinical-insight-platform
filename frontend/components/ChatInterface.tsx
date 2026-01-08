"use client";
import { useState, useRef, useEffect } from 'react';
import { useAgent } from '../hooks/useStudies';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, 
    Send, 
    X, 
    MessageSquare, 
    Minimize2, 
    Maximize2,
    Trash2,
    Copy,
    Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function ChatInterface() {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm your Clinical Data Analyst. I can analyze risks, DQI scores, find outliers, or detail specific study performance. Try asking:\n\n- \"Which study is at highest risk?\"\n- \"Show me the DQI scores\"\n- \"What are the recommendations for Study 15?\"\n- \"Give me a portfolio summary\"",
            timestamp: new Date()
        }
    ]);
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { loading, askAgent } = useAgent();

    const handleAsk = async () => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || loading) return;

        // Add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmedQuery,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');

        // Get AI response
        const response = await askAgent(trimmedQuery);
        
        const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
    };

    const handleCopy = async (content: string, id: string) => {
        await navigator.clipboard.writeText(content);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleClearChat = () => {
        setMessages([{
            id: 'welcome-new',
            role: 'assistant',
            content: "Chat cleared. How can I help you analyze your clinical data?",
            timestamp: new Date()
        }]);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const suggestedQueries = [
        "Which study is at highest risk?",
        "Show me DQI scores",
        "Portfolio summary",
        "Recommendations"
    ];

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
                        className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white p-4 rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center group"
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
                        className="glass w-[450px] h-[600px] rounded-3xl flex flex-col overflow-hidden shadow-2xl ring-1 ring-white/20"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-600/80 to-violet-600/80 backdrop-blur-md flex justify-between items-center">
                            <div className="flex items-center gap-2 text-white">
                                <Sparkles className="w-5 h-5 fill-yellow-300 stroke-yellow-300" />
                                <span className="font-bold tracking-wide">Insight Agent</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">AI</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleClearChat}
                                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Clear chat"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <Minimize2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-3",
                                        message.role === 'user' && "flex-row-reverse"
                                    )}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                                            <Sparkles className="w-4 h-4 text-blue-300" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "relative group max-w-[85%]",
                                        message.role === 'user' 
                                            ? "bg-blue-600/30 rounded-2xl rounded-tr-none" 
                                            : "glass rounded-2xl rounded-tl-none"
                                    )}>
                                        <div className="p-3 text-sm text-gray-100">
                                            {message.role === 'assistant' ? (
                                                <div className="prose prose-invert prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-4 prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-table:text-xs">
                                                    <ReactMarkdown>
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <span>{message.content}</span>
                                            )}
                                        </div>
                                        {message.role === 'assistant' && message.id !== 'welcome' && (
                                            <button
                                                onClick={() => handleCopy(message.content, message.id)}
                                                className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 bg-white/10 rounded transition-opacity"
                                                title="Copy"
                                            >
                                                {copied === message.id ? (
                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-3 h-3 text-gray-400" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0">
                                            <MessageSquare className="w-4 h-4 text-blue-300" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                                        <Sparkles className="w-4 h-4 text-blue-300 animate-pulse" />
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

                        {/* Suggested Queries */}
                        {messages.length <= 2 && (
                            <div className="px-4 py-2 border-t border-white/5">
                                <div className="flex flex-wrap gap-2">
                                    {suggestedQueries.map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => {
                                                setQuery(q);
                                                inputRef.current?.focus();
                                            }}
                                            className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 bg-white/5 border-t border-white/10">
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                                    placeholder="Ask about your clinical data..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-light"
                                    disabled={loading}
                                />
                                <button
                                    onClick={handleAsk}
                                    disabled={loading || !query.trim()}
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
