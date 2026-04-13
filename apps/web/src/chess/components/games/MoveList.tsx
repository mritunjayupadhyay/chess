"use client";

import type { Move } from "../../../lib/api-types";

interface MoveListProps {
  moves: Move[];
  activePly?: number;
  onMoveClick?: (ply: number) => void;
}

export function MoveList({ moves, activePly, onMoveClick }: MoveListProps) {
  // Group moves into pairs: white (odd ply) + black (even ply)
  const pairs: { number: number; white?: Move; black?: Move }[] = [];

  for (const move of moves) {
    const moveNumber = Math.ceil(move.ply / 2);
    let pair = pairs.find((p) => p.number === moveNumber);
    if (!pair) {
      pair = { number: moveNumber };
      pairs.push(pair);
    }
    if (move.ply % 2 === 1) {
      pair.white = move;
    } else {
      pair.black = move;
    }
  }

  if (pairs.length === 0) {
    return <p className="text-gray-500 text-sm">No moves recorded.</p>;
  }

  return (
    <div className="font-mono text-sm leading-relaxed">
      {pairs.map((pair) => (
        <span key={pair.number} className="inline-block mr-4 mb-1">
          <span className="text-gray-400">{pair.number}.</span>{" "}
          <span
            className={`font-medium ${onMoveClick ? "cursor-pointer hover:underline" : ""} ${activePly !== undefined && pair.white && pair.white.ply === activePly ? "bg-yellow-200 rounded px-0.5" : ""}`}
            onClick={pair.white && onMoveClick ? () => onMoveClick(pair.white!.ply) : undefined}
          >
            {pair.white?.notation ?? "..."}
          </span>{" "}
          {pair.black && (
            <span
              className={`font-medium ${onMoveClick ? "cursor-pointer hover:underline" : ""} ${activePly !== undefined && pair.black.ply === activePly ? "bg-yellow-200 rounded px-0.5" : ""}`}
              onClick={onMoveClick ? () => onMoveClick(pair.black!.ply) : undefined}
            >
              {pair.black.notation}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
