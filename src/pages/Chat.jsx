import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GalaxyBackground from '../components/GalaxyBackground';
import { ArrowLeft, Send, Mic, Brain, Clock, Plus, MessageSquare } from 'lucide-react';
import { useGlobalState } from '../context/GlobalContext';
import PageTransition from '../components/PageTransition';

// --- SIDEBAR COMPONENT ---
const ChatSidebar = ({ isOpen, onClose, onNewChat }) => {
    if (!isOpen) return null;

    const historyItems = [
        { id: 1, title: "Quantum Physics Quiz", date: "2 mins ago" },
        { id: 2, title: "Mars Colonization", date: "Yesterday" },
        { id: 3, title: "French Basics Level 1", date: "Mon" },
        { id: 4, title: "Debugging React 101", date: "Last week" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            ></div>

            {/* Drawer */}
            <div className="relative w-[75%] max-w-sm h-full bg-slate-900/95 border-l border-white/10 shadow-2xl sidebar-enter flex flex-col animate-[slideInRight_0.3s_ease-out]">
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <h2 className="text-xl font-bold font-grotesk text-white">History</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                        <ArrowLeft className="w-6 h-6 rotate-180" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {historyItems.map(item => (
                        <div key={item.id} className="group p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:bg-[#0d9488]/10 hover:border-[#0d9488]/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-3 mb-1">
                                <MessageSquare className="w-4 h-4 text-[#0d9488]" />
                                <h3 className="font-semibold text-sm text-slate-200 group-hover:text-white truncate">{item.title}</h3>
                            </div>
                            <span className="text-xs text-slate-500 pl-7">{item.date}</span>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-white/5 bg-slate-900/50">
                    <button
                        onClick={() => { onNewChat(); onClose(); }}
                        className="w-full py-3.5 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(13,148,136,0.3)] active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Start New Chat
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- CHAT BUBBLES ---
const MessageBubble = ({ text, sender }) => {
    const isBot = sender === 'bot';
    return (
        <div className={`flex w-full mb-6 message-enter ${isBot ? 'justify-start' : 'justify-end'}`}>
            {isBot && (
                <div className="flex-shrink-0 mr-3 mt-1">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#0d9488]/20 border border-[#0d9488]/50 flex items-center justify-center shadow-[0_0_15px_#0d9488]">
                        <Brain className="w-5 h-5 text-[#2dd4bf]" />
                    </div>
                </div>
            )}
            <div className={`
                relative max-w-[75%] px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-lg backdrop-blur-md border
                ${isBot
                    ? 'bg-slate-900/80 border-slate-700 text-slate-200 rounded-tl-none'
                    : 'bg-[#0d9488]/90 border-[#2dd4bf]/30 text-white rounded-tr-none'
                }
            `}>
                {text}
            </div>
        </div>
    );
};

const TypingIndicator = () => (
    <div className="flex w-full mb-6 justify-start message-enter">
        <div className="flex-shrink-0 mr-3 mt-1">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#0d9488]/20 border border-[#0d9488]/50 flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#2dd4bf] animate-pulse" />
            </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-700 px-4 py-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center shadow-lg backdrop-blur-md">
            <div className="w-2 h-2 bg-[#2dd4bf] rounded-full animate-bounce delay-0"></div>
            <div className="w-2 h-2 bg-[#2dd4bf] rounded-full animate-bounce delay-150"></div>
            <div className="w-2 h-2 bg-[#2dd4bf] rounded-full animate-bounce delay-300"></div>
        </div>
    </div>
);

// --- MAIN APP ---
const Chat = () => {
    const { chatMessages, setChatMessages } = useGlobalState();
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [headerText, setHeaderText] = useState("Learnie");
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, isTyping]);

    // Header Text Animation Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setHeaderText(prev => prev === "Learnie" ? "New Chat" : "Learnie");
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const startNewChat = () => {
        setChatMessages([{ id: Date.now(), text: "System rebooted. 🌌 What's the next mission?", sender: 'bot' }]);
        setSidebarOpen(false);
    };

    const generateReply = (userText) => {
        const lower = userText.toLowerCase();
        if (lower.includes("hello") || lower.includes("hi")) return "Hey there! Ready to level up your brain?";
        if (lower.includes("game")) return "Gaming mode activated! 🎮 Give me a subject, and I'll generate a quiz.";
        if (lower.includes("book")) return "I can deconstruct books into byte-sized XP. Upload one later!";
        return "Interesting! Tell me more, I'm analyzing the data... 🧠";
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user' };
        setChatMessages(prev => [...prev, userMsg]);
        setInput("");

        setIsTyping(true);
        const replyText = generateReply(input);
        const delay = Math.min(Math.max(replyText.length * 20, 1000), 3000);

        setTimeout(() => {
            setIsTyping(false);
            setChatMessages(prev => [...prev, { id: Date.now() + 1, text: replyText, sender: 'bot' }]);
        }, delay);
    };

    return (
        <PageTransition>
            <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden">
                <GalaxyBackground />

                <ChatSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onNewChat={startNewChat}
                />

                {/* --- HEADER (FLOATING) --- */}
                <header className="absolute top-0 left-0 w-full h-28 z-30 pointer-events-none flex items-start justify-between px-6 py-6 bg-gradient-to-b from-[#0f172a]/90 to-transparent">

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="pointer-events-auto p-3 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white backdrop-blur-sm border border-transparent hover:border-white/10"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="pointer-events-auto flex flex-col items-center mt-2 cursor-pointer group" onClick={startNewChat}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#0d9488] blur-xl opacity-30 rounded-full animate-glow-red group-hover:opacity-60 transition-opacity"></div>
                            <Brain className="w-10 h-10 text-[#2dd4bf] relative z-10 drop-shadow-[0_0_10px_rgba(45,212,191,0.8)] transition-transform group-hover:rotate-12 group-active:scale-90" />
                        </div>

                        <div className="relative h-4 w-24 mt-2 text-center overflow-hidden">
                            <span
                                key={headerText}
                                className="absolute inset-0 flex items-center justify-center text-[10px] font-grotesk tracking-[0.2em] text-[#2dd4bf] uppercase opacity-90 animate-[pulse_4s_infinite]"
                            >
                                {headerText}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="pointer-events-auto p-3 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white backdrop-blur-sm border border-transparent hover:border-white/10"
                    >
                        <Clock className="w-6 h-6" />
                    </button>
                </header>

                {/* --- CHAT AREA --- */}
                <main className="flex-1 overflow-y-auto p-6 pt-32 pb-4 relative z-10 custom-scrollbar">
                    <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
                        {chatMessages.map(msg => (
                            <MessageBubble key={msg.id} text={msg.text} sender={msg.sender} />
                        ))}
                        {isTyping && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* --- FOOTER --- */}
                <footer className="flex-shrink-0 p-4 md:p-6 relative z-20 bg-slate-900/60 backdrop-blur-xl border-t border-white/5">
                    <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-end gap-3">
                        <button
                            type="button"
                            className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-[#0d9488] hover:border-[#0d9488]/50 hover:bg-[#0d9488]/10 transition-all active:scale-95"
                        >
                            <Mic className="w-6 h-6" />
                        </button>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Learnie anything..."
                                className="w-full h-12 pl-5 pr-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488] transition-all shadow-inner"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className={`
                                flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95
                                ${input.trim()
                                    ? 'bg-[#0d9488] hover:bg-[#0f766e] shadow-[0_0_15px_#0d9488]'
                                    : 'bg-slate-800 border border-slate-700 text-slate-600 cursor-not-allowed'
                                }
                            `}
                        >
                            <Send className={`w-5 h-5 ${input.trim() ? 'translate-x-0.5 translate-y-0.5' : ''}`} />
                        </button>
                    </form>
                </footer>
            </div>
        </PageTransition>
    );
};

export default Chat;
