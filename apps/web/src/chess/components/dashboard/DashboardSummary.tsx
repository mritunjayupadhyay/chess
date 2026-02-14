"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { useChessProfile } from "../../hooks/useChessProfile";

export function DashboardSummary() {
  const { user } = useUser();
  const { profile, loading } = useChessProfile();

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  const winRate =
    profile && profile.gamesPlayed > 0
      ? ((profile.wins / profile.gamesPlayed) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
        <div className="text-gray-700">
          <p className="font-semibold">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-gray-500">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>

      {profile && (
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{profile.gamesPlayed}</p>
            <p className="text-xs text-gray-500">Games Played</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{profile.wins}</p>
            <p className="text-xs text-gray-500">Wins</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{profile.losses}</p>
            <p className="text-xs text-gray-500">Losses</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{profile.draws}</p>
            <p className="text-xs text-gray-500">Draws ({winRate}% WR)</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 w-full">
        <Link
          href="/multiplayer"
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
        >
          Play Multiplayer
        </Link>
        <Link
          href="/profile"
          className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-center"
        >
          My Profile
        </Link>
        <Link
          href="/games"
          className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-center"
        >
          Game History
        </Link>
        <Link
          href="/leaderboard"
          className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-center"
        >
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
