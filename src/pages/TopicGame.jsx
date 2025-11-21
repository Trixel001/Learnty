import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GalaxyBackground from '../components/GalaxyBackground';
import { ArrowLeft, Sparkles, Search, Clock, Lock, Unlock } from 'lucide-react';
import { useGlobalState } from '../context/GlobalContext';
import PageTransition from '../components/PageTransition';

const InputView = ({ onGenerate }) => {
    const [topic, setTopic] = useState("");
    const [depth, setDepth] = useState("standard");
    const suggestions = ["Rocket Science", "Medieval History", "Python Basics", "Jazz Theory"];

    const depthOptions = [
        { id: 'quick', label: 'Quick Skim', time: '~15m' },
        { id: 'standard', label: 'Core Quest', time: '~45m' },
        { id: 'deep', label: 'Deep Dive', time: '~2h+' },
    ];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 relative z-10 animate-[fadeIn_0.5s] overflow-y-auto">
            <div className="w-full md:w-[90%] max-w-[600px] bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group my-auto">
                <div className="w-12 h-12 md:w-20 md:h-20 bg-[#0d9488]/10 rounded-full flex items-center justify-center mb-4 md:mb-6 animate-bounce">
                    <Sparkles className="w-6 h-6 md:w-10 md:h-10 text-[#2dd4bf] drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                </div>

                <h1 className="text-xl md:text-4xl font-bold font-grotesk mb-2 text-white">
                    What do you want to <span className="text-[#2dd4bf]">master</span> today?
                </h1>
                <p className="text-slate-400 mb-4 md:mb-8 text-xs md:text-base max-w-[90%] md:max-w-[80%]">
                    Learnty transforms any topic into an active learning quest.
                </p>

                <div className="w-full relative mb-4 md:mb-6 group-focus-within:scale-[1.02] transition-transform duration-300">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Astrophysics..."
                        className="w-full py-3 md:py-4 pl-10 md:pl-12 pr-4 bg-slate-800/60 border border-slate-600 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/50 transition-all shadow-inner text-sm md:text-lg"
                    />
                </div>

                <div className="w-full mb-4 md:mb-6">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 md:mb-3 block text-left ml-1">Select Quest Depth</label>
                    <div className="grid grid-cols-3 gap-2 md:gap-3 bg-slate-950/50 p-1.5 rounded-xl border border-white/5">
                        {depthOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setDepth(opt.id)}
                                className={`
                                    relative py-2.5 rounded-lg text-[10px] md:text-sm font-medium transition-all active:scale-95
                                    ${depth === opt.id
                                        ? 'bg-[#0d9488] text-white shadow-lg'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                    }
                                `}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center justify-end mt-2 gap-1.5 text-[10px] md:text-xs font-mono text-[#2dd4bf]">
                        <Clock className="w-3 h-3" />
                        <span>Est. Playtime: {depthOptions.find(d => d.id === depth).time}</span>
                    </div>
                </div>

                <button
                    onClick={() => topic.trim() && onGenerate(topic, depth)}
                    disabled={!topic.trim()}
                    className={`
                        w-full py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all transform active:scale-95
                        ${topic.trim()
                            ? 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white shadow-[0_0_20px_rgba(13,148,136,0.4)] hover:shadow-[0_0_30px_rgba(13,148,136,0.6)]'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }
                    `}
                >
                    Generate Learning Quest
                </button>

                <div className="mt-4 md:mt-8 flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => setTopic(s)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] md:text-xs text-slate-300 transition-colors active:scale-95"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const GeneratingView = ({ topic, depth, onComplete }) => {
    const [progressSteps, setProgressSteps] = useState([]);
    const [statusText, setStatusText] = useState("INITIALIZING LINK...");

    const depthSettings = {
        'quick': { count: 2, time: '~15m' },
        'standard': { count: 4, time: '~45m' },
        'deep': { count: 6, time: '~2h+' }
    };
    const config = depthSettings[depth] || depthSettings['standard'];

    useEffect(() => {
        let step = 0;
        const maxSteps = config.count;

        const timer = setInterval(() => {
            if (step >= maxSteps) {
                clearInterval(timer);
                setStatusText("READY TO LAUNCH");
                onComplete(progressSteps); // Signal completion
                return;
            }

            const isBoss = step === maxSteps - 1;
            const newItem = {
                id: step + 1,
                title: isBoss ? "Final Boss: The Mastery Exam" : `Module ${step + 1}: ${topic} Basics`,
                type: isBoss ? 'boss' : 'module'
            };

            setProgressSteps(prev => [...prev, newItem]);

            if(step === 0) setStatusText("DECONSTRUCTING TOPIC...");
            else if(step === 1) setStatusText("GAMIFYING DATA...");
            else if(step === 2) setStatusText("CRAFTING CHALLENGES...");
            else setStatusText("FINALIZING QUEST...");

            step++;
        }, 1200);

        return () => clearInterval(timer);
    }, [topic, config.count]);

    return (
        <div className="w-full h-full flex flex-col items-center pt-8 md:pt-12 pb-6 px-4 relative z-10">
            <div className="text-center mb-6 md:mb-10 relative">
                <h2
                    className="text-lg md:text-2xl font-bold font-grotesk tracking-widest uppercase mb-2 glitch-text"
                    data-text={statusText}
                >
                    {statusText}
                </h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 text-xs font-mono">
                    <Clock className="w-3 h-3 text-[#2dd4bf]" />
                    <span>Estimated Time: <span className="text-white">{config.time}</span></span>
                </div>
            </div>

            <div className="w-full max-w-[90%] md:max-w-md flex-1 overflow-y-auto custom-scrollbar relative pl-4">
                {/* Updated Timeline Logic: Flex-based to remove magic numbers */}
                <div className="relative flex flex-col gap-6 md:gap-8">
                    {progressSteps.map((step, index) => {
                        const isLast = index === progressSteps.length - 1;
                        const isBoss = step.type === 'boss';

                        return (
                            <div key={step.id} className="flex gap-4 md:gap-6 group animate-[pop_0.5s_cubic-bezier(0.17,0.67,0.83,0.67)]">
                                {/* Column 1: Icon + Line */}
                                <div className="flex flex-col items-center relative shrink-0">
                                    <div className={`
                                        relative z-10 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border-2 shadow-xl transition-all duration-500 shrink-0
                                        ${isBoss
                                            ? 'bg-red-900/80 border-red-500 text-red-200 scale-110'
                                            : 'bg-slate-900/90 border-[#0d9488] text-[#2dd4bf]'
                                        }
                                        ${isLast ? 'animate-glow-red' : ''}
                                    `}>
                                        {isBoss ? <Sparkles className="w-6 h-6 md:w-8 md:h-8" /> : <Unlock className="w-5 h-5 md:w-6 md:h-6" />}
                                    </div>

                                    {/* Connector Line - connects to next item or fades out */}
                                    {!isLast && (
                                        <div className="w-1 bg-[#0d9488] shadow-[0_0_10px_#0d9488] flex-1 min-h-[2rem] mt-[-4px] mb-[-4px] relative z-0"></div>
                                    )}
                                </div>

                                {/* Column 2: Content */}
                                <div className="flex-1 bg-slate-900/60 backdrop-blur border border-white/10 p-3 md:p-4 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] self-start">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[9px] md:text-[10px] font-bold tracking-wider uppercase ${isBoss ? 'text-red-400' : 'text-[#2dd4bf]'}`}>
                                            {isBoss ? 'Final Stage' : `Level 0${step.id}`}
                                        </span>
                                        <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] text-slate-300">
                                            {isBoss ? '1000 XP' : '250 XP'}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-bold text-sm md:text-lg leading-tight">{step.title}</h3>
                                </div>
                            </div>
                        );
                    })}

                    {/* Decrypting State */}
                    {progressSteps.length < config.count && (
                        <div className="flex gap-4 md:gap-6 opacity-50">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center animate-spin shrink-0"></div>
                            <div className="mt-3 text-slate-600 text-sm font-mono animate-pulse">Decrypting...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TopicGame = () => {
    const navigate = useNavigate();
    const { topicRoadmap, setTopicRoadmap, topicStatus, setTopicStatus } = useGlobalState();

    // Determine initial view based on if we have a roadmap
    const [view, setView] = useState(topicRoadmap.length > 0 ? 'generating' : 'input');
    const [selectedTopic, setSelectedTopic] = useState("");
    const [selectedDepth, setSelectedDepth] = useState("standard");

    const handleGenerate = (topic, depth) => {
        setSelectedTopic(topic);
        setSelectedDepth(depth);
        setView('generating');
        setTopicRoadmap([]); // Clear old one
    };

    const handleComplete = (roadmap) => {
        setTopicRoadmap(roadmap);
        setTopicStatus("READY");
    };

    return (
        <PageTransition>
            <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden">
                <GalaxyBackground />

                <header className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-30 pointer-events-none pt-safe">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="pointer-events-auto p-3 rounded-full bg-slate-900/50 border border-white/10 text-slate-400 hover:text-white transition-colors active:scale-95"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 relative flex items-center justify-center">
                    {view === 'input' && <InputView onGenerate={handleGenerate} />}
                    {view === 'generating' && (
                        <GeneratingView
                            topic={selectedTopic || "React Basics"}
                            depth={selectedDepth}
                            onComplete={handleComplete}
                        />
                    )}
                </main>
            </div>
        </PageTransition>
    );
};

export default TopicGame;
