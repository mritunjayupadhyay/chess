"use client";

import Link from "next/link";
import type { Game } from "../../../lib/api-types";

function getResultBadge(game: Game, profileId: string) {
  if (!game.result) return { label: "?", color: "bg-gray-200 text-gray-700" };
  if (game.result === "draw")
    return { label: "D", color: "bg-yellow-100 text-yellow-800" };
  if (game.winnerId === profileId)
    return { label: "W", color: "bg-green-100 text-green-800" };
  return { label: "L", color: "bg-red-100 text-red-800" };
}

function getOpponentName(game: Game, profileId: string) {
  if (game.whitePlayerId === profileId) {
    return game.blackPlayer?.username ?? "Unknown";
  }
  return game.whitePlayer?.username ?? "Unknown";
}

export function GameListItem({
  game,
  profileId,
}: {
  game: Game;
  profileId: string;
}) {
  const badge = getResultBadge(game, profileId);
  const opponent = getOpponentName(game, profileId);
  const side = game.whitePlayerId === profileId ? "White" : "Black";
  const date = game.endedAt
    ? new Date(game.endedAt).toLocaleDateString()
    : new Date(game.createdAt).toLocaleDateString();

  return (
    <Link
      href={`/games/${game.id}`}
      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${badge.color}`}
        >
          {badge.label}
        </span>
        <div>
          <p className="font-medium">vs {opponent}</p>
          <p className="text-xs text-gray-500">
            {side} &middot; {game.endReason ?? "in progress"} &middot;{" "}
            {game.totalMoves} moves
          </p>
        </div>
      </div>
      <span className="text-xs text-gray-400">{date}</span>
    </Link>
  );
}
