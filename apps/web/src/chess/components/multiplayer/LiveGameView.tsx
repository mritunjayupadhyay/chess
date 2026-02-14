"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { connectSocket, disconnectSocket, getSocket } from "../../../lib/socket";
import { SOCKET_EVENTS } from "@myproject/shared";
import type {
    IGameStartedPayload,
    IMoveResultPayload,
    IGameOverPayload,
    IErrorPayload,
    IGameRoom,
} from "@myproject/shared";
import type { IPosition } from "@myproject/chess-logic";
import { RootState } from "../../store";
import { multiplayerActions } from "../../store/multiplayer.slice";
import { GameWaitingScreen } from "./GameWaitingScreen";
import { MultiplayerChessBoard } from "../../containers/chessboard/MultiplayerChessBoard";

interface LiveGameViewProps {
    gameId: string;
    chessProfileId: string;
}

function LiveGameView({ gameId, chessProfileId }: LiveGameViewProps): React.JSX.Element {
    const dispatch = useDispatch();
    const gameActive = useSelector((state: RootState) => state.multiplayer.gameActive);
    const currentRoom = useSelector((state: RootState) => state.multiplayer.currentRoom);
    const connectedRef = useRef(false);

    useEffect(() => {
        if (connectedRef.current) return;
        connectedRef.current = true;

        const socket = connectSocket();

        socket.on("connect", () => {
            dispatch(multiplayerActions.setConnected(true));
            dispatch(multiplayerActions.setPlayerId(socket.id || ""));
            // Emit game:connect once socket is ready
            socket.emit(SOCKET_EVENTS.GAME_CONNECT, { gameId, chessProfileId });
        });

        socket.on("disconnect", () => {
            dispatch(multiplayerActions.setConnected(false));
        });

        socket.on(SOCKET_EVENTS.GAME_WAITING, () => {
            // Already showing waiting screen by default
        });

        socket.on(SOCKET_EVENTS.GAME_STARTED, (payload: IGameStartedPayload) => {
            dispatch(multiplayerActions.gameStarted(payload));
        });

        socket.on(SOCKET_EVENTS.MOVE_RESULT, (payload: IMoveResultPayload) => {
            dispatch(multiplayerActions.updateGameState(payload.gameState));
        });

        socket.on(SOCKET_EVENTS.GAME_OVER, (payload: IGameOverPayload) => {
            dispatch(multiplayerActions.updateGameState(payload.gameState));
            dispatch(multiplayerActions.gameOver({
                winner: payload.winner,
                reason: payload.reason,
            }));
        });

        socket.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, (payload: { room: IGameRoom }) => {
            dispatch(multiplayerActions.setCurrentRoom(payload.room));
        });

        socket.on(SOCKET_EVENTS.ERROR, (payload: IErrorPayload) => {
            dispatch(multiplayerActions.setError(payload.message));
        });

        // If socket is already connected, emit immediately
        if (socket.connected) {
            dispatch(multiplayerActions.setPlayerId(socket.id || ""));
            socket.emit(SOCKET_EVENTS.GAME_CONNECT, { gameId, chessProfileId });
        }

        return () => {
            socket.removeAllListeners();
            disconnectSocket();
            connectedRef.current = false;
        };
    }, [gameId, chessProfileId, dispatch]);

    const makeMove = useCallback((roomId: string, piecePosition: IPosition, targetPosition: IPosition) => {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.GAME_MOVE, { roomId, piecePosition, targetPosition });
    }, []);

    const makeCastlingMove = useCallback((roomId: string, kingPosition: IPosition, rookPosition: IPosition) => {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.GAME_CASTLING_MOVE, { roomId, kingPosition, rookPosition });
    }, []);

    const resign = useCallback(() => {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.GAME_RESIGN);
    }, []);

    if (!gameActive || !currentRoom) {
        return <GameWaitingScreen gameId={gameId} />;
    }

    return (
        <MultiplayerChessBoard
            makeMove={makeMove}
            makeCastlingMove={makeCastlingMove}
            resign={resign}
        />
    );
}

export { LiveGameView };
