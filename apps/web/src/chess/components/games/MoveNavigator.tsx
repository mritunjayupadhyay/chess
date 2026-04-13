"use client";

import { useEffect, useCallback } from "react";

interface MoveNavigatorProps {
  currentIndex: number;
  totalMoves: number;
  onNavigate: (index: number) => void;
}

export function MoveNavigator({
  currentIndex,
  totalMoves,
  onNavigate,
}: MoveNavigatorProps) {
  const goStart = useCallback(() => onNavigate(0), [onNavigate]);
  const goPrev = useCallback(
    () => onNavigate(Math.max(0, currentIndex - 1)),
    [onNavigate, currentIndex]
  );
  const goNext = useCallback(
    () => onNavigate(Math.min(totalMoves, currentIndex + 1)),
    [onNavigate, currentIndex, totalMoves]
  );
  const goEnd = useCallback(
    () => onNavigate(totalMoves),
    [onNavigate, totalMoves]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext]);

  const btnClass =
    "px-3 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex items-center justify-center gap-2 mt-3">
      <button onClick={goStart} disabled={currentIndex === 0} className={btnClass}>
        {"⏮"}
      </button>
      <button onClick={goPrev} disabled={currentIndex === 0} className={btnClass}>
        {"◀"}
      </button>
      <span className="text-sm text-gray-500 mx-2">
        {currentIndex} / {totalMoves}
      </span>
      <button onClick={goNext} disabled={currentIndex === totalMoves} className={btnClass}>
        {"▶"}
      </button>
      <button onClick={goEnd} disabled={currentIndex === totalMoves} className={btnClass}>
        {"⏭"}
      </button>
    </div>
  );
}
