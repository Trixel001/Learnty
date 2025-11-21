import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GalaxyBackground from '../components/GalaxyBackground';
import { Brain, ArrowRight, Book, Zap, CheckCircle, Gamepad2, Anchor } from 'lucide-react';
import PageTransition from '../components/PageTransition';

// --- SLIDE 1 ---
const SlideOne = () => (
    <div className="text-center flex flex-col items-center animate-[fadeIn_0.8s_ease-out] w-full max-w-4xl px-6">
        <div className="inline-flex items-center justify-center px-4 py-2 mb-6 md:mb-8 rounded-full bg-[#0d9488]/10 border border-[#0d9488]/30 text-[#0d9488]">
            <Brain className="w-5 h-5 mr-2 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">System Upgrade</span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-xl break-words w-full">
            Innovating <br className="hidden md:block"/> knowledge <br className="hidden md:block"/> acquisition.
        </h1>
        <p className="text-slate-400 text-sm md:text-xl max-w-lg mx-auto leading-relaxed px-4">
            Welcome to Learnty. Step into the neural network of the future.
        </p>
    </div>
);

// --- SLIDE 2 ---
const SlideTwo = () => (
    <div className="flex flex-col items-center justify-center gap-8 md:gap-10 w-full max-w-md px-6 animate-[slideInRight_0.6s_ease-out] text-center">
        <div className="w-full">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-white">
                Books <span className="relative inline-block text-red-400">Decay.</span>
            </h2>
            <p className="text-base md:text-lg text-slate-300 mb-2 leading-relaxed">
                Research shows you forget <span className="text-[#0d9488] font-bold">80% - 90%</span> of what you read after just one week.
            </p>
            <p className="text-xs text-red-400 font-mono inline-block px-2 py-1 rounded bg-red-950/30 border border-red-900/50">
                ERROR: MEMORY_LEAK
            </p>
        </div>

        <div className="relative flex items-center justify-center">
            <div className="w-48 h-48 md:w-64 md:h-64 bg-[#451a03]/80 backdrop-blur-sm border border-amber-700/30 rounded-xl flex items-center justify-center relative shadow-2xl overflow-hidden">
                <Book className="w-24 h-24 md:w-32 md:h-32 text-amber-500/90 animate-glitch" />
                {[...Array(15)].map((_, i) => (
                    <div key={i}
                         className="absolute w-2 h-2 bg-amber-500/80 rounded-none animate-pixel shadow-[0_0_5px_#f59e0b]"
                         style={{
                             right: '0px',
                             top: (Math.random() * 80 + 10) + '%',
                             animationDelay: Math.random() * 2 + 's',
                             animationDuration: (1.5 + Math.random()) + 's'
                         }}
                    ></div>
                ))}
            </div>
        </div>
    </div>
);

// --- SLIDE 3 ---
const SlideThree = () => (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md px-6 animate-[slideInRight_0.6s_ease-out] text-center">
        <div className="w-full">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-white">
                School is <span className="text-red-500">Bloatware.</span>
            </h2>
            <p className="text-base md:text-lg text-slate-300 mb-6 leading-relaxed">
                Too slow. Too expensive. <br/>
                <span className="opacity-75">Obsolete operating system.</span>
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
                <div className="px-3 py-1.5 rounded bg-red-950/30 border border-red-900/50 text-xs font-mono text-red-300">$$$ EXPENSIVE</div>
                <div className="px-3 py-1.5 rounded bg-red-950/30 border border-red-900/50 text-xs font-mono text-red-300">latency: HIGH</div>
            </div>
        </div>

        <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
            <div className="animate-[bounce_3s_infinite_ease-in-out]">
                <Anchor className="w-32 h-32 md:w-40 md:h-40 text-slate-500/80 animate-glow-red" />
            </div>
            <div className="absolute bottom-4 w-24 h-3 bg-black/50 blur-lg rounded-full animate-[pulse_3s_infinite]"></div>
        </div>
    </div>
);

