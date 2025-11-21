import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GalaxyBackground from '../components/GalaxyBackground';
import { ArrowLeft, Save, History, Keyboard, PenTool, MousePointer, Square, Circle, Trash, Brain, X, Check, Bold, Italic, List, ChevronLeft } from 'lucide-react';
import { useGlobalState } from '../context/GlobalContext';
import PageTransition from '../components/PageTransition';

// --- GEOMETRY & HIT TEST ENGINE ---
const getDistance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

const isPointNearLine = (x, y, p1, p2, maxDist = 10) => {
    const a = x - p1.x; const b = y - p1.y;
    const c = p2.x - p1.x; const d = p2.y - p1.y;
    const dot = a * c + b * d;
    const lenSq = c * c + d * d;
    const param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) { xx = p1.x; yy = p1.y; }
    else if (param > 1) { xx = p2.x; yy = p2.y; }
    else { xx = p1.x + param * c; yy = p1.y + param * d; }
    const dx = x - xx; const dy = y - yy;
    return (dx * dx + dy * dy) < maxDist * maxDist;
};

const hitTest = (x, y, elements, currentSelectedId) => {
    const handleSize = 20;
    if (currentSelectedId) {
        const el = elements.find(e => e.id === currentSelectedId);
        if (el && el.type !== 'pen') {
            const right = el.x + el.width;
            const bottom = el.y + el.height;
            if (Math.abs(x - right) < handleSize && Math.abs(y - bottom) < handleSize) {
                return { id: el.id, element: el, hitType: 'resize' };
            }
        }
    }
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.type === 'rect') {
            if(x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height)
                return { id: el.id, element: el, hitType: 'move' };
        } else if (el.type === 'circle') {
            const cx = el.x + el.width/2;
            const cy = el.y + el.height/2;
            if (getDistance({x,y}, {x:cx, y:cy}) < Math.abs(el.width)/2)
                return { id: el.id, element: el, hitType: 'move' };
        } else if (el.type === 'pen') {
            for(let j=0; j<el.points.length-1; j++) {
                if(isPointNearLine(x, y, el.points[j], el.points[j+1]))
                    return { id: el.id, element: el, hitType: 'move' };
            }
        }
    }
    return null;
};

