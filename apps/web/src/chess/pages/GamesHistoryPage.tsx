"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useChessProfile } from "../hooks/useChessProfile";
import { useGameHistory } from "../hooks/useGameHistory";
import { GameListItem } from "../components/games/GameListItem";

export function GamesHistoryPage() {
  const { profile, loading: profileLoading } = useChessProfile();
  const { games, loading, hasMore, loadMore, initialLoaded } = useGameHistory(
    profile?.id,
  );

  useEffect(() => {
    if (profile?.id && !initialLoaded) loadMore();
  }, [profile?.id, initialLoaded, loadMore]);

  if (profileLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:underline text-sm">
        &larr; Back
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">Game History</h1>

      {games.length === 0 && !loading ? (
        <p className="text-gray-500">No games played yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {games.map((game) => (
            <GameListItem
              key={game.id}
              game={game}
              profileId={profile!.id}
            />
          ))}
        </div>
      )}

      {loading && (
        <p className="text-gray-500 text-sm text-center mt-4">Loading...</p>
      )}

      {hasMore && !loading && games.length > 0 && (
        <button
          onClick={loadMore}
          className="mt-4 w-full py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Load More
        </button>
      )}
    </main>
  );
}
