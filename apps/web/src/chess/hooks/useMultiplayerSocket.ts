"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { connectSocket, disconnectSocket, getSocket } from '../../lib/socket';
import { multiplayerActions } from '../store/multiplayer.slice';
import { SOCKET_EVENTS } from '@myproject/shared';
import type {
    IRoomCreatedPayload,
    IRoomJoinedPayload,
    IGameStartedPayload,
    IMoveResultPayload,
    IGameOverPayload,
    IPlayerDisconnectedPayload,
    IErrorPayload,
    IRoomSummary,
    IGameRoom,
} from '@myproject/shared';
import type { IPosition } from '@myproject/chess-logic';

export function useMultiplayerSocket() {
    const dispatch = useDispatch();
    const listenersSetUp = useRef(false);

    useEffect(() => {
        const socket = connectSocket();

        socket.on('connect', () => {
            dispatch(multiplayerActions.setConnected(true));
            dispatch(multiplayerActions.setPlayerId(socket.id || ''));
        });

        socket.on('disconnect', () => {
            dispatch(multiplayerActions.setConnected(false));
        });

        socket.on(SOCKET_EVENTS.ROOM_CREATED, (payload: IRoomCreatedPayload) => {
            dispatch(multiplayerActions.setCurrentRoom(payload.room));
        });

        socket.on(SOCKET_EVENTS.ROOM_JOINED, (payload: IRoomJoinedPayload) => {
            dispatch(multiplayerActions.setCurrentRoom(payload.room));
        });

        socket.on(SOCKET_EVENTS.ROOM_UPDATED, (payload: { room: IGameRoom }) => {
            dispatch(multiplayerActions.setCurrentRoom(payload.room));
        });

        socket.on(SOCKET_EVENTS.ROOM_LIST_UPDATED, (roomList: IRoomSummary[]) => {
            dispatch(multiplayerActions.setRoomList(roomList));
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

        socket.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, (payload: IPlayerDisconnectedPayload) => {
            dispatch(multiplayerActions.setCurrentRoom(payload.room));
        });

        socket.on(SOCKET_EVENTS.ERROR, (payload: IErrorPayload) => {
            dispatch(multiplayerActions.setError(payload.message));
        });

        listenersSetUp.current = true;

        return () => {
            socket.removeAllListeners();
            disconnectSocket();
            listenersSetUp.current = false;
        };
    }, [dispatch]);

    const createRoom = useCallback((roomName: string, playerName: string, memberId?: string) => {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.ROOM_CREATE, { roomName, playerName, memberId: memberId || '' });
    }, []);

    const joinRoom = useCallback((roomId: string, playerName: string, memberId?: string) => {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId, playerName, memberId: memberId || '' });
    }, []);

    const leaveRoom = useCallback(() => {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.ROOM_LEAVE);
        dispatch(multiplayerActions.setCurrentRoom(null));
    }, [dispatch]);

    const listRooms = useCallback(() => {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.ROOM_LIST);
    }, []);

    const startGame = useCallback(() => {
        const socket = getSocket();
        socket.emit(SOCKET_EVENTS.GAME_START);
    }, []);

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

    return {
        createRoom,
        joinRoom,
        leaveRoom,
        listRooms,
        startGame,
        makeMove,
        makeCastlingMove,
        resign,
    };
}
