"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGame, joinGame } from "../../../lib/api";

interface LobbyProps {
    chessProfileId: string;
}

function Lobby({ chessProfileId }: LobbyProps): React.JSX.Element {
    const router = useRouter();
    const [timeControl, setTimeControl] = useState<'blitz' | 'rapid'>('rapid');
    const [gameIdInput, setGameIdInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setCreating(true);
        try {
            const result = await createGame({ timeControl, chessProfileId });
            router.push(`/games/${result.id}`);
        } catch (err) {
            setError((err as Error).message);
            setCreating(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = gameIdInput.trim();
        if (!trimmed) return;
        setError(null);
        setJoining(true);
        try {
            await joinGame(trimmed, chessProfileId);
            router.push(`/games/${trimmed}`);
        } catch (err) {
            setError((err as Error).message);
            setJoining(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full mx-4">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
                    Multiplayer Chess
                </h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Create Game */}
                <form onSubmit={handleCreate} className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Create a new game
                    </label>
                    <div className="flex gap-2 mb-3">
                        <button
                            type="button"
                            onClick={() => setTimeControl('blitz')}
                            className={`flex-1 py-2 px-4 rounded-md border transition-colors ${
                                timeControl === 'blitz'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            Blitz
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeControl('rapid')}
                            className={`flex-1 py-2 px-4 rounded-md border transition-colors ${
                                timeControl === 'rapid'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            Rapid
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {creating ? "Creating..." : "Create Game"}
                    </button>
                </form>

                <div className="border-t border-gray-200 mb-6" />

                {/* Join Game */}
                <form onSubmit={handleJoin}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Join a game
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={gameIdInput}
                            onChange={(e) => setGameIdInput(e.target.value)}
                            placeholder="Paste game ID"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                        />
                        <button
                            type="submit"
                            disabled={joining || gameIdInput.trim().length === 0}
                            className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {joining ? "Joining..." : "Join"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export { Lobby };
