"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Lobby } from "../components/multiplayer/Lobby";
import {
    getMemberByClerkId,
    createMember,
    getChessProfileByMemberId,
    createChessProfile,
} from "../../lib/api";

function MultiplayerPage(): React.JSX.Element {
    const { user, isLoaded } = useUser();
    const [chessProfileId, setChessProfileId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user?.id) {
            setLoading(false);
            setError("Please sign in to play multiplayer.");
            return;
        }

        async function setup() {
            try {
                let member = await getMemberByClerkId(user!.id).catch(() => null);
                if (!member?.id) {
                    member = await createMember({
                        clerkId: user!.id,
                        email: user!.primaryEmailAddress?.emailAddress || '',
                        firstName: user!.firstName || '',
                        lastName: user!.lastName || '',
                    });
                }

                let profile = await getChessProfileByMemberId(member.id).catch(() => null);
                if (!profile?.id) {
                    const username = [user!.firstName, user!.lastName].filter(Boolean).join('_') || user!.id;
                    profile = await createChessProfile(member.id, username);
                }
                setChessProfileId(profile.id);
            } catch (err) {
                console.error('Failed to set up chess profile:', err);
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        }

        setup();
    }, [user, isLoaded]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (error || !chessProfileId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-500">{error ?? "Something went wrong."}</p>
            </div>
        );
    }

    return <Lobby chessProfileId={chessProfileId} />;
}

export { MultiplayerPage };
