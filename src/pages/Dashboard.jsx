import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GalaxyBackground from '../components/GalaxyBackground';
import { User, Star, Brain, Gamepad2, BookLock, StickyNote } from 'lucide-react';
import PageTransition from '../components/PageTransition';

// --- REVIEW BUTTON COMPONENT ---
const ReviewButton = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [textIndex, setTextIndex] = useState(0);
    const messages = ["Wanna rate us?", "Drop a review", "We need feedback", "Loving Learnty?"];

    useEffect(() => {
        const cycle = setInterval(() => {
            setIsExpanded(true);
            setTimeout(() => {
                setIsExpanded(false);
                setTimeout(() => {
                    setTextIndex(prev => (prev + 1) % messages.length);
                }, 500);
            }, 3000);
        }, 8000);
        return () => clearInterval(cycle);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-6 z-50 flex items-center justify-end pointer-events-auto scale-90 md:scale-100 origin-bottom-right">
            <button className="group flex items-center relative outline-none">
                <div className={`absolute right-full mr-4 flex items-center justify-end overflow-hidden transition-all duration-500 ease-out ${
                    isExpanded ? 'w-40 opacity-100' : 'w-0 opacity-0'
                }`}>
                     <div className="bg-slate-800/90 backdrop-blur border border-slate-700 text-slate-300 text-sm font-bold py-2.5 px-4 rounded-xl whitespace-nowrap shadow-xl">
                        {messages[textIndex]}
                     </div>
                </div>

                <div className="w-14 h-14 bg-[#0d9488] hover:bg-[#0f766e] rounded-full flex items-center justify-center shadow-[0_0_20px_#0d9488] transition-transform group-hover:scale-110 group-active:scale-90 z-10">
                    <Star className="w-6 h-6 text-white group-hover:rotate-[72deg] transition-transform duration-500" />
                </div>
            </button>
        </div>
    );
};

// --- FEATURE CARD ---
const FeatureCard = ({ title, description, icon: Icon, color, isLocked, onClick }) => {
    return (
        <div onClick={onClick}
            className={`relative w-[260px] h-[280px] md:h-[320px] rounded-3xl p-5 md:p-6 flex flex-col justify-between transition-all duration-300 transform border border-white/10 backdrop-blur-lg bg-slate-900/60 group cursor-pointer select-none hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ${
                isLocked ? 'grayscale opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] hover:bg-slate-800/80 hover:border-white/20'
            }`}>
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                 style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }}></div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 text-white shadow-inner">
                        <Icon className="w-8 h-8" />
                    </div>
                    {isLocked && (
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
                            Locked
                        </span>
                    )}
                </div>

                <div className="mt-auto">
                    <h3 className="text-2xl font-bold font-grotesk leading-tight mb-2 text-white">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-300/80 font-medium leading-snug mb-4 opacity-90 group-hover:opacity-100 transition-opacity">
                        {description}
                    </p>
                    <div className="h-1.5 w-10 rounded-full transition-all duration-300 group-hover:w-full" style={{ backgroundColor: color }}></div>
                </div>
            </div>
        </div>
    );
};

// --- INFINITE INTERACTIVE CAROUSEL ---
const InfiniteCarousel = ({ items, onCardClick }) => {
    const containerRef = useRef(null);
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const offsetRef = useRef(0);
    const lastX = useRef(0);
    const velocity = useRef(-0.5);
    const dragStartPos = useRef(0);

    const displayItems = [...items, ...items, ...items];
    const itemWidth = 292;
    const totalSetWidth = items.length * itemWidth;

    useEffect(() => {
        let animationFrameId;
        const loop = () => {
            if (!isDragging) {
                let next = offsetRef.current + velocity.current;
                if (next <= -totalSetWidth) next += totalSetWidth;
                if (next > 0) next -= totalSetWidth;
                offsetRef.current = next;
                setOffset(next);
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isDragging, totalSetWidth]);

    const handleStart = (clientX) => {
        setIsDragging(true);
        lastX.current = clientX;
        dragStartPos.current = clientX;
        velocity.current = 0;
    };

    const handleMove = (clientX) => {
        if (!isDragging) return;
        const delta = clientX - lastX.current;
        lastX.current = clientX;
        offsetRef.current += delta;
        setOffset(offsetRef.current);
    };

    const handleEnd = () => {
        setIsDragging(false);
        velocity.current = -0.5;
    };

    const onMouseDown = (e) => handleStart(e.clientX);
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onMouseLeave = () => { if (isDragging) handleEnd(); };
    const onTouchStart = (e) => handleStart(e.touches[0].clientX);
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();

    const handleClick = (item) => {
        const dragDistance = Math.abs(lastX.current - dragStartPos.current);
        if (dragDistance < 5 && !item.isLocked) {
            onCardClick(item);
        }
    };

    return (
        <div className="w-full h-full overflow-hidden flex items-center cursor-grab active:cursor-grabbing touch-none relative z-10"
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <div ref={containerRef} className="flex gap-8 pl-8 pointer-events-none"
                style={{ transform: `translateX(${offset}px)`, willChange: 'transform' }}>
                {displayItems.map((feature, index) => (
                    <div key={`${feature.id}-${index}`} className="shrink-0 pointer-events-auto">
                        <FeatureCard {...feature} onClick={() => handleClick(feature)} />
                    </div>
                ))}
            </div>
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-[#0f172a] to-transparent pointer-events-none z-20"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-[#0f172a] to-transparent pointer-events-none z-20"></div>
        </div>
    );
};

// --- MAIN DASHBOARD PAGE ---
const Dashboard = () => {
    const navigate = useNavigate();

    const features = [
        {
            id: 'chat',
            title: "Learnie",
            description: "Smart interactive learning buddy",
            icon: Brain,
            color: "#2dd4bf",
            isLocked: false,
            path: '/chat'
        },
        {
            id: 'topic',
            title: "Topic to Game",
            description: "Transform topics to games",
            icon: Gamepad2,
            color: "#a855f7",
            isLocked: false,
            path: '/topic-game'
        },
        {
            id: 'notes',
            title: "AI Note",
            description: "Faster, smarter and easier note taking",
            icon: StickyNote,
            color: "#38bdf8",
            isLocked: false,
            path: '/notes'
        },
        {
            id: 'book',
            title: "Book to Game",
            description: "Turn books into games",
            icon: BookLock,
            color: "#f59e0b",
            isLocked: true,
            path: '#'
        },
    ];

    const handleNavigate = (feature) => {
        if(feature.path && feature.path !== '#') {
            navigate(feature.path);
        }
    };

    return (
        <PageTransition>
            <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden select-none">
                <GalaxyBackground />

                <header className="w-full p-6 md:p-8 flex justify-between items-center z-30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0d9488] rounded-xl flex items-center justify-center shadow-[0_0_15px_#0d9488]">
                            <span className="font-bold text-white text-xl font-grotesk">L</span>
                        </div>
                        <span className="font-bold text-xl tracking-wide text-white font-grotesk hidden md:block">Learnty</span>
                    </div>

                    <button className="w-10 h-10 bg-slate-800/60 backdrop-blur rounded-full flex items-center justify-center border border-slate-600/50 hover:border-[#0d9488] transition-colors hover:bg-slate-700">
                        <User className="w-5 h-5 text-slate-300" />
                    </button>
                </header>

                <main className="flex-1 relative flex flex-col justify-center">
                    <InfiniteCarousel items={features} onCardClick={handleNavigate} />
                </main>

                <ReviewButton />
            </div>
        </PageTransition>
    );
};

export default Dashboard;
