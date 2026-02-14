import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@myproject/shared';
import {
    ICreateRoomPayload,
    IJoinRoomPayload,
    IMovePayload,
    ICastlingMovePayload,
    IPlayer,
    IServerGameState,
} from '@myproject/shared';
import { colorType, piecesToFen, toAlgebraicNotation, pieceType, allColorType } from '@myproject/chess-logic';
import { RoomService } from './room.service';
import { GameStateService } from './game-state.service';
import { ChessProfilesService } from '../chess-profiles/chess-profiles.service';
import { GamesService } from '../games/games.service';
import { MovesService } from '../moves/moves.service';
import { PendingGamesService } from '../games/pending-games.service';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly roomService: RoomService,
        private readonly gameStateService: GameStateService,
        private readonly chessProfilesService: ChessProfilesService,
        private readonly gamesService: GamesService,
        private readonly movesService: MovesService,
        private readonly pendingGamesService: PendingGamesService,
    ) {}

    handleConnection(client: Socket): void {
        console.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket): Promise<void> {
        console.log(`Client disconnected: ${client.id}`);
        const result = this.roomService.leaveRoom(client.id);
        if (result) {
            const { room, player } = result;
            if (room.status === 'playing') {
                // Game was active — declare other player winner
                const winner = room.players[0];
                if (winner?.color) {
                    const gameState = this.gameStateService.getGameState(room.roomId);

                    await this.finalizeGame(room.roomId, winner.color, 'disconnect');

                    this.server.to(room.roomId).emit(SOCKET_EVENTS.GAME_OVER, {
                        winner: winner.color,
                        reason: 'disconnect',
                        gameState: gameState,
                    });
                    this.gameStateService.removeGame(room.roomId);
                    this.roomService.setRoomStatus(room.roomId, 'finished');
                }
            }
            this.server.to(room.roomId).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, {
                player,
                room,
            });
            // Broadcast updated room list
            this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
        }
    }

    // ---- REST-based game flow: game:connect ----

    @SubscribeMessage(SOCKET_EVENTS.GAME_CONNECT)
    async handleGameConnect(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { gameId: string; chessProfileId: string },
    ): Promise<void> {
        const { gameId, chessProfileId } = payload;
        const pendingGame = this.pendingGamesService.getGame(gameId);

        if (!pendingGame) {
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Game not found' });
            return;
        }

        if (pendingGame.status === 'started') {
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Game has already started' });
            return;
        }

        const isPlayer = pendingGame.players.some(p => p.chessProfileId === chessProfileId);
        if (!isPlayer) {
            client.emit(SOCKET_EVENTS.ERROR, { message: 'You are not part of this game' });
            return;
        }

        // Register socket
        this.pendingGamesService.setPlayerSocket(gameId, chessProfileId, client.id);

        // Determine player color
        const playerColor: colorType = chessProfileId === pendingGame.whiteProfileId
            ? allColorType.LIGHT_COLOR
            : allColorType.DARK_COLOR;

        // Create/join room with pre-assigned color
        const player: IPlayer = {
            id: client.id,
            displayName: chessProfileId,
            chessProfileId,
            color: playerColor,
        };
        this.roomService.createOrJoinGameRoom(gameId, player);

        const roomId = `game:${gameId}`;
        client.join(roomId);

        // Check if both players are connected
        if (this.pendingGamesService.areBothPlayersConnected(gameId)) {
            await this.autoStartGame(gameId);
        } else {
            client.emit(SOCKET_EVENTS.GAME_WAITING, { gameId });
        }
    }

    private async autoStartGame(gameId: string): Promise<void> {
        const pendingGame = this.pendingGamesService.getGame(gameId);
        if (!pendingGame) return;

        const roomId = `game:${gameId}`;
        this.roomService.setRoomStatus(roomId, 'playing');
        const gameState = this.gameStateService.initializeGame(roomId);

        // Create DB record
        if (pendingGame.whiteProfileId && pendingGame.blackProfileId) {
            try {
                const dbGame = await this.gamesService.create({
                    whitePlayerId: pendingGame.whiteProfileId,
                    blackPlayerId: pendingGame.blackProfileId,
                    timeControl: pendingGame.timeControl,
                });
                gameState.dbGameId = dbGame.id;
                gameState.startedAt = Date.now();
            } catch (err) {
                console.error('Failed to create game record:', err);
            }
        }

        const room = this.roomService.getRoom(roomId);
        if (room) {
            for (const player of room.players) {
                this.server.to(player.id).emit(SOCKET_EVENTS.GAME_STARTED, {
                    gameState,
                    myColor: player.color,
                    room,
                });
            }
        }

        pendingGame.status = 'started';
    }

    // ---- Existing room-based flow ----

    @SubscribeMessage(SOCKET_EVENTS.ROOM_CREATE)
    async handleCreateRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: ICreateRoomPayload,
    ): Promise<void> {
        const player: IPlayer = {
            id: client.id,
            displayName: payload.playerName,
            memberId: payload.memberId,
        };

        // Look up chess profile
        if (payload.memberId) {
            const profile = await this.chessProfilesService.findByMemberId(payload.memberId).catch(() => null);
            if (profile) {
                player.chessProfileId = profile.id;
            }
        }

        const room = this.roomService.createRoom(payload.roomName, player);
        client.join(room.roomId);
        client.emit(SOCKET_EVENTS.ROOM_CREATED, { room });
        // Broadcast updated room list to all
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    @SubscribeMessage(SOCKET_EVENTS.ROOM_JOIN)
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: IJoinRoomPayload,
    ): Promise<void> {
        const player: IPlayer = {
            id: client.id,
            displayName: payload.playerName,
            memberId: payload.memberId,
        };

        // Look up chess profile
        if (payload.memberId) {
            const profile = await this.chessProfilesService.findByMemberId(payload.memberId).catch(() => null);
            if (profile) {
                player.chessProfileId = profile.id;
            }
        }

        const room = this.roomService.joinRoom(payload.roomId, player);
        if (!room) {
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Unable to join room. It may be full or already started.' });
            return;
        }
        client.join(room.roomId);
        client.emit(SOCKET_EVENTS.ROOM_JOINED, { room });
        // Notify other players in the room
        client.to(room.roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
        // Broadcast updated room list
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    @SubscribeMessage(SOCKET_EVENTS.ROOM_LEAVE)
    handleLeaveRoom(@ConnectedSocket() client: Socket): void {
        const result = this.roomService.leaveRoom(client.id);
        if (result) {
            const { room } = result;
            client.leave(room.roomId);
            this.server.to(room.roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
            this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
        }
    }

    @SubscribeMessage(SOCKET_EVENTS.ROOM_LIST)
    handleListRooms(@ConnectedSocket() client: Socket): void {
        client.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    @SubscribeMessage(SOCKET_EVENTS.GAME_START)
    async handleStartGame(@ConnectedSocket() client: Socket): Promise<void> {
        const room = this.roomService.getRoomBySocketId(client.id);
        if (!room) {
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Room not found' });
            return;
        }
        if (room.createdBy !== client.id) {
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Only the room creator can start the game' });
            return;
        }
        if (room.players.length !== 2) {
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Need 2 players to start' });
            return;
        }

        this.roomService.assignColors(room.roomId);
        this.roomService.setRoomStatus(room.roomId, 'playing');
        const gameState = this.gameStateService.initializeGame(room.roomId);

        // Create DB game record
        const updatedRoom = this.roomService.getRoom(room.roomId);
        if (updatedRoom) {
            const whitePlayer = updatedRoom.players.find(p => p.color === 'light');
            const blackPlayer = updatedRoom.players.find(p => p.color === 'dark');

            if (whitePlayer?.chessProfileId && blackPlayer?.chessProfileId) {
                try {
                    const dbGame = await this.gamesService.create({
                        whitePlayerId: whitePlayer.chessProfileId,
                        blackPlayerId: blackPlayer.chessProfileId,
                        timeControl: 'rapid',
                    });
                    gameState.dbGameId = dbGame.id;
                    gameState.startedAt = Date.now();
                } catch (err) {
                    console.error('Failed to create game record:', err);
                }
            }

            // Emit to each player individually with their color
            for (const player of updatedRoom.players) {
                this.server.to(player.id).emit(SOCKET_EVENTS.GAME_STARTED, {
                    gameState,
                    myColor: player.color,
                    room: updatedRoom,
                });
            }
        }
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    @SubscribeMessage(SOCKET_EVENTS.GAME_MOVE)
    async handleMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: IMovePayload,
    ): Promise<void> {
        const playerColor = this.roomService.getPlayerColor(payload.roomId, client.id);
        if (!playerColor) {
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Player not found in room' });
            return;
        }

        const result = this.gameStateService.validateAndExecuteMove(
            payload.roomId,
            payload.piecePosition,
            payload.targetPosition,
            playerColor,
        );

        if (!result.success) {
            client.emit(SOCKET_EVENTS.ERROR, { message: result.error || 'Invalid move' });
            return;
        }

        this.server.to(payload.roomId).emit(SOCKET_EVENTS.MOVE_RESULT, {
            gameState: result.gameState,
        });

        // Persist move to DB (fire-and-forget)
        if (result.gameState?.dbGameId) {
            this.persistMove(
                result.gameState,
                payload.roomId,
                payload.piecePosition,
                payload.targetPosition,
                playerColor,
                result.captured,
            );
        }

        // Check for checkmate
        if (result.gameState?.checkmate) {
            await this.finalizeGame(payload.roomId, playerColor, 'checkmate');

            this.server.to(payload.roomId).emit(SOCKET_EVENTS.GAME_OVER, {
                winner: playerColor,
                reason: 'checkmate',
                gameState: result.gameState,
            });
            this.roomService.setRoomStatus(payload.roomId, 'finished');
            this.gameStateService.removeGame(payload.roomId);
            this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
        }
    }

    @SubscribeMessage(SOCKET_EVENTS.GAME_CASTLING_MOVE)
    async handleCastlingMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: ICastlingMovePayload,
    ): Promise<void> {
        const playerColor = this.roomService.getPlayerColor(payload.roomId, client.id);
        if (!playerColor) {
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Player not found in room' });
            return;
        }

        const result = this.gameStateService.validateAndExecuteCastling(
            payload.roomId,
            payload.kingPosition,
            payload.rookPosition,
            playerColor,
        );

        if (!result.success) {
            client.emit(SOCKET_EVENTS.ERROR, { message: result.error || 'Invalid castling move' });
            return;
        }

        this.server.to(payload.roomId).emit(SOCKET_EVENTS.MOVE_RESULT, {
            gameState: result.gameState,
        });

        // Persist castling move to DB (fire-and-forget)
        if (result.gameState?.dbGameId) {
            const isKingside = payload.rookPosition.x === 7;
            this.persistCastlingMove(result.gameState, payload.roomId, playerColor, isKingside);
        }

        if (result.gameState?.checkmate) {
            await this.finalizeGame(payload.roomId, playerColor, 'checkmate');

            this.server.to(payload.roomId).emit(SOCKET_EVENTS.GAME_OVER, {
                winner: playerColor,
                reason: 'checkmate',
                gameState: result.gameState,
            });
            this.roomService.setRoomStatus(payload.roomId, 'finished');
            this.gameStateService.removeGame(payload.roomId);
            this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
        }
    }

    @SubscribeMessage(SOCKET_EVENTS.GAME_RESIGN)
    async handleResign(@ConnectedSocket() client: Socket): Promise<void> {
        const room = this.roomService.getRoomBySocketId(client.id);
        if (!room) return;

        const playerColor = this.roomService.getPlayerColor(room.roomId, client.id);
        if (!playerColor) return;

        const winnerColor: colorType = playerColor === 'light' ? 'dark' : 'light';
        const gameState = this.gameStateService.getGameState(room.roomId);

        await this.finalizeGame(room.roomId, winnerColor, 'resign');

        this.server.to(room.roomId).emit(SOCKET_EVENTS.GAME_OVER, {
            winner: winnerColor,
            reason: 'resign',
            gameState,
        });

        this.roomService.setRoomStatus(room.roomId, 'finished');
        this.gameStateService.removeGame(room.roomId);
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    // ---- Private DB persistence helpers ----

    private persistMove(
        gameState: IServerGameState,
        roomId: string,
        from: { x: number; y: number },
        to: { x: number; y: number },
        playerColor: colorType,
        captured?: pieceType,
    ): void {
        const room = this.roomService.getRoom(roomId);
        if (!room || !gameState.dbGameId) return;

        const player = room.players.find(p => p.color === playerColor);
        if (!player?.chessProfileId) return;

        const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
        if (!lastMove) return;

        const notation = toAlgebraicNotation({
            pieceType: lastMove.pieceType,
            from,
            to,
            captured,
            isCheck: !!gameState.check,
            isCheckmate: !!gameState.checkmate,
        });

        const fen = piecesToFen(gameState.pieces, gameState.activeColor, gameState.castlingData);
        const ply = gameState.moveHistory.length;

        this.movesService.create({
            gameId: gameState.dbGameId,
            ply,
            playerId: player.chessProfileId,
            notation,
            fenAfter: fen,
        }).catch(err => console.error('Failed to persist move:', err));
    }

    private persistCastlingMove(
        gameState: IServerGameState,
        roomId: string,
        playerColor: colorType,
        isKingside: boolean,
    ): void {
        const room = this.roomService.getRoom(roomId);
        if (!room || !gameState.dbGameId) return;

        const player = room.players.find(p => p.color === playerColor);
        if (!player?.chessProfileId) return;

        const notation = toAlgebraicNotation({
            pieceType: pieceType.KING,
            from: { x: 0, y: 0 },
            to: { x: 0, y: 0 },
            isCastlingKingside: isKingside,
            isCastlingQueenside: !isKingside,
            isCheck: !!gameState.check,
            isCheckmate: !!gameState.checkmate,
        });

        const fen = piecesToFen(gameState.pieces, gameState.activeColor, gameState.castlingData);
        const ply = gameState.moveHistory.length;

        this.movesService.create({
            gameId: gameState.dbGameId,
            ply,
            playerId: player.chessProfileId,
            notation,
            fenAfter: fen,
        }).catch(err => console.error('Failed to persist castling move:', err));
    }

    private async finalizeGame(
        roomId: string,
        winnerColor: colorType | null,
        reason: 'checkmate' | 'resign' | 'disconnect',
    ): Promise<void> {
        const gameState = this.gameStateService.getGameState(roomId);
        const room = this.roomService.getRoom(roomId);
        if (!gameState?.dbGameId || !room) return;

        const whitePlayer = room.players.find(p => p.color === 'light');
        const blackPlayer = room.players.find(p => p.color === 'dark');
        if (!whitePlayer?.chessProfileId || !blackPlayer?.chessProfileId) return;

        let result: 'white_win' | 'black_win' | 'draw' | 'abandoned';
        let winnerId: string | null = null;

        if (winnerColor === 'light') {
            result = 'white_win';
            winnerId = whitePlayer.chessProfileId;
        } else if (winnerColor === 'dark') {
            result = 'black_win';
            winnerId = blackPlayer.chessProfileId;
        } else {
            result = 'draw';
        }

        const finalFen = piecesToFen(gameState.pieces, gameState.activeColor, gameState.castlingData);
        const durationSeconds = gameState.startedAt
            ? Math.round((Date.now() - gameState.startedAt) / 1000)
            : 0;

        try {
            await this.gamesService.endGame(gameState.dbGameId, {
                result,
                endReason: reason,
                winnerId,
                finalFen,
                durationSeconds,
                totalMoves: gameState.moveHistory.length,
            });

            // Update stats for both players
            if (result === 'white_win') {
                await Promise.all([
                    this.chessProfilesService.incrementStats(whitePlayer.chessProfileId, 'win'),
                    this.chessProfilesService.incrementStats(blackPlayer.chessProfileId, 'loss'),
                ]);
            } else if (result === 'black_win') {
                await Promise.all([
                    this.chessProfilesService.incrementStats(whitePlayer.chessProfileId, 'loss'),
                    this.chessProfilesService.incrementStats(blackPlayer.chessProfileId, 'win'),
                ]);
            } else {
                await Promise.all([
                    this.chessProfilesService.incrementStats(whitePlayer.chessProfileId, 'draw'),
                    this.chessProfilesService.incrementStats(blackPlayer.chessProfileId, 'draw'),
                ]);
            }
        } catch (err) {
            console.error('Failed to finalize game:', err);
        }
    }
}
