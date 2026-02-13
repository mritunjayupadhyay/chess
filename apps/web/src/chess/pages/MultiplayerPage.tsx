"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { useMultiplayerSocket } from "../hooks/useMultiplayerSocket";
import { NameEntry } from "../components/multiplayer/NameEntry";
import { Lobby } from "../components/multiplayer/Lobby";
import { WaitingRoom } from "../components/multiplayer/WaitingRoom";
import { MultiplayerChessBoard } from "../containers/chessboard/MultiplayerChessBoard";

function MultiplayerPage(): React.JSX.Element {
    const playerName = useSelector((state: RootState) => state.multiplayer.playerName);
    const currentRoom = useSelector((state: RootState) => state.multiplayer.currentRoom);
    const gameActive = useSelector((state: RootState) => state.multiplayer.gameActive);

    const socketActions = useMultiplayerSocket();

    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        fetch(`${apiUrl}/api/members`)
            .then((res) => res.json())
            .then((data) => {
                console.log('Members:', data);
            })
            .catch((err) => {
                console.error('Failed to fetch members:', err);
            });
    }, []);

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
