"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getGameById, getMemberByClerkId, getChessProfileByMemberId, createChessProfile } from "../../lib/api";
import { GameDetailPage } from "./GameDetailPage";
import { LiveGameView } from "../components/multiplayer/LiveGameView";

interface GamePageProps {
    gameId: string;
}

function GamePage({ gameId }: GamePageProps): React.JSX.Element {
    const { user } = useUser();
    const [mode, setMode] = useState<'loading' | 'completed' | 'live'>('loading');
    const [chessProfileId, setChessProfileId] = useState<string | null>(null);

    useEffect(() => {
        async function determine() {
            // Try to load from DB
            try {
                const game = await getGameById(gameId);
                if (game && game.result) {
                    setMode('completed');
                    return;
                }
            } catch {
                // Not in DB — might be a pending game
            }

            // It's a pending/active game — need chess profile
            if (user?.id) {
                try {
                    const member = await getMemberByClerkId(user.id);
                    if (member?.id) {
                        let profile = await getChessProfileByMemberId(member.id).catch(() => null);
                        if (!profile?.id) {
                            const username = [user.firstName, user.lastName].filter(Boolean).join('_') || user.id;
                            profile = await createChessProfile(member.id, username);
                        }
                        setChessProfileId(profile.id);
                    }
                } catch (err) {
                    console.error('Failed to set up chess profile:', err);
                }
            }
            setMode('live');
        }

        determine();
    }, [gameId, user]);

    if (mode === 'loading') {
        return (
            <main className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading game...</p>
            </main>
        );
    }

    if (mode === 'completed') {
        return <GameDetailPage gameId={gameId} />;
    }

    // Live mode
    if (!chessProfileId) {
        return (
            <main className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Setting up...</p>
            </main>
        );
    }

    return <LiveGameView gameId={gameId} chessProfileId={chessProfileId} />;
}

export { GamePage };