// --- SUB-COMPONENTS ---
const HistoryModal = ({ history, currentIndex, onClose, onRestore }) => (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm pb-safe" onClick={onClose}>
        <div className="w-full max-w-md bg-slate-900 border-t md:border border-white/10 md:rounded-2xl p-6 shadow-2xl animate-[slideInUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-grotesk text-white">Time Machine</h3>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X className="w-6 h-6"/></button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {history.map((state, idx) => (
                    <button key={state.timestamp} onClick={() => onRestore(idx)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${idx === currentIndex ? 'bg-[#0d9488]/20 border-[#0d9488]' : 'bg-slate-800/50 border-white/5'}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-300">{new Date(state.timestamp).toLocaleTimeString()}</span>
                            <span className="text-xs text-slate-500 uppercase">{state.reason || 'Auto-save'}</span>
                        </div>
                        {idx === currentIndex && <Check className="w-4 h-4 text-[#0d9488]"/>}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

const AIReviewModal = ({ type, originalText, onClose, onCommit }) => {
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const prompts = {
            'Fix Grammar': "Corrected version: " + originalText,
            'Summarize': "Executive Summary: Key insights extracted.",
            'Expand': "Detailed Analysis: Expanding on the concepts...",
            'Simplify': "Simply put: " + originalText.substring(0, 30) + "..."
        };
        setTimeout(() => {
            setResult(prompts[type] || "Processed.");
            setLoading(false);
        }, 1200);
    }, [type, originalText]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-[pop_0.2s]" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[#0d9488] font-bold"><Brain className="w-5 h-5" /> <span>AI Processor</span></div>
                    <button onClick={onClose}><X className="w-6 h-6 text-slate-500"/></button>
                </div>
                <div className="p-6">
                    {loading ? <div className="text-center py-8 text-[#0d9488]"><div className="animate-spin w-8 h-8 border-4 border-[#0d9488] border-t-transparent rounded-full mx-auto"></div></div> :
                    <div className="bg-slate-950 p-4 rounded border border-slate-800 text-slate-300 text-sm">{result}</div>}
                </div>
                <div className="flex p-4 gap-2 bg-slate-800/50">
                    <button onClick={() => onCommit(result, 'replace')} className="flex-1 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 font-bold">Replace</button>
                    <button onClick={() => onCommit(result, 'insert')} className="flex-1 py-3 rounded-xl bg-[#0d9488] text-white hover:bg-[#0f766e] font-bold">Insert</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN NOTES APP ---
const Notes = () => {
    const navigate = useNavigate();
    const {
        noteContent, setNoteContent,
        noteElements, setNoteElements,
        noteHistory, setNoteHistory
    } = useGlobalState();

    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [tool, setTool] = useState('pen');
    const [selectedElement, setSelectedElement] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [selectionBounds, setSelectionBounds] = useState(null);
    const [selectedText, setSelectedText] = useState("");
    const [aiFeature, setAiFeature] = useState(null);
    const [aiMenuOpen, setAiMenuOpen] = useState(false);

    const action = useRef('none');
    const startPos = useRef({x:0, y:0});
    const canvasRef = useRef(null);
    const editorRef = useRef(null);

    // Initial History Save
    useEffect(() => {
        if(noteHistory.length === 0) {
            const initial = { content: noteContent, elements: noteElements, timestamp: Date.now(), reason: 'Initial' };
            setNoteHistory([initial]);
            setHistoryIndex(0);
        } else {
            setHistoryIndex(noteHistory.length - 1);
        }
    }, []);

    const saveState = (reason = 'Edit') => {
        const state = {
            content: noteContent,
            elements: JSON.parse(JSON.stringify(noteElements)),
            timestamp: Date.now(),
            reason
        };
        const newHistory = noteHistory.slice(0, historyIndex + 1);
        newHistory.push(state);
        if(newHistory.length > 20) newHistory.shift();
        setNoteHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const restoreState = (index) => {
        const state = noteHistory[index];
        if(!state) return;
        setNoteContent(state.content);
        setNoteElements(state.elements);
        setHistoryIndex(index);
        if(editorRef.current) editorRef.current.innerHTML = state.content;
        setShowHistory(false);
    };

    // Vector Renderer & Resize Handler
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            noteElements.forEach(el => {
                const isSelected = selectedElement?.id === el.id;
                ctx.strokeStyle = isSelected ? '#2dd4bf' : el.color;
                ctx.lineWidth = isSelected ? 3 : 2;

                ctx.beginPath();
                if (el.type === 'pen') {
                    if(el.points.length > 1) {
                        ctx.moveTo(el.points[0].x, el.points[0].y);
                        for(let i=1; i<el.points.length; i++) ctx.lineTo(el.points[i].x, el.points[i].y);
                    }
                } else if (el.type === 'rect') {
                    ctx.rect(el.x, el.y, el.width, el.height);
                } else if (el.type === 'circle') {
                    const rx = Math.abs(el.width)/2;
                    const ry = Math.abs(el.height)/2;
                    const cx = el.x + el.width/2;
                    const cy = el.y + el.height/2;
                    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
                }
                ctx.stroke();

                if (isSelected && el.type !== 'pen') {
                    ctx.save();
                    ctx.setLineDash([5, 5]);
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(el.x - 5, el.y - 5, el.width + 10, el.height + 10);
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(el.x + el.width - 5, el.y + el.height - 5, 10, 10);
                    ctx.restore();
                }
            });
        };

        // Resize Logic
        const handleResize = () => {
             const dpr = window.devicePixelRatio || 1;
             // Save current content if needed (though we redraw from state)
             canvas.width = canvas.offsetWidth * dpr;
             canvas.height = 4000 * dpr;
             ctx.scale(dpr, dpr);
             draw();
        };

        // Initial setup
        handleResize();
        window.addEventListener('resize', handleResize);

        // Redraw when elements change
        draw();

        return () => window.removeEventListener('resize', handleResize);
    }, [noteElements, selectedElement]);

    // Canvas Interactions (Touch/Mouse)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleStart = (e) => {
            if (!isDrawingMode) return;
            // Prevent scrolling when drawing
            if (e.target === canvas) e.preventDefault();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            startPos.current = {x, y};

            if (tool === 'select') {
                const hit = hitTest(x, y, noteElements, selectedElement?.id);
                if (hit) {
                    setSelectedElement(hit.element);
                    action.current = hit.hitType === 'resize' ? 'resizing' : 'moving';
                } else {
                    setSelectedElement(null);
                    action.current = 'none';
                }
            } else {
                const id = Date.now();
                const newEl = {
                    id, type: tool, x, y, width: 0, height: 0,
                    points: [{x,y}], color: '#0d9488'
                };
                setNoteElements(prev => [...prev, newEl]);
                setSelectedElement(newEl);
                action.current = 'drawing';
            }
        };

        const handleMove = (e) => {
            if (!isDrawingMode || action.current === 'none') return;
            if (e.cancelable) e.preventDefault();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const rect = canvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            setNoteElements(prev => {
                const next = [...prev];
                const currentId = selectedElement ? selectedElement.id : next[next.length-1].id;
                const idx = next.findIndex(el => el.id === currentId);
                if (idx === -1) return prev;
                const el = {...next[idx]};

                if (action.current === 'drawing') {
                    if (el.type === 'pen') el.points = [...el.points, {x,y}];
                    else { el.width = x - el.x; el.height = y - el.y; }
                } else if (action.current === 'moving') {
                    const dx = x - startPos.current.x;
                    const dy = y - startPos.current.y;
                    el.x += dx; el.y += dy;
                    if(el.type === 'pen') el.points = el.points.map(p => ({x: p.x+dx, y: p.y+dy}));
                    startPos.current = {x,y};
                } else if (action.current === 'resizing') {
                    el.width = x - el.x;
                    el.height = y - el.y;
                }

                next[idx] = el;
                if(selectedElement && selectedElement.id === el.id) setSelectedElement(el);
                return next;
            });
        };

        const handleEnd = () => {
            if (action.current !== 'none') {
                saveState('Draw Action');
                action.current = 'none';
            }
        };

        // Use passive: false to allow preventDefault
        canvas.addEventListener('touchstart', handleStart, { passive: false });
        canvas.addEventListener('touchmove', handleMove, { passive: false });
        canvas.addEventListener('touchend', handleEnd);
        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('mouseup', handleEnd);

        return () => {
            canvas.removeEventListener('touchstart', handleStart);
            canvas.removeEventListener('touchmove', handleMove);
            canvas.removeEventListener('touchend', handleEnd);
            canvas.removeEventListener('mousedown', handleStart);
            canvas.removeEventListener('mousemove', handleMove);
            canvas.removeEventListener('mouseup', handleEnd);
        };
    }, [isDrawingMode, tool, noteElements, selectedElement]);

    // Text Selection
    useEffect(() => {
        const handleSelection = () => {
            if(isDrawingMode) return;
            const sel = window.getSelection();
            if(!sel.rangeCount || sel.isCollapsed) {
                setSelectionBounds(null);
                return;
            }
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if(rect.width > 0) {
                setSelectionBounds({top: rect.top - 55, left: rect.left + (rect.width/2)});
                setSelectedText(sel.toString());
            }
        };
        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    }, [isDrawingMode]);

    const execCmd = (cmd, val) => {
        document.execCommand(cmd, false, val);
        editorRef.current.focus();
    };

    const handleAICommit = (text, method) => {
        if(method === 'replace') {
            execCmd('insertText', text);
            setNoteContent(editorRef.current.innerHTML);
        } else {
            const html = `<br/><div class="p-4 bg-slate-800 border-l-4 border-[#0d9488] my-2 rounded-r">${text}</div><br/>`;
            execCmd('insertHTML', html);
            setNoteContent(editorRef.current.innerHTML);
        }
        setAiFeature(null);
        setSelectionBounds(null);
        saveState('AI Gen');
    };

    return (
        <PageTransition>
            <div className={`flex flex-col h-[100dvh] w-full relative ${isDrawingMode ? 'cursor-crosshair' : ''}`}>
                <GalaxyBackground />

                {/* MODALS */}
                {showHistory && <HistoryModal history={noteHistory} currentIndex={historyIndex} onClose={()=>setShowHistory(false)} onRestore={restoreState} />}
                {aiFeature && <AIReviewModal type={aiFeature} originalText={selectedText} onClose={()=>setAiFeature(null)} onCommit={handleAICommit} />}

                {/* SELECTION MENU */}
                {selectionBounds && !isDrawingMode && !aiFeature && (
                    <div
                        className="fixed z-[9999] flex items-center gap-1 bg-slate-800 p-1.5 rounded-lg shadow-2xl border border-slate-600 animate-[fadeUp_0.15s]"
                        style={{top: selectionBounds.top, left: selectionBounds.left, transform: 'translateX(-50%)'}}
                        onMouseDown={e => e.preventDefault()}
                    >
                        <button onClick={() => navigator.clipboard.writeText(selectedText)} className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded min-w-[44px]">Copy</button>
                        <div className="w-px h-4 bg-slate-600"></div>
                        <button onClick={() => setAiFeature('Fix Grammar')} className="px-3 py-2 text-xs font-bold text-[#2dd4bf] hover:bg-slate-700 rounded flex items-center gap-1 min-w-[44px]"><Brain className="w-3 h-3"/> Fix</button>
                        <button onClick={() => setAiFeature('Summarize')} className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded min-w-[44px]">Summarize</button>
                    </div>
                )}

                {/* HEADER */}
                <header className="shrink-0 h-16 pt-safe flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur border-b border-white/10 z-30">
                    <div className="flex items-center gap-3">
                         <button onClick={() => navigate('/dashboard')} className="p-3 rounded-full hover:bg-white/10 transition-colors active:scale-95">
                            <ArrowLeft className="w-6 h-6 text-slate-300" />
                        </button>
                        <h1 className="font-grotesk font-bold text-lg hidden md:block">Learnty Ultimate</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowHistory(true)} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-all active:scale-95"><History className="w-5 h-5"/></button>
                        <button onClick={() => saveState('Manual')} className="px-5 py-2 rounded-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-sm shadow-lg flex items-center gap-2 active:scale-95"><Save className="w-4 h-4"/> Save</button>
                    </div>
                </header>

                <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden z-20">
                    {/* SIDEBAR (Responsive: Bottom on Mobile, Left on Desktop) */}
                    <aside className={`
                        bg-slate-950/50 backdrop-blur-sm border-white/5 flex items-center gap-4 z-40
                        fixed bottom-0 left-0 w-full h-16 border-t pb-safe px-4 justify-center
                        md:static md:w-20 md:h-full md:border-r md:border-t-0 md:flex-col md:py-4 md:justify-start md:pb-0
                    `}>
                        <div className="bg-slate-900 p-1 rounded-xl border border-white/10 flex md:flex-col gap-1">
                            <button onClick={() => setIsDrawingMode(false)} className={`p-3 rounded-lg transition-all active:scale-95 ${!isDrawingMode ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><Keyboard className="w-6 h-6 md:w-5 md:h-5"/></button>
                            <button onClick={() => setIsDrawingMode(true)} className={`p-3 rounded-lg transition-all active:scale-95 ${isDrawingMode ? 'bg-[#0d9488] text-white shadow-lg' : 'text-slate-500'}`}><PenTool className="w-6 h-6 md:w-5 md:h-5"/></button>
                        </div>

                        <div className="h-8 w-px bg-white/10 md:w-8 md:h-px"></div>

                        {isDrawingMode ? (
                            <div className="flex md:flex-col gap-2 animate-[pop_0.2s]">
                                {[{id:'select', i: MousePointer}, {id:'pen', i: PenTool}, {id:'rect', i: Square}, {id:'circle', i: Circle}].map(t => (
                                    <button key={t.id} onClick={()=>{setTool(t.id); setSelectedElement(null);}} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors active:scale-95 ${tool===t.id ? 'text-[#0d9488] bg-[#0d9488]/20 border border-[#0d9488]' : 'text-slate-400 hover:bg-slate-800'}`}>
                                        <t.i className="w-5 h-5"/>
                                    </button>
                                ))}
                                <div className="w-4 md:h-4"></div>
                                {selectedElement && (
                                    <button onClick={() => {
                                        setNoteElements(prev => prev.filter(e => e.id !== selectedElement.id));
                                        setSelectedElement(null);
                                    }} className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all animate-[pop_0.2s] active:scale-95"><Trash className="w-5 h-5"/></button>
                                )}
                            </div>
                        ) : (
                            <div className="flex md:flex-col gap-2 animate-[pop_0.2s]">
                                <button onClick={() => execCmd('bold')} className="w-10 h-10 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white active:scale-95"><Bold className="w-5 h-5"/></button>
                                <button onClick={() => execCmd('italic')} className="w-10 h-10 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white active:scale-95"><Italic className="w-5 h-5"/></button>
                                <button onClick={() => execCmd('insertUnorderedList')} className="w-10 h-10 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white active:scale-95"><List className="w-5 h-5"/></button>
                                <button onClick={() => execCmd('formatBlock', 'H2')} className="w-10 h-10 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white font-bold active:scale-95">H2</button>
                            </div>
                        )}
                    </aside>

                    {/* EDITOR */}
                    <div className="flex-1 relative overflow-y-auto custom-scrollbar pb-20 md:pb-0">
                        <div className="min-h-full max-w-4xl mx-auto relative p-4 md:p-12">
                            <div className="relative bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-3xl shadow-2xl min-h-[80vh]">
                                <canvas ref={canvasRef} className={`absolute inset-0 rounded-3xl w-full h-full z-20 ${isDrawingMode ? 'pointer-events-auto' : 'pointer-events-none'}`} />
                                <div
                                    ref={editorRef}
                                    className={`p-6 md:p-10 outline-none min-h-[60vh] relative z-10 text-slate-100 text-base md:text-lg leading-relaxed ${isDrawingMode ? 'opacity-50 blur-[1px] select-none pointer-events-none' : 'select-text'}`}
                                    contentEditable={!isDrawingMode}
                                    suppressContentEditableWarning={true}
                                    dangerouslySetInnerHTML={{__html: noteContent}}
                                    onInput={e => setNoteContent(e.currentTarget.innerHTML)}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI FAB */}
                <div className="absolute bottom-20 right-4 md:bottom-8 md:right-8 flex flex-col-reverse items-end gap-4 z-50 pointer-events-auto">
                    <button
                        onClick={() => setAiMenuOpen(!aiMenuOpen)}
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(13,148,136,0.5)] transition-all duration-300 active:scale-90 ${aiMenuOpen ? 'bg-white text-[#0d9488] rotate-12' : 'bg-[#0d9488] text-white hover:scale-110'}`}
                    >
                        {aiMenuOpen ? <X className="w-6 h-6"/> : <Brain className="w-6 h-6 md:w-8 md:h-8" />}
                    </button>

                    {aiMenuOpen && (
                        <div className="flex flex-col gap-2 mb-2 animate-[slideInRight_0.2s]">
                            {['Expand', 'Simplify', 'Fix Grammar', 'Summarize'].map((f, i) => (
                                <button
                                    key={f}
                                    onClick={() => {setAiFeature(f); setAiMenuOpen(false);}}
                                    className="bg-slate-800 border border-slate-700 text-white px-5 py-3 rounded-xl shadow-xl hover:bg-[#0d9488] hover:border-[#0d9488] transition-all text-sm font-medium flex items-center justify-between min-w-[160px] group active:scale-95"
                                >
                                    {f}
                                    <ChevronLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default Notes;