// --- SLIDE 4 ---
const SlideFour = () => (
    <div className="w-full max-w-md md:max-w-lg mx-auto px-6 flex flex-col items-center animate-[zoomIn_0.5s_ease-out] pb-safe">
        <div className="relative w-full aspect-[4/3.5] mb-6 md:mb-8">
            <div className="absolute -top-4 -right-2 z-20 w-12 h-12 md:w-16 md:h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-200 transform rotate-12 animate-[bounce_3s_infinite]">
                <span className="text-yellow-900 font-bold text-xl md:text-2xl">A+</span>
            </div>
            <div className="absolute top-1/2 -left-4 md:-left-6 z-20 transform -translate-y-1/2 -rotate-12">
                <Gamepad2 className="w-10 h-10 md:w-12 md:h-12 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            </div>
            <div className="w-full h-full bg-[#1e293b] rounded-3xl border border-slate-700 p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0d9488]/5 to-transparent pointer-events-none"></div>
                <div className="grid grid-cols-2 gap-4 flex-1 mb-4 md:mb-6">
                    <div className="bg-[#0f172a] rounded-2xl flex flex-col items-center justify-center p-3 md:p-4 border border-slate-700/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[#0d9488]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Zap className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 mb-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                        <span className="text-yellow-400 font-bold text-xs md:text-sm">+500 XP</span>
                    </div>
                    <div className="bg-[#0f172a] rounded-2xl flex flex-col items-center justify-center p-3 md:p-4 border border-slate-700/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[#0d9488]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-[#0d9488] flex items-center justify-center mb-2">
                            <CheckCircle className="w-4 h-4 text-[#0d9488]" />
                        </div>
                        <span className="text-[#0d9488] font-bold text-xs md:text-sm">Level Up</span>
                    </div>
                </div>
                <div className="bg-[#0f172a] rounded-xl p-3 md:p-4 border border-slate-700/50">
                    <div className="h-2 md:h-3 w-full bg-slate-800 rounded-full overflow-hidden mb-2 relative">
                        <div className="absolute top-0 left-0 h-full w-[80%] bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] shadow-[0_0_10px_#0d9488]"></div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-[10px] md:text-xs font-mono text-slate-300">80% Retained</span>
                    </div>
                </div>
            </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-3 text-[#2dd4bf] drop-shadow-sm text-center px-2">
            Play to Learn.
        </h1>
        <p className="text-sm md:text-lg text-slate-300 text-center max-w-xs md:max-w-sm leading-relaxed">
            Your brain doesn't forget a high score. We turn study into addiction—the good kind.
        </p>
    </div>
);

const Intro = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 4;
    const touchStart = useRef(null);
    const touchEnd = useRef(null);
    const minSwipeDistance = 50;

    const nextSlide = () => {
        if (currentSlide < totalSlides - 1) setCurrentSlide(prev => prev + 1);
        else startGame();
    };

    const prevSlide = () => { if (currentSlide > 0) setCurrentSlide(prev => prev - 1); };

    const startGame = () => {
        navigate('/dashboard');
    };

    const onTouchStart = (e) => { touchEnd.current = null; touchStart.current = e.targetTouches[0].clientX; }
    const onTouchMove = (e) => { touchEnd.current = e.targetTouches[0].clientX; }
    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        if (distance > minSwipeDistance) nextSlide();
        if (distance < -minSwipeDistance) prevSlide();
    }

    return (
        <PageTransition>
            <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden select-none"
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
                <GalaxyBackground />
                <header className="fixed top-0 left-0 w-full p-6 pt-safe flex justify-between items-center z-50 pointer-events-none">
                    <div className="flex items-center gap-2 pointer-events-auto">
                        <div className="w-10 h-10 bg-[#0d9488] rounded-xl flex items-center justify-center shadow-[0_0_15px_#0d9488]">
                            <span className="font-bold text-white text-lg">L</span>
                        </div>
                        <span className="font-bold text-xl tracking-wide text-white hidden md:block">Learnty</span>
                    </div>
                    <button onClick={startGame} className="pointer-events-auto px-4 py-2 text-sm md:text-base text-slate-400 hover:text-white transition-colors font-medium active:scale-95">Skip Intro</button>
                </header>

                <main className="flex-1 flex items-center justify-center relative z-10 w-full h-full pt-16 pb-24 overflow-y-auto overflow-x-hidden">
                    {currentSlide === 0 && <SlideOne />}
                    {currentSlide === 1 && <SlideTwo />}
                    {currentSlide === 2 && <SlideThree />}
                    {currentSlide === 3 && <SlideFour />}
                </main>

                <footer className="fixed bottom-0 w-full p-6 pb-safe flex flex-col items-center gap-4 z-50 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/95 to-transparent">
                    <div className="flex gap-3 mb-2">
                        {[...Array(totalSlides)].map((_, idx) => (
                            <button key={idx} onClick={() => setCurrentSlide(idx)}
                                className={`h-2 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-8 bg-[#0d9488] shadow-[0_0_10px_#0d9488]' : 'w-2 bg-slate-700 hover:bg-slate-600'}`} />
                        ))}
                    </div>
                    <button onClick={nextSlide}
                        className="group relative w-[90%] max-w-sm py-4 bg-[#0d9488] rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(13,148,136,0.3)] transition-all active:scale-95 hover:shadow-[0_0_30px_rgba(13,148,136,0.5)]">
                        <div className="flex items-center justify-center gap-2 font-bold text-lg text-white">
                            {currentSlide === totalSlides - 1 ? "Start Playing" : "Continue"}
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </footer>
            </div>
        </PageTransition>
    );
};

export default Intro;
