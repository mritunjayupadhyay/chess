"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useUser } from "@clerk/nextjs";
import { RootState } from "../store";
import { multiplayerActions } from "../store/multiplayer.slice";
import { useMultiplayerSocket } from "../hooks/useMultiplayerSocket";
import { NameEntry } from "../components/multiplayer/NameEntry";
import { Lobby } from "../components/multiplayer/Lobby";
import { WaitingRoom } from "../components/multiplayer/WaitingRoom";
import { MultiplayerChessBoard } from "../containers/chessboard/MultiplayerChessBoard";

function MultiplayerPage(): React.JSX.Element {
    const dispatch = useDispatch();
    const { user } = useUser();
    const playerName = useSelector((state: RootState) => state.multiplayer.playerName);
    const currentRoom = useSelector((state: RootState) => state.multiplayer.currentRoom);
    const gameActive = useSelector((state: RootState) => state.multiplayer.gameActive);

    const socketActions = useMultiplayerSocket();

    useEffect(() => {
        if (!user?.id) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        // Look up member by Clerk ID, then ensure chess profile exists
        fetch(`${apiUrl}/api/members/clerk/${user.id}`)
            .then((res) => res.json())
            .then((member) => {
                if (!member?.id) return;
                dispatch(multiplayerActions.setMemberId(member.id));

                // Check if chess profile exists, create if not
                return fetch(`${apiUrl}/api/chess-profiles/member/${member.id}`)
                    .then((res) => res.json())
                    .then((profile) => {
                        if (!profile?.id) {
                            const username = [user.firstName, user.lastName].filter(Boolean).join('_') || user.id;
                            return fetch(`${apiUrl}/api/chess-profiles`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ memberId: member.id, username }),
                            });
                        }
                    });
            })
            .catch((err) => {
                console.error('Failed to set up chess profile:', err);
            });
    }, [user, dispatch]);

    if (!playerName) {
        return <NameEntry />;
    }

    if (!currentRoom) {
        return <Lobby {...socketActions} />;
    }

    if (!gameActive) {
        return <WaitingRoom {...socketActions} />;
    }

    return <MultiplayerChessBoard {...socketActions} />;
}

export { MultiplayerPage };
