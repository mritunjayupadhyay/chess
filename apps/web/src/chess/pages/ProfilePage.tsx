"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useChessProfile } from "../hooks/useChessProfile";
import { useGameHistory } from "../hooks/useGameHistory";
import { updateChessProfile } from "../../lib/api";
import { GameListItem } from "../components/games/GameListItem";

export function ProfilePage() {
  const { user } = useUser();
  const { profile, loading, error, setProfile } = useChessProfile();
  const {
    games,
    loading: gamesLoading,
    loadMore,
    initialLoaded,
  } = useGameHistory(profile?.id);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setUsername(profile.username);
  }, [profile]);

  useEffect(() => {
    if (profile?.id && !initialLoaded) loadMore();
  }, [profile?.id, initialLoaded, loadMore]);

  const handleSave = async () => {
    if (!profile || !username.trim()) return;
    setSaving(true);
    try {
      const updated = await updateChessProfile(profile.id, username.trim());
      setProfile(updated);
      setEditing(false);
    } catch {
      // keep editing open on error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Error: {error}</p>
      </main>
    );
  }

  const winRate =
    profile && profile.gamesPlayed > 0
      ? ((profile.wins / profile.gamesPlayed) * 100).toFixed(1)
      : "0.0";

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <Link href="/" className="text-blue-600 hover:underline text-sm">
        &larr; Back
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">My Profile</h1>

      {/* User info */}
      <div className="mb-6">
        <p className="text-gray-700 font-semibold">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-sm text-gray-500">
          {user?.primaryEmailAddress?.emailAddress}
        </p>
      </div>

      {/* Username */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Chess Username
        </label>
        {editing ? (
          <div className="flex gap-2">
            <input
              className="border rounded px-3 py-1.5 text-sm flex-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setUsername(profile?.username ?? "");
              }}
              className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium">{profile?.username}</span>
            <button
              onClick={() => setEditing(true)}
              className="text-blue-600 text-sm hover:underline"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      {profile && (
        <div className="grid grid-cols-2 gap-3 mb-8">
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

      {/* Recent games */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Recent Games</h2>
          <Link
            href="/games"
            className="text-blue-600 text-sm hover:underline"
          >
            View All
          </Link>
        </div>
        {gamesLoading && games.length === 0 ? (
          <p className="text-gray-500 text-sm">Loading games...</p>
        ) : games.length === 0 ? (
          <p className="text-gray-500 text-sm">No games played yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {games.slice(0, 5).map((game) => (
              <GameListItem
                key={game.id}
                game={game}
                profileId={profile!.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
