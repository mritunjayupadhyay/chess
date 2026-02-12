"use client";

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
