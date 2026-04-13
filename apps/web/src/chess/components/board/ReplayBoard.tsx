"use client";

import { parseFen } from "../../helpers/fen-parser";
import { getImageUrl } from "../../helpers/piece.helper";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

export function ReplayBoard({ fen }: { fen: string }) {
  const board = parseFen(fen);

  return (
    <div className="relative w-full max-w-[480px] mx-auto">
      {/* Board with aspect-ratio square */}
      <div className="relative w-full before:content-[''] before:block before:pt-[100%]">
        <div className="absolute inset-0 grid grid-rows-[repeat(8,1fr)] grid-cols-[repeat(8,1fr)]">
          {board.map((row, rankIdx) =>
            row.map((square, fileIdx) => {
              const isLight = (rankIdx + fileIdx) % 2 === 0;
              const url = square
                ? getImageUrl(square.type, square.color)
                : null;

              return (
                <div
                  key={`${rankIdx}-${fileIdx}`}
                  className={`relative ${isLight ? "bg-chess-light" : "bg-chess-dark"}`}
                >
                  {/* File label on bottom rank */}
                  {rankIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] font-semibold leading-none ${
                        isLight ? "text-chess-dark" : "text-chess-light"
                      }`}
                    >
                      {FILES[fileIdx]}
                    </span>
                  )}
                  {/* Rank label on left file */}
                  {fileIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] font-semibold leading-none ${
                        isLight ? "text-chess-dark" : "text-chess-light"
                      }`}
                    >
                      {RANKS[rankIdx]}
                    </span>
                  )}
                  {url && (
                    <div
                      className="absolute inset-0 bg-[length:60%] bg-no-repeat bg-center"
                      style={{ backgroundImage: `url(${url})` }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
