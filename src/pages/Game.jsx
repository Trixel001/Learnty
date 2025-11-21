import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GalaxyBackground from '../components/GalaxyBackground';
import { X, Zap, Brain, ChevronLeft, ChevronRight, Check, Lightbulb } from 'lucide-react';
import { useGlobalState } from '../context/GlobalContext';
import PageTransition from '../components/PageTransition';

const stepsData = [
    {
        id: 1,
        type: "Prediction",
        question: "What does this print?",
        codeDisplay: <><span className="text-blue-400">print</span>(<span className="text-orange-400">10</span> + <span className="text-orange-400">5</span> * <span className="text-orange-400">2</span>)</>,
        options: ["30", "20", "Error", "25"],
        correctId: 1,
        explanation: "In Python, Multiplication (*) happens before Addition (+). So 5 * 2 = 10. Then 10 + 10 = 20."
    },
    {
        id: 2,
        type: "Concept",
        question: "Identify the String Value",
        codeParts: [
            {id: 0, text: "username"},
            {id: 1, text: "="},
            {id: 2, text: '"Learnty"'}
        ],
        correctId: 2,
        explanation: "Text inside quotes is called a String. The variable 'username' is just a label for that value."
    },
    {
        id: 3,
        type: "Bug",
        question: "Where is the Syntax Error?",
        codeDisplay: <><span className="text-blue-400">print</span>(<span className="text-green-400">"Hello World"</span></>,
        options: ["Missing \"", "Missing )", "Missing ;", "No Error"],
        correctId: 1,
        explanation: "Functions like print() must act like a sandwich: they always need an opening '(' and a closing ')'."
    },
    {
        id: 4,
        type: "Prediction",
        question: "What happens here?",
        codeDisplay: <><span className="text-blue-400">print</span>(<span className="text-green-400">"Game"</span> + <span className="text-green-400">"Over"</span>)</>,
        options: ["GameOver", "Game Over", "Error", "Game+Over"],
        correctId: 0,
        explanation: "When you use '+' on strings, they glue together (concatenate) directly without adding spaces."
    },
    {
        id: 5,
        type: "Concept",
        question: "Select the Integer (Number)",
        codeParts: [
            {id: 0, text: "player_score"},
            {id: 1, text: "="},
            {id: 2, text: "500"}
        ],
        correctId: 2,
        explanation: "Whole numbers without quotes are called Integers. They are used for math."
    },
];

const Header = ({ current, total, xp, streak, onClose }) => (
    <header className="fixed top-0 left-0 w-full px-4 md:px-6 py-4 z-40 flex flex-col gap-3 md:gap-4 bg-gradient-to-b from-[#0f172a] to-transparent">
        <div className="flex items-center justify-between">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all">
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 ${streak > 1 ? 'animate-pulse' : ''}`}>
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-200">{streak}x</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#0d9488]/30 bg-[#0d9488]/10">
                    <Brain className="w-4 h-4 text-[#2dd4bf]" />
                    <span className="text-xs font-bold text-[#2dd4bf]">{xp} XP</span>
                </div>
            </div>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#0d9488] transition-all duration-500 ease-out" style={{ width: `${((current + 1) / total) * 100}%` }}></div>
        </div>
    </header>
);

const BreathIntro = ({ onComplete }) => {
    const [phase, setPhase] = useState("Inhale");
    useEffect(() => {
        const t1 = setTimeout(() => setPhase("Hold"), 4000);
        const t2 = setTimeout(() => setPhase("Exhale"), 8000);
        const t3 = setTimeout(() => onComplete(), 12000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full z-20 relative animate-[pop_1s_ease-out] w-full">
            <div className={`w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-[#0d9488] to-blue-500 blur-2xl transition-all duration-[4000ms] ease-in-out ${
                phase === 'Inhale' ? 'scale-125 opacity-100' : ''
            } ${
                phase === 'Hold' ? 'scale-125 opacity-80 shadow-[0_0_60px_#0d9488]' : ''
            } ${
                phase === 'Exhale' ? 'scale-75 opacity-40' : ''
            }`}></div>
            <h2 className="mt-12 text-3xl md:text-4xl font-light tracking-[0.3em] uppercase text-white transition-all duration-500">{phase}</h2>
            <p className="mt-4 text-sm text-slate-500 font-mono">Syncing Neural State...</p>
        </div>
    );
};

const QuizStep = ({ data, onNext, savedState }) => {
    const [selected, setSelected] = useState(savedState?.selected ?? null);
    const [view, setView] = useState(savedState?.view ?? 'question');
    const [isCorrect, setIsCorrect] = useState(savedState?.isCorrect ?? false);
    const isReadOnly = !!savedState;

    const handleCodeClick = (partId) => {
        if (view !== 'question' || isReadOnly) return;
        setSelected(partId);
    };

    const handleOptionClick = (idx) => {
        if (view !== 'question' || isReadOnly) return;
        setSelected(idx);
    };

    const handleLock = () => {
        if (selected === null) return;
        const correct = selected === data.correctId;
        setIsCorrect(correct);
        setView('result');
    };

    const handleContinue = () => {
        onNext({selected, isCorrect, view: 'result'});
    };

    return (
        <div className={`w-full max-w-2xl flex flex-col items-center px-4 ${isReadOnly ? 'opacity-90' : 'animate-[pop_0.4s_ease-out]'}`}>
            <div className="text-center mb-4 md:mb-6">
                <span className="inline-block px-3 py-1 rounded text-[10px] font-bold tracking-[0.2em] uppercase mb-3 border bg-[#0d9488]/20 text-[#2dd4bf] border-[#0d9488]/30">{data.type}</span>
                <h2 className="text-lg md:text-3xl font-bold text-white leading-tight px-4">{data.question}</h2>
            </div>

            <div className={`w-full md:w-[90%] max-w-[600px] glass-panel bg-slate-800/60 backdrop-blur rounded-2xl p-4 md:p-8 mb-4 md:mb-6 relative overflow-hidden group font-mono text-sm md:text-xl text-slate-300 transition-all duration-300 border border-white/10 overflow-x-auto ${
                isReadOnly && !isCorrect ? 'border-red-500/30' : ''
            } ${
                isReadOnly && isCorrect ? 'border-green-500/30' : ''
            }`}>
                 {data.codeParts ? (
                    <div className="flex flex-wrap gap-2 items-center justify-center">
                        {data.codeParts.map((part) => (
                            <span key={part.id} onClick={() => handleCodeClick(part.id)}
                                className={`p-2 rounded cursor-pointer transition-all border border-transparent ${
                                    view === 'question' && selected === part.id ? 'bg-white/10 border-white/30 scale-105' : 'hover:bg-white/5'
                                } ${
                                    (view === 'result' || isReadOnly) && part.id === data.correctId ? 'bg-green-500/20 text-green-300 border-green-500/50' : ''
                                } ${
                                    (view === 'result' || isReadOnly) && !isCorrect && selected === part.id ? 'bg-red-500/20 text-red-300' : ''
                                }`}>
                                {part.text}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap text-center break-words min-w-min">
                        {data.codeDisplay}
                    </div>
                )}
            </div>

            {data.options && (
                <div className="w-full md:w-[90%] grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                    {data.options.map((opt, idx) => (
                        <button key={idx} onClick={() => handleOptionClick(idx)} disabled={view !== 'question' || isReadOnly}
                            className={`p-3 md:p-4 rounded-xl border font-bold transition-all text-sm md:text-base relative ${
                                view === 'question' && selected === idx ? 'bg-white/10 border-white text-white scale-[1.02]' : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80'
                            } ${
                                (view === 'result' || isReadOnly) && idx === data.correctId ? '!bg-green-500/20 !border-green-500 !text-green-400' : ''
                            } ${
                                (view === 'result' || isReadOnly) && !isCorrect && selected === idx ? '!bg-red-500/20 !border-red-500 !text-red-400 opacity-60' : ''
                            }`}>
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            <div className="w-full p-4 flex justify-center">
                 <div className="w-full max-w-md">
                    {view === 'question' && !isReadOnly && (
                        <button onClick={handleLock} disabled={selected === null}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                                selected !== null ? 'bg-[#0d9488] hover:bg-[#0f766e] transform active:scale-95' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}>
                            Lock Answer
                        </button>
                    )}
                 </div>
            </div>

            {view === 'result' && !isReadOnly && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-[pop_0.3s_ease-out]">
                    <div className={`w-[90%] max-w-md border rounded-2xl p-6 shadow-2xl ${isCorrect ? 'bg-green-950/40 border-green-500/30' : 'bg-red-950/40 border-red-500/30'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-full ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {isCorrect ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                            </div>
                            <h3 className={`text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {isCorrect ? "Correct!" : "Not Quite"}
                            </h3>
                        </div>
                        <div className="bg-black/20 rounded-xl p-4 mb-6 border border-white/5">
                            <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <Lightbulb className="w-4 h-4" /> Insight
                            </div>
                            <p className="text-slate-200 text-sm leading-relaxed">{data.explanation}</p>
                        </div>
                        <button onClick={handleContinue} className="w-full py-3.5 bg-white hover:bg-slate-200 text-slate-900 rounded-xl font-bold shadow-lg transition-transform active:scale-95">Continue</button>
                    </div>
                 </div>
            )}
        </div>
    );
};

const LevelUp = ({ accuracy, xp, onRestart }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-[pop_0.6s_ease-out] p-6 overflow-hidden">
            <div className="w-full max-w-sm text-center relative z-10">
                <div className="inline-block relative mb-8">
                     <Brain className="w-24 h-24 text-[#2dd4bf] drop-shadow-2xl animate-pulse" />
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-2 tracking-tight text-[#2dd4bf]">COMPLETED!</h1>
                <p className="text-slate-300 text-base md:text-lg mb-10 font-medium">Neural pathways reinforced.</p>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8 backdrop-blur-md shadow-2xl">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                        <span className="text-slate-400">Accuracy</span>
                        <span className="font-mono font-bold text-xl text-green-400">{accuracy}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">XP Gained</span>
                        <span className="text-[#2dd4bf] font-mono font-bold text-xl">+{xp}</span>
                    </div>
                </div>
                <button onClick={onRestart} className="w-full py-4 bg-gradient-to-r from-[#0d9488] to-[#0f766e] rounded-xl font-bold text-white shadow-[0_0_30px_rgba(13,148,136,0.4)] transition-all active:scale-95">Continue Journey</button>
            </div>
        </div>
    );
};

const Game = () => {
    const navigate = useNavigate();
    const { gameXP, setGameXP, gameStreak, setGameStreak, gameHistory, setGameHistory } = useGlobalState();
    const [stage, setStage] = useState('intro');
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [viewingStepIndex, setViewingStepIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);

    useEffect(() => {
        const historyKeys = Object.keys(gameHistory).map(Number);
        if (historyKeys.length > 0) {
            const maxIdx = Math.max(...historyKeys);
            if (maxIdx >= stepsData.length - 1) {
                setStage('victory');
            } else {
                setStage('game');
                setActiveStepIndex(maxIdx + 1);
                setViewingStepIndex(maxIdx + 1);
            }
        }
    }, []);

    const handleIntroComplete = () => setStage('game');

    const handleNextStep = (resultState) => {
        setGameHistory(prev => ({ ...prev, [activeStepIndex]: resultState }));

        if (resultState.isCorrect) {
            setGameXP(prev => prev + 150 + (gameStreak * 10));
            setGameStreak(prev => prev + 1);
            setCorrectCount(prev => prev + 1);
        } else {
            setGameStreak(1);
        }

        if (activeStepIndex < stepsData.length - 1) {
            const nextIndex = activeStepIndex + 1;
            setActiveStepIndex(nextIndex);
            setViewingStepIndex(nextIndex);
        } else {
            setStage('victory');
        }
    };

    const touchStart = useRef(null);
    const touchEnd = useRef(null);
    const onTouchStart = (e) => { touchEnd.current = null; touchStart.current = e.targetTouches[0].clientX; };
    const onTouchMove = (e) => { touchEnd.current = e.targetTouches[0].clientX; };
    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        if (distance > 50) {
            if (viewingStepIndex < activeStepIndex) setViewingStepIndex(prev => prev + 1);
        }
        if (distance < -50) {
            if (viewingStepIndex > 0) setViewingStepIndex(prev => prev - 1);
        }
    };

    return (
        <PageTransition>
            <div className="relative w-full h-[100dvh] flex flex-col bg-[#0f172a] overflow-hidden"
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                <GalaxyBackground />

                {stage === 'game' && (
                    <Header current={viewingStepIndex} total={stepsData.length} xp={gameXP} streak={gameStreak}
                        onClose={() => navigate('/dashboard')} />
                )}

                <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full h-full overflow-y-auto pt-20">
                    {stage === 'intro' && <BreathIntro onComplete={handleIntroComplete} />}

                    {stage === 'game' && (
                        <>
                            <QuizStep key={viewingStepIndex} data={stepsData[viewingStepIndex]}
                                onNext={handleNextStep} savedState={gameHistory[viewingStepIndex]} />
                            {viewingStepIndex < activeStepIndex && (
                                <div className="absolute right-4 top-1/2 animate-pulse text-white/30"><ChevronRight className="w-8 h-8" /></div>
                            )}
                            {viewingStepIndex > 0 && (
                                <div className="absolute left-4 top-1/2 text-white/30"><ChevronLeft className="w-8 h-8" /></div>
                            )}
                        </>
                    )}

                    {stage === 'victory' && (
                        <LevelUp accuracy={Math.round((correctCount / stepsData.length) * 100)} xp={2500}
                            onRestart={() => navigate('/dashboard')} />
                    )}
                </main>
            </div>
        </PageTransition>
    );
};

export default Game;
