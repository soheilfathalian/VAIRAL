"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";

function Teleprompter() {
  const searchParams = useSearchParams();
  const script = searchParams.get("script") || "No script provided. Go back and select a script to record.";
  const words = script.split(/\s+/).filter(w => w.length > 0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [wpm, setWpm] = useState(250);
  const [isPlaying, setIsPlaying] = useState(false);
  const [verticalPos, setVerticalPos] = useState(25); // percentage from top
  const [horizontalPos, setHorizontalPos] = useState(50); // percentage from left
  const [fontSize, setFontSize] = useState(120); // px
  const [isDragging, setIsDragging] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartY = useRef(0);
  const dragStartX = useRef(0);
  const initialVerticalPos = useRef(0);
  const initialHorizontalPos = useRef(0);

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem("vairal-teleprompter-settings");
    if (saved) {
      try {
        const { wpm: sWpm, vPos, hPos, fSize } = JSON.parse(saved);
        if (sWpm) setWpm(sWpm);
        if (vPos !== undefined) setVerticalPos(vPos);
        if (hPos !== undefined) setHorizontalPos(hPos);
        if (fSize) setFontSize(fSize);
      } catch (e) {
        console.error("Failed to load prompter settings", e);
      }
    }
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem("vairal-teleprompter-settings", JSON.stringify({
      wpm,
      vPos: verticalPos,
      hPos: horizontalPos,
      fSize: fontSize
    }));
  }, [wpm, verticalPos, horizontalPos, fontSize]);

  // Natural-reading delay multipliers
  const getWordDelay = (word: string, baseMs: number): number => {
    let multiplier = 1;

    // Sentence-end pause (full stop, !, ?)
    if (/[.!?]["')?]*$/.test(word)) multiplier *= 1.8;

    // Long-word buffer: words > 8 chars get extra time proportional to extra length
    const extraChars = Math.max(0, word.replace(/[^a-zA-Z]/g, "").length - 8);
    if (extraChars > 0) multiplier *= 1 + Math.min(extraChars * 0.08, 1); // cap at 2×

    return baseMs * multiplier;
  };

  useEffect(() => {
    if (isPlaying && currentIndex < words.length) {
      const msPerWord = (60 / wpm) * 1000;
      const delay = getWordDelay(words[currentIndex], msPerWord);
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, delay);
    } else if (currentIndex >= words.length) {
      setIsPlaying(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, words.length, wpm]);

  // Handle Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = e.clientY - dragStartY.current;
      const screenHeight = window.innerHeight;
      const deltaYPercent = (deltaY / screenHeight) * 100;
      setVerticalPos(initialVerticalPos.current + deltaYPercent);

      const deltaX = e.clientX - dragStartX.current;
      const screenWidth = window.innerWidth;
      const deltaXPercent = (deltaX / screenWidth) * 100;
      setHorizontalPos(initialHorizontalPos.current + deltaXPercent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartX.current = e.clientX;
    initialVerticalPos.current = verticalPos;
    initialHorizontalPos.current = horizontalPos;
  };

  const reset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const currentWord = words[currentIndex] || "";
  
  // Spritz focus-letter: always sits at the same horizontal anchor.
  // The focus index follows the Spritz formula (optimal recognition point).
  const getFocusIndex = (word: string): number => {
    // Strip trailing punctuation for length measurement
    const len = word.replace(/[^a-zA-Z0-9]/g, "").length;
    if (len <= 1) return 0;
    if (len <= 5) return 1;
    if (len <= 9) return 2;
    if (len <= 13) return 3;
    return 4;
  };

  const focusIndex = getFocusIndex(currentWord);
  const before = currentWord.slice(0, focusIndex);
  const focus  = currentWord.slice(focusIndex, focusIndex + 1);
  const after  = currentWord.slice(focusIndex + 1);

  return (
    <div className={`fixed inset-0 bg-paper text-ink flex flex-col font-sans overflow-hidden transition-colors duration-300 ${isDragging ? 'bg-neutral-100' : 'bg-paper'}`}>
      {/* Premium Header / Glassmorphism Controls */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-start z-10 pointer-events-none">
         <Link href="/" className="pointer-events-auto group flex items-center gap-2 text-neutral-500 hover:text-ink transition-all">
            <div className="w-8 h-8 rounded-full border border-neutral-200 bg-white/50 flex items-center justify-center group-hover:border-neutral-300 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </div>
            <span className="font-mono text-xs uppercase tracking-widest">Back to slate</span>
         </Link>
         
         <div className="flex flex-col gap-4 items-end pointer-events-auto">
            <div className="flex gap-6 items-center bg-white/70 backdrop-blur-xl px-6 py-4 rounded-3xl border border-neutral-200/50 shadow-xl">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Reading Speed</span>
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="50" 
                            max="450" 
                            step="10"
                            value={wpm} 
                            onChange={(e) => setWpm(Number(e.target.value))}
                            className="w-32 accent-accent bg-neutral-200 rounded-lg appearance-none cursor-pointer h-1"
                        />
                        <div className="flex flex-col items-center min-w-[60px]">
                            <span className="font-mono text-xl font-bold tabular-nums">{wpm}</span>
                            <span className="text-[8px] uppercase text-neutral-400">WPM</span>
                        </div>
                    </div>
                </div>

                <div className="h-10 w-[1px] bg-neutral-200" />

                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Position</span>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono italic">
                        DRAG TEXT
                    </div>
                </div>

                <div className="h-10 w-[1px] bg-neutral-200" />

                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Font Size</span>
                    <div className="flex items-center gap-4">
                         <button onClick={() => setFontSize(Math.max(40, fontSize - 10))} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full transition-colors text-xs border border-neutral-200">A</button>
                         <button onClick={() => setFontSize(Math.min(240, fontSize + 10))} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full transition-colors text-lg border border-neutral-200">A</button>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`flex items-center gap-3 px-8 py-3 rounded-full font-bold transition-all shadow-lg ${isPlaying ? 'bg-neutral-100 text-ink border border-neutral-200 hover:bg-neutral-200' : 'bg-ink text-paper hover:scale-105 active:scale-95'}`}
                >
                    {isPlaying ? (
                        <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                            Pause
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            Start
                        </>
                    )}
                </button>
                <button 
                    onClick={reset} 
                    className="p-3 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition-all text-neutral-400 hover:text-ink"
                    title="Reset"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
         </div>
      </div>

      {/* Main Display Area */}
      <div className="relative flex-1 cursor-move select-none" onMouseDown={onMouseDown}>
         {/* Focus guides — pinned to horizontalPos so they align with the shifted text */}
         <div className={`pointer-events-none fixed top-0 bottom-0 flex flex-col justify-between items-center py-[10vh] transition-opacity ${isDragging ? 'opacity-40' : 'opacity-20'}`} style={{ left: `${horizontalPos}%`, transform: 'translateX(-50%)' }}>
             <div className="w-1 h-12 bg-accent rounded-full shadow-[0_0_15px_rgba(99,102,241,0.2)]" />
             <div className="w-1 h-12 bg-accent rounded-full shadow-[0_0_15px_rgba(99,102,241,0.2)]" />
         </div>

         <div
            className={`absolute transition-all ${isDragging ? 'duration-0' : 'duration-300 ease-out'}`}
            style={{ 
              top: `${verticalPos}%`,
              left: `calc(${horizontalPos}% - 50vw)`,
              width: '100vw'
            }}
         >
             {/* Spritz Word Display — CSS Grid 1fr / auto / 1fr
                 The auto column (focus letter) is at exactly 50% of 100vw.
                 No font-metric guessing needed. Works for i, w, m alike. */}
             {currentIndex < words.length ? (
                 <div
                     className="font-bold tracking-tight whitespace-nowrap w-screen"
                     style={{
                         fontSize: `${fontSize}px`,
                         display: 'grid',
                         gridTemplateColumns: '1fr auto 1fr',
                         alignItems: 'baseline',
                     }}
                 >
                     <span className="text-neutral-300" style={{ textAlign: 'right' }}>{before}</span>
                     <span className="text-accent">{focus}</span>
                     <span style={{ textAlign: 'left' }}>{after}</span>
                 </div>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        <h2 className="text-6xl font-bold bg-gradient-to-r from-accent to-indigo-600 bg-clip-text text-transparent">Great Take!</h2>
                        <button onClick={reset} className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-ink transition-colors">Repeat Script</button>
                    </div>
                )}
            </div>
         </div>

      {/* Progress + Footer */}
      <div className="absolute bottom-12 left-12 right-12 flex items-center gap-6 pointer-events-none">
         <span className="font-mono text-xs text-neutral-300 tabular-nums">{currentIndex + 1} / {words.length}</span>
         <div className="flex-1 h-[2px] bg-neutral-100 rounded-full overflow-hidden">
            <div 
                className="h-full bg-accent shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-200 ease-linear"
                style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
         </div>
         <span className="font-mono text-xs text-neutral-300 uppercase tracking-widest">{Math.round(((currentIndex + 1) / words.length) * 100)}%</span>
      </div>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}

export default function TeleprompterPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-ink flex items-center justify-center text-paper font-mono">Loading Prompter...</div>}>
      <Teleprompter />
    </Suspense>
  );
}
