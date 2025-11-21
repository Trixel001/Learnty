import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GalaxyBackground from '../components/GalaxyBackground';
import { ArrowLeft, Send, Brain, Zap, Trophy } from 'lucide-react';
import { useGlobalState } from '../context/GlobalContext';
import PageTransition from '../components/PageTransition';

const TopicGame = () => {
    const navigate = useNavigate();
    const { topicInput, setTopicInput } = useGlobalState();
    const [input, setInput] = useState('');
    const [stage, setStage] = useState('input');
    const [isGenerating, setIsGenerating] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (stage === 'input' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [stage]);

    const handleGenerate = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        setTopicInput(input);
        setIsGenerating(true);
        
        setTimeout(() => {
            setIsGenerating(false);
            navigate('/game');
        }, 2000);
    };

    return (
        <PageTransition>
            <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden">
                <GalaxyBackground />

                <header className="w-full p-4 md:p-6 flex justify-between items-center z-30">
                    <button onClick={() => navigate('/dashboard')}
                        className="p-2 md:p-3 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white">
                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-[#0d9488]" />
                        <span className="text-sm md:text-base font-bold text-white">Topic to Game</span>
                    </div>
                    <div className="w-10 h-10"></div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-8">
                    {!isGenerating ? (
                        <div className="w-full max-w-lg animate-[fadeIn_0.8s_ease-out]">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#0d9488]/20 border-2 border-[#0d9488] mb-4 md:mb-6">
                                    <Brain className="w-8 h-8 md:w-10 md:h-10 text-[#2dd4bf]" />
                                </div>
                                <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">What do you want to learn?</h1>
                                <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                                    Enter any topic and I'll create an interactive game to help you master it.
                                </p>
                            </div>

                            <form onSubmit={handleGenerate} className="space-y-4">
                                <div className="relative">
                                    <input ref={inputRef} type="text" value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="e.g., Python loops, World War 2, Photosynthesis..."
                                        className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/50 transition-all" />
                                </div>

                                <button type="submit" disabled={!input.trim()}
                                    className={`w-full py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all ${
                                        input.trim()
                                            ? 'bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-[0_0_20px_rgba(13,148,136,0.3)] active:scale-95'
                                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                    }`}>
                                    <span className="flex items-center justify-center gap-2">
                                        Generate Game
                                        <Send className="w-5 h-5" />
                                    </span>
                                </button>
                            </form>

                            <div className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                                <div className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1">Pro Tip</h3>
                                        <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                                            Be specific! "Functions in Python" works better than just "Python".
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center animate-[pop_0.6s_ease-out]">
                            <div className="relative mb-8">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#0d9488]/30 border-t-[#0d9488] animate-spin"></div>
                                <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 text-[#2dd4bf] animate-pulse" />
                            </div>
                            <h2 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3">Generating Your Game...</h2>
                            <p className="text-sm md:text-base text-slate-400">Building personalized questions</p>
                        </div>
                    )}
                </main>
            </div>
        </PageTransition>
    );
};

export default TopicGame;
