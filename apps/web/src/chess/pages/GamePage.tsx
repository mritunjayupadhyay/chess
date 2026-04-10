"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getGameById, getMemberByClerkId, getChessProfileByMemberId, createChessProfile, createGame } from "../../lib/api";
import { GameDetailPage } from "./GameDetailPage";
import { LiveGameView } from "../components/multiplayer/LiveGameView";

interface GamePageProps {
    gameId: string;
}

function GamePage({ gameId }: GamePageProps): React.JSX.Element {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [mode, setMode] = useState<'loading' | 'completed' | 'live'>('loading');
    const [chessProfileId, setChessProfileId] = useState<string | null>(null);

    const handleNewGame = useCallback(async () => {
        if (!chessProfileId) return;
        try {
            // const game = await createGame({ timeControl: 'rapid', chessProfileId });
            router.push(`/multiplayer`);
        } catch (err) {
            console.error('Failed to create new game:', err);
        }
    }, [chessProfileId, router]);

    const handleCancel = useCallback(() => {
        setMode('completed');
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        let cancelled = false;

        async function determine() {
            // Try to load from DB / pending
            try {
                const game = await getGameById(gameId);
                if (cancelled) return;
                if (game && game.result) {
                    setMode('completed');
                    return;
                }
            } catch (err) {
                if (cancelled) return;
                // Not found in DB is expected for pending in-memory games — fall through to live mode.
                // Any other error: also fall through and let the socket layer surface a real error.
                console.warn('getGameById failed, treating as live/pending game:', err);
            }

            // It's a pending/active game — need chess profile
            if (user?.id) {
                try {
                    const member = await getMemberByClerkId(user.id);
                    if (cancelled) return;
                    if (member?.id) {
                        let profile = await getChessProfileByMemberId(member.id).catch(() => null);
                        if (cancelled) return;
                        if (!profile?.id) {
                            const username = [user.firstName, user.lastName].filter(Boolean).join('_') || user.id;
                            profile = await createChessProfile(member.id, username);
                            if (cancelled) return;
                        }
                        setChessProfileId(profile.id);
                    }
                } catch (err) {
                    if (cancelled) return;
                    console.error('Failed to set up chess profile:', err);
                }
            }
            setMode('live');
        }

        determine();
        return () => { cancelled = true; };
    }, [gameId, user, isLoaded]);

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

    return <LiveGameView gameId={gameId} chessProfileId={chessProfileId} onNewGame={handleNewGame} onCancel={handleCancel} />;
}

export { GamePage };
