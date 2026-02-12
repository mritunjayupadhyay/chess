import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { colorType } from '@myproject/chess-logic';
import type { IGameRoom, IRoomSummary, IServerGameState } from '@myproject/shared';

export interface IMultiplayerState {
    connected: boolean;
    playerName: string;
    playerId: string;
    currentRoom: IGameRoom | null;
    roomList: IRoomSummary[];
    myColor: colorType | undefined;
    gameActive: boolean;
    gameState: IServerGameState | null;
    gameOver: { winner: colorType; reason: string } | null;
    error: string | null;
}

const initialState: IMultiplayerState = {
    connected: false,
    playerName: '',
    playerId: '',
    currentRoom: null,
    roomList: [],
    myColor: undefined,
    gameActive: false,
    gameState: null,
    gameOver: null,
    error: null,
};

const slice = createSlice({
    name: 'multiplayer',
    initialState,
    reducers: {
        setConnected(state, action: PayloadAction<boolean>) {
            state.connected = action.payload;
        },
        setPlayerName(state, action: PayloadAction<string>) {
            state.playerName = action.payload;
        },
        setPlayerId(state, action: PayloadAction<string>) {
            state.playerId = action.payload;
        },
        setCurrentRoom(state, action: PayloadAction<IGameRoom | null>) {
            state.currentRoom = action.payload;
        },
        setRoomList(state, action: PayloadAction<IRoomSummary[]>) {
            state.roomList = action.payload;
        },
        gameStarted(state, action: PayloadAction<{ gameState: IServerGameState; myColor: colorType; room: IGameRoom }>) {
            state.gameState = action.payload.gameState;
            state.myColor = action.payload.myColor;
            state.currentRoom = action.payload.room;
            state.gameActive = true;
            state.gameOver = null;
        },
        updateGameState(state, action: PayloadAction<IServerGameState>) {
            state.gameState = action.payload;
        },
        gameOver(state, action: PayloadAction<{ winner: colorType; reason: string }>) {
            state.gameActive = false;
            state.gameOver = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        resetMultiplayer() {
            return initialState;
        },
    },
});

export const multiplayerActions = slice.actions;
export const multiplayerReducer = slice.reducer;
