"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GameDetail, Move } from "../../lib/api-types";
import { getGameById, getMovesByGameId } from "../../lib/api";
import { MoveList } from "../components/games/MoveList";

export function GameDetailPage({ gameId }: { gameId: string }) {
  const [game, setGame] = useState<GameDetail | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [g, m] = await Promise.all([
          getGameById(gameId),
          getMovesByGameId(gameId),
        ]);
        if (cancelled) return;
        setGame(g);
        setMoves(m);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading game...</p>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">
          {error ?? "Game not found."}
        </p>
      </main>
    );
  }

  const whiteName = game.whitePlayer?.username ?? "White";
  const blackName = game.blackPlayer?.username ?? "Black";
  const resultLabel =
    game.result === "white_win"
      ? "1-0"
      : game.result === "black_win"
        ? "0-1"
        : game.result === "draw"
          ? "1/2-1/2"
          : "*";
  const date = game.endedAt
    ? new Date(game.endedAt).toLocaleDateString()
    : new Date(game.createdAt).toLocaleDateString();

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <Link href="/games" className="text-blue-600 hover:underline text-sm">
        &larr; Back to Games
      </Link>

      {/* Header */}
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold">
          {whiteName} vs {blackName}
        </h1>
        <p className="text-lg font-semibold mt-1">
          {resultLabel}{" "}
          {game.endReason && (
            <span className="text-sm font-normal text-gray-500">
              ({game.endReason})
            </span>
          )}
        </p>
      </div>

      {/* Game info */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {game.timeControl && (
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="font-semibold capitalize">{game.timeControl}</p>
            <p className="text-xs text-gray-500">Time Control</p>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="font-semibold">{game.totalMoves}</p>
          <p className="text-xs text-gray-500">Moves</p>
        </div>
        {game.durationSeconds != null && (
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="font-semibold">
              {Math.floor(game.durationSeconds / 60)}m{" "}
              {game.durationSeconds % 60}s
            </p>
            <p className="text-xs text-gray-500">Duration</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4">{date}</p>

      {/* Move list */}
      <h2 className="text-lg font-semibold mb-3">Moves</h2>
      <MoveList moves={moves} />
    </main>
  );
}
