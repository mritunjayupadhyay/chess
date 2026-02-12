import type { colorType, IPiece, IBoxPosition, IPosition, ICastlingData, pieceType } from '@myproject/chess-logic';

// ---- Player & Room ----

export interface IPlayer {
    id: string;
    displayName: string;
    color?: colorType;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface IGameRoom {
    roomId: string;
    roomName: string;
    players: IPlayer[];
    status: RoomStatus;
    createdBy: string;
    createdAt: number;
}

export interface IRoomSummary {
    roomId: string;
    roomName: string;
    playerCount: number;
    status: RoomStatus;
}

// ---- Server Game State ----

export interface IMoveRecord {
    pieceType: pieceType;
    from: IPosition;
    to: IPosition;
    color: colorType;
    captured?: pieceType;
    timestamp: number;
}

export interface IServerGameState {
    pieces: IPiece[];
    allPositions: Record<string, IBoxPosition>;
    castlingData: Record<colorType, ICastlingData>;
    activeColor: colorType;
    check: colorType | undefined;
    checkmate: colorType | undefined;
    moveHistory: IMoveRecord[];
}

// ---- Client-to-Server Payloads ----

export interface ICreateRoomPayload {
    roomName: string;
    playerName: string;
}

export interface IJoinRoomPayload {
    roomId: string;
    playerName: string;
}

export interface IMovePayload {
    roomId: string;
    piecePosition: IPosition;
    targetPosition: IPosition;
}

export interface ICastlingMovePayload {
    roomId: string;
    kingPosition: IPosition;
    rookPosition: IPosition;
}

// ---- Server-to-Client Payloads ----

export interface IRoomCreatedPayload {
    room: IGameRoom;
}

export interface IRoomJoinedPayload {
    room: IGameRoom;
}

export interface IGameStartedPayload {
    gameState: IServerGameState;
    myColor: colorType;
    room: IGameRoom;
}

export interface IMoveResultPayload {
    gameState: IServerGameState;
}

export interface IGameOverPayload {
    winner: colorType;
    reason: 'checkmate' | 'resign' | 'disconnect';
    gameState: IServerGameState;
}

export interface IPlayerDisconnectedPayload {
    player: IPlayer;
    room: IGameRoom;
}

export interface IErrorPayload {
    message: string;
}
