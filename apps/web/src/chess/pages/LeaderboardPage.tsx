"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ChessProfile } from "../../lib/api-types";
import { getLeaderboard } from "../../lib/api";
import { useChessProfile } from "../hooks/useChessProfile";

export function LeaderboardPage() {
  const { profile: myProfile } = useChessProfile();
  const [profiles, setProfiles] = useState<ChessProfile[]>([]);
  const [sortBy, setSortBy] = useState<"wins" | "gamesPlayed">("wins");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getLeaderboard(sortBy);
        if (!cancelled) setProfiles(data);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sortBy]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:underline text-sm">
        &larr; Back
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-4">Leaderboard</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy("wins")}
          className={`px-3 py-1.5 rounded text-sm ${
            sortBy === "wins"
              ? "bg-blue-600 text-white"
              : "border hover:bg-gray-50"
          }`}
        >
          By Wins
        </button>
        <button
          onClick={() => setSortBy("gamesPlayed")}
          className={`px-3 py-1.5 rounded text-sm ${
            sortBy === "gamesPlayed"
              ? "bg-blue-600 text-white"
              : "border hover:bg-gray-50"
          }`}
        >
          By Games Played
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : profiles.length === 0 ? (
        <p className="text-gray-500">No profiles yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="pb-2 pr-2">#</th>
                <th className="pb-2 pr-2">Username</th>
                <th className="pb-2 pr-2 text-center">Games</th>
                <th className="pb-2 pr-2 text-center">W</th>
                <th className="pb-2 pr-2 text-center">L</th>
                <th className="pb-2 pr-2 text-center">D</th>
                <th className="pb-2 text-center">Win %</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => {
                const isMe = myProfile?.id === p.id;
                const wr =
                  p.gamesPlayed > 0
                    ? ((p.wins / p.gamesPlayed) * 100).toFixed(1)
                    : "0.0";
                return (
                  <tr
                    key={p.id}
                    className={`border-b ${isMe ? "bg-blue-50 font-semibold" : ""}`}
                  >
                    <td className="py-2 pr-2">{i + 1}</td>
                    <td className="py-2 pr-2">
                      {p.username}
                      {isMe && (
                        <span className="ml-1 text-xs text-blue-600">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-center">{p.gamesPlayed}</td>
                    <td className="py-2 pr-2 text-center">{p.wins}</td>
                    <td className="py-2 pr-2 text-center">{p.losses}</td>
                    <td className="py-2 pr-2 text-center">{p.draws}</td>
                    <td className="py-2 text-center">{wr}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
