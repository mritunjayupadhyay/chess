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

    private disconnectTimers = new Map<string, NodeJS.Timeout>();
    private readonly RECONNECT_GRACE_PERIOD_MS = 30_000;

    constructor(
        private readonly roomService: RoomService,
        private readonly gameStateService: GameStateService,
        private readonly chessProfilesService: ChessProfilesService,
        private readonly gamesService: GamesService,
        private readonly movesService: MovesService,
        private readonly pendingGamesService: PendingGamesService,
    ) {}

    handleConnection(client: Socket): void {
        console.log(`\n[CONNECTION ⬇] client=${client.id} connected`);
    }

    async handleDisconnect(client: Socket): Promise<void> {
        console.log(`\n[DISCONNECT ⬇] client=${client.id} disconnected`);

        const room = this.roomService.getRoomBySocketId(client.id);

        if (room && room.status === 'playing') {
            console.log(`[DISCONNECT] client=${client.id} was in active game room=${room.roomId}`);
            // Active game — grace period for reconnection
            const result = this.roomService.markPlayerDisconnected(client.id);
            if (result) {
                const { room: updatedRoom, player: disconnectedPlayer } = result;
                const otherPlayer = updatedRoom.players.find(p => p.id !== disconnectedPlayer.id);

                if (otherPlayer) {
                    console.log(`[DISCONNECT ⬆ OPPONENT_DISCONNECTED] notifying player=${otherPlayer.id} that ${disconnectedPlayer.displayName} disconnected`);
                    this.server.to(otherPlayer.id).emit(SOCKET_EVENTS.OPPONENT_DISCONNECTED, {
                        player: disconnectedPlayer,
                    });
                }

                // Start forfeit timer
                if (disconnectedPlayer.chessProfileId) {
                    const timerKey = `${updatedRoom.roomId}:${disconnectedPlayer.chessProfileId}`;
                    console.log(`[DISCONNECT] starting ${this.RECONNECT_GRACE_PERIOD_MS}ms forfeit timer key=${timerKey}`);
                    const timer = setTimeout(() => {
                        this.forfeitDisconnectedPlayer(updatedRoom.roomId, disconnectedPlayer.chessProfileId!);
                    }, this.RECONNECT_GRACE_PERIOD_MS);
                    this.disconnectTimers.set(timerKey, timer);
                }
            }
            return;
        }

        // Not in an active game — immediate leave
        const result = this.roomService.leaveRoom(client.id);
        if (result) {
            const { room: leftRoom, player } = result;
            console.log(`[DISCONNECT ⬆ PLAYER_DISCONNECTED] player=${player.displayName} left room=${leftRoom.roomId}`);
            this.server.to(leftRoom.roomId).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, {
                player,
                room: leftRoom,
            });
            console.log(`[DISCONNECT ⬆ ROOM_LIST_UPDATED] broadcasting updated room list`);
            this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
        } else {
            console.log(`[DISCONNECT] client=${client.id} was not in any room`);
        }
    }

    // ---- REST-based game flow: game:connect ----

    @SubscribeMessage(SOCKET_EVENTS.GAME_CONNECT)
    async handleGameConnect(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { gameId: string; chessProfileId: string },
    ): Promise<void> {
        const { gameId, chessProfileId } = payload;
        console.log(`\n[GAME_CONNECT ⬇ received] client=${client.id}`, JSON.stringify({ gameId, chessProfileId }));

        const pendingGame = this.pendingGamesService.getGame(gameId);

        if (!pendingGame) {
            console.log(`[GAME_CONNECT ✗] Game not found gameId=${gameId}`);
            console.log(`[GAME_CONNECT ⬆ ERROR] -> client=${client.id} "Game not found"`);
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Game not found' });
            return;
        }

        console.log(`[GAME_CONNECT] pendingGame status=${pendingGame.status} players=${JSON.stringify(pendingGame.players.map(p => p.chessProfileId))}`);

        if (pendingGame.status === 'started') {
            console.log(`[GAME_CONNECT] game already started, attempting reconnection`);
            // Attempt reconnection
            const isReconnectingPlayer = pendingGame.players.some(p => p.chessProfileId === chessProfileId);
            if (!isReconnectingPlayer) {
                console.log(`[GAME_CONNECT ✗] chessProfileId=${chessProfileId} is not part of this game`);
                console.log(`[GAME_CONNECT ⬆ ERROR] -> client=${client.id} "You are not part of this game"`);
                client.emit(SOCKET_EVENTS.ERROR, { message: 'You are not part of this game' });
                return;
            }

            const roomId = `game:${gameId}`;
            const room = this.roomService.getRoom(roomId);
            const gameState = this.gameStateService.getGameState(roomId);

            if (!room || !gameState) {
                console.log(`[GAME_CONNECT ✗] Game has already ended roomId=${roomId}`);
                console.log(`[GAME_CONNECT ⬆ ERROR] -> client=${client.id} "Game has already ended"`);
                client.emit(SOCKET_EVENTS.ERROR, { message: 'Game has already ended' });
                return;
            }

            // Find the existing player entry in the room
            const existingPlayer = room.players.find(p => p.chessProfileId === chessProfileId);
            if (!existingPlayer) {
                console.log(`[GAME_CONNECT ✗] Player not found in room`);
                console.log(`[GAME_CONNECT ⬆ ERROR] -> client=${client.id} "Player not found in room"`);
                client.emit(SOCKET_EVENTS.ERROR, { message: 'Player not found in room' });
                return;
            }

            const oldSocketId = existingPlayer.id;
            console.log(`[GAME_CONNECT] reconnecting player oldSocket=${oldSocketId} -> newSocket=${client.id}`);

            // Cancel forfeit timer
            const timerKey = `${roomId}:${chessProfileId}`;
            const timer = this.disconnectTimers.get(timerKey);
            if (timer) {
                console.log(`[GAME_CONNECT] cancelling forfeit timer key=${timerKey}`);
                clearTimeout(timer);
                this.disconnectTimers.delete(timerKey);
            }

            // Update socket ID
            this.pendingGamesService.setPlayerSocket(gameId, chessProfileId, client.id);
            this.roomService.updatePlayerSocket(chessProfileId, oldSocketId, client.id);

            // Join the Socket.IO room
            client.join(roomId);

            // Send full game state to reconnecting player
            console.log(`[GAME_CONNECT ⬆ GAME_RECONNECTED] -> client=${client.id} color=${existingPlayer.color} totalMoves=${gameState.moveHistory?.length}`);
            client.emit(SOCKET_EVENTS.GAME_RECONNECTED, {
                gameState,
                myColor: existingPlayer.color,
                room,
            });

            // Notify opponent
            const otherPlayer = room.players.find(p => p.chessProfileId !== chessProfileId);
            if (otherPlayer) {
                console.log(`[GAME_CONNECT ⬆ OPPONENT_RECONNECTED] -> player=${otherPlayer.id}`);
                this.server.to(otherPlayer.id).emit(SOCKET_EVENTS.OPPONENT_RECONNECTED, {
                    player: existingPlayer,
                });
            }

            return;
        }

        const isPlayer = pendingGame.players.some(p => p.chessProfileId === chessProfileId);
        if (!isPlayer) {
            console.log(`[GAME_CONNECT ✗] chessProfileId=${chessProfileId} is not part of this game`);
            console.log(`[GAME_CONNECT ⬆ ERROR] -> client=${client.id} "You are not part of this game"`);
            client.emit(SOCKET_EVENTS.ERROR, { message: 'You are not part of this game' });
            return;
        }

        // Register socket
        this.pendingGamesService.setPlayerSocket(gameId, chessProfileId, client.id);

        // Look up profile to get a real display name (username)
        const profile = await this.chessProfilesService.findById(chessProfileId).catch(() => null);
        const displayName = profile?.username ?? chessProfileId;

        // Create/join room (color will be assigned in autoStartGame once both players are connected)
        const player: IPlayer = {
            id: client.id,
            displayName,
            chessProfileId,
        };
        this.roomService.createOrJoinGameRoom(gameId, player);

        const roomId = `game:${gameId}`;
        client.join(roomId);
        console.log(`[GAME_CONNECT] player joined room=${roomId}`);

        // Check if both players are connected
        if (this.pendingGamesService.areBothPlayersConnected(gameId)) {
            console.log(`[GAME_CONNECT] both players connected, auto-starting game`);
            await this.autoStartGame(gameId);
        } else {
            console.log(`[GAME_CONNECT ⬆ GAME_WAITING] -> client=${client.id} waiting for opponent`);
            client.emit(SOCKET_EVENTS.GAME_WAITING, { gameId });
        }
    }

    private async autoStartGame(gameId: string): Promise<void> {
        console.log(`\n[AUTO_START_GAME] gameId=${gameId}`);
        const pendingGame = this.pendingGamesService.getGame(gameId);
        if (!pendingGame) return;

        const roomId = `game:${gameId}`;

        // Assign colors from the pending game's white/black assignment
        const room = this.roomService.getRoom(roomId);
        if (!room) return;

        for (const player of room.players) {
            player.color = player.chessProfileId === pendingGame.whiteProfileId
                ? allColorType.LIGHT_COLOR
                : allColorType.DARK_COLOR;
        }

        console.log(`[AUTO_START_GAME] colors assigned:`, JSON.stringify(room.players.map(p => ({ id: p.id, name: p.displayName, color: p.color }))));

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
                console.log(`[AUTO_START_GAME] DB game created id=${dbGame.id}`);
            } catch (err) {
                console.error('[AUTO_START_GAME] Failed to create game record:', err);
            }
        }

        for (const player of room.players) {
            console.log(`[AUTO_START_GAME ⬆ GAME_STARTED] -> player=${player.id} color=${player.color}`);
            this.server.to(player.id).emit(SOCKET_EVENTS.GAME_STARTED, {
                gameState,
                myColor: player.color,
                room,
            });
        }

        pendingGame.status = 'started';
        console.log(`[AUTO_START_GAME] game started successfully`);
    }

    // ---- Existing room-based flow ----

    @SubscribeMessage(SOCKET_EVENTS.ROOM_CREATE)
    async handleCreateRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: ICreateRoomPayload,
    ): Promise<void> {
        console.log(`\n[ROOM_CREATE ⬇ received] client=${client.id}`, JSON.stringify({ roomName: payload.roomName, playerName: payload.playerName, memberId: payload.memberId }));

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
                console.log(`[ROOM_CREATE] found chess profile id=${profile.id}`);
            }
        }

        const room = this.roomService.createRoom(payload.roomName, player);
        client.join(room.roomId);
        console.log(`[ROOM_CREATE ✓] room created roomId=${room.roomId}`);
        console.log(`[ROOM_CREATE ⬆ ROOM_CREATED] -> client=${client.id}`, JSON.stringify({ roomId: room.roomId, players: room.players.map(p => p.displayName) }));
        client.emit(SOCKET_EVENTS.ROOM_CREATED, { room });
        // Broadcast updated room list to all
        console.log(`[ROOM_CREATE ⬆ ROOM_LIST_UPDATED] broadcasting to all`);
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    @SubscribeMessage(SOCKET_EVENTS.ROOM_JOIN)
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: IJoinRoomPayload,
    ): Promise<void> {
        console.log(`\n[ROOM_JOIN ⬇ received] client=${client.id}`, JSON.stringify({ roomId: payload.roomId, playerName: payload.playerName, memberId: payload.memberId }));

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
                console.log(`[ROOM_JOIN] found chess profile id=${profile.id}`);
            }
        }

        const room = this.roomService.joinRoom(payload.roomId, player);
        if (!room) {
            console.log(`[ROOM_JOIN ✗] Unable to join room=${payload.roomId} (full or started)`);
            console.log(`[ROOM_JOIN ⬆ ERROR] -> client=${client.id}`);
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Unable to join room. It may be full or already started.' });
            return;
        }
        client.join(room.roomId);
        console.log(`[ROOM_JOIN ✓] joined room=${room.roomId} players=${JSON.stringify(room.players.map(p => p.displayName))}`);
        console.log(`[ROOM_JOIN ⬆ ROOM_JOINED] -> client=${client.id}`);
        client.emit(SOCKET_EVENTS.ROOM_JOINED, { room });
        // Notify other players in the room
        console.log(`[ROOM_JOIN ⬆ ROOM_UPDATED] -> room=${room.roomId} (other players)`);
        client.to(room.roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
        // Broadcast updated room list
        console.log(`[ROOM_JOIN ⬆ ROOM_LIST_UPDATED] broadcasting to all`);
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    @SubscribeMessage(SOCKET_EVENTS.ROOM_LEAVE)
    handleLeaveRoom(@ConnectedSocket() client: Socket): void {
        console.log(`\n[ROOM_LEAVE ⬇ received] client=${client.id}`);
        const result = this.roomService.leaveRoom(client.id);
        if (result) {
            const { room } = result;
            client.leave(room.roomId);
            console.log(`[ROOM_LEAVE ✓] left room=${room.roomId}`);
            console.log(`[ROOM_LEAVE ⬆ ROOM_UPDATED] -> room=${room.roomId}`);
            this.server.to(room.roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
            console.log(`[ROOM_LEAVE ⬆ ROOM_LIST_UPDATED] broadcasting to all`);
            this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
        } else {
            console.log(`[ROOM_LEAVE] client=${client.id} was not in any room`);
        }
    }

    @SubscribeMessage(SOCKET_EVENTS.ROOM_LIST)
    handleListRooms(@ConnectedSocket() client: Socket): void {
        console.log(`\n[ROOM_LIST ⬇ received] client=${client.id}`);
        const rooms = this.roomService.listRooms();
        console.log(`[ROOM_LIST ⬆ ROOM_LIST_UPDATED] -> client=${client.id} count=${rooms.length}`);
        client.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, rooms);
    }

    @SubscribeMessage(SOCKET_EVENTS.GAME_START)
    async handleStartGame(@ConnectedSocket() client: Socket): Promise<void> {
        console.log(`\n[GAME_START ⬇ received] client=${client.id}`);
        const room = this.roomService.getRoomBySocketId(client.id);
        if (!room) {
            console.log(`[GAME_START ✗] Room not found for client=${client.id}`);
            console.log(`[GAME_START ⬆ ERROR] -> client=${client.id} "Room not found"`);
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Room not found' });
            return;
        }
        if (room.createdBy !== client.id) {
            console.log(`[GAME_START ✗] client=${client.id} is not room creator (creator=${room.createdBy})`);
            console.log(`[GAME_START ⬆ ERROR] -> client=${client.id} "Only the room creator can start the game"`);
            client.emit(SOCKET_EVENTS.ERROR, { message: 'Only the room creator can start the game' });
            return;
        }
        if (room.players.length !== 2) {
            console.log(`[GAME_START ✗] need 2 players, have ${room.players.length}`);
            console.log(`[GAME_START ⬆ ERROR] -> client=${client.id} "Need 2 players to start"`);
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

            console.log(`[GAME_START] colors assigned: white=${whitePlayer?.displayName} black=${blackPlayer?.displayName}`);

            if (whitePlayer?.chessProfileId && blackPlayer?.chessProfileId) {
                try {
                    const dbGame = await this.gamesService.create({
                        whitePlayerId: whitePlayer.chessProfileId,
                        blackPlayerId: blackPlayer.chessProfileId,
                        timeControl: 'rapid',
                    });
                    gameState.dbGameId = dbGame.id;
                    gameState.startedAt = Date.now();
                    console.log(`[GAME_START] DB game created id=${dbGame.id}`);
                } catch (err) {
                    console.error('[GAME_START] Failed to create game record:', err);
                }
            }

            // Emit to each player individually with their color
            for (const player of updatedRoom.players) {
                console.log(`[GAME_START ⬆ GAME_STARTED] -> player=${player.id} color=${player.color}`);
                this.server.to(player.id).emit(SOCKET_EVENTS.GAME_STARTED, {
                    gameState,
                    myColor: player.color,
                    room: updatedRoom,
                });
            }
        }
        console.log(`[GAME_START ⬆ ROOM_LIST_UPDATED] broadcasting to all`);
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    @SubscribeMessage(SOCKET_EVENTS.GAME_MOVE)
    async handleMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: IMovePayload,
    ): Promise<void> {
        console.log(`\n[GAME_MOVE ⬇ received] from client=${client.id}`, JSON.stringify({
            roomId: payload.roomId,
            from: payload.piecePosition,
            to: payload.targetPosition,
        }));

        const playerColor = this.roomService.getPlayerColor(payload.roomId, client.id);
        console.log(`[GAME_MOVE] playerColor=${playerColor}`);
        if (!playerColor) {
            console.log(`[GAME_MOVE ✗] Player not found in room`);
            console.log(`[GAME_MOVE ⬆ ERROR] -> client=${client.id}`);
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
            console.log(`[GAME_MOVE ✗] Invalid move: ${result.error}`);
            console.log(`[GAME_MOVE ⬆ ERROR] -> client=${client.id}`);
            client.emit(SOCKET_EVENTS.ERROR, { message: result.error || 'Invalid move' });
            return;
        }

        const lastMove = result.gameState?.moveHistory?.[result.gameState.moveHistory.length - 1];
        console.log(`[GAME_MOVE ✓] Move executed:`, JSON.stringify({
            piece: lastMove?.pieceType,
            from: lastMove?.from,
            to: lastMove?.to,
            captured: lastMove?.captured || null,
            activeColor: result.gameState?.activeColor,
            check: result.gameState?.check || null,
            checkmate: result.gameState?.checkmate || null,
            totalMoves: result.gameState?.moveHistory?.length,
        }));
        console.log(`[GAME_MOVE ⬆ MOVE_RESULT] broadcasting to room=${payload.roomId}`);

        this.server.to(payload.roomId).emit(SOCKET_EVENTS.MOVE_RESULT, {
            gameState: result.gameState,
        });

        // Persist move to DB (fire-and-forget)
        if (result.gameState?.dbGameId) {
            console.log(`[GAME_MOVE] persisting move to DB gameId=${result.gameState.dbGameId}`);
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
            console.log(`[GAME_MOVE] CHECKMATE detected! winner=${playerColor}`);
            this.clearDisconnectTimersForRoom(payload.roomId);
            await this.finalizeGame(payload.roomId, playerColor, 'checkmate');

            console.log(`[GAME_MOVE ⬆ GAME_OVER] broadcasting to room=${payload.roomId} winner=${playerColor} reason=checkmate`);
            this.server.to(payload.roomId).emit(SOCKET_EVENTS.GAME_OVER, {
                winner: playerColor,
                reason: 'checkmate',
                gameState: result.gameState,
            });
            this.roomService.setRoomStatus(payload.roomId, 'finished');
            this.gameStateService.removeGame(payload.roomId);
            console.log(`[GAME_MOVE ⬆ ROOM_LIST_UPDATED] broadcasting to all`);
            this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
        }
    }

    @SubscribeMessage(SOCKET_EVENTS.GAME_CASTLING_MOVE)
    async handleCastlingMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: ICastlingMovePayload,
    ): Promise<void> {
        console.log(`\n[CASTLING_MOVE ⬇ received] from client=${client.id}`, JSON.stringify({
            roomId: payload.roomId,
            kingPosition: payload.kingPosition,
            rookPosition: payload.rookPosition,
        }));

        const playerColor = this.roomService.getPlayerColor(payload.roomId, client.id);
        console.log(`[CASTLING_MOVE] playerColor=${playerColor}`);
        if (!playerColor) {
            console.log(`[CASTLING_MOVE ✗] Player not found in room`);
            console.log(`[CASTLING_MOVE ⬆ ERROR] -> client=${client.id}`);
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
            console.log(`[CASTLING_MOVE ✗] Invalid: ${result.error}`);
            console.log(`[CASTLING_MOVE ⬆ ERROR] -> client=${client.id}`);
            client.emit(SOCKET_EVENTS.ERROR, { message: result.error || 'Invalid castling move' });
            return;
        }

        console.log(`[CASTLING_MOVE ✓]`, JSON.stringify({
            activeColor: result.gameState?.activeColor,
            check: result.gameState?.check || null,
            checkmate: result.gameState?.checkmate || null,
        }));
        console.log(`[CASTLING_MOVE ⬆ MOVE_RESULT] broadcasting to room=${payload.roomId}`);

        this.server.to(payload.roomId).emit(SOCKET_EVENTS.MOVE_RESULT, {
            gameState: result.gameState,
        });

        // Persist castling move to DB (fire-and-forget)
        if (result.gameState?.dbGameId) {
            const isKingside = payload.rookPosition.x === 7;
            console.log(`[CASTLING_MOVE] persisting to DB gameId=${result.gameState.dbGameId} kingside=${isKingside}`);
            this.persistCastlingMove(result.gameState, payload.roomId, playerColor, isKingside);
        }

        if (result.gameState?.checkmate) {
            console.log(`[CASTLING_MOVE] CHECKMATE detected! winner=${playerColor}`);
            this.clearDisconnectTimersForRoom(payload.roomId);
            await this.finalizeGame(payload.roomId, playerColor, 'checkmate');

            console.log(`[CASTLING_MOVE ⬆ GAME_OVER] broadcasting to room=${payload.roomId} winner=${playerColor} reason=checkmate`);
            this.server.to(payload.roomId).emit(SOCKET_EVENTS.GAME_OVER, {
                winner: playerColor,
                reason: 'checkmate',
                gameState: result.gameState,
            });
            this.roomService.setRoomStatus(payload.roomId, 'finished');
            this.gameStateService.removeGame(payload.roomId);
            console.log(`[CASTLING_MOVE ⬆ ROOM_LIST_UPDATED] broadcasting to all`);
            this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
        }
    }

    @SubscribeMessage(SOCKET_EVENTS.GAME_RESIGN)
    async handleResign(@ConnectedSocket() client: Socket): Promise<void> {
        console.log(`\n[GAME_RESIGN ⬇ received] client=${client.id}`);
        const room = this.roomService.getRoomBySocketId(client.id);
        if (!room) {
            console.log(`[GAME_RESIGN ✗] no room found for client=${client.id}`);
            return;
        }

        const playerColor = this.roomService.getPlayerColor(room.roomId, client.id);
        if (!playerColor) {
            console.log(`[GAME_RESIGN ✗] no color found for client=${client.id}`);
            return;
        }

        const winnerColor: colorType = playerColor === 'light' ? 'dark' : 'light';
        const gameState = this.gameStateService.getGameState(room.roomId);

        console.log(`[GAME_RESIGN] player=${playerColor} resigns, winner=${winnerColor} room=${room.roomId}`);

        this.clearDisconnectTimersForRoom(room.roomId);
        await this.finalizeGame(room.roomId, winnerColor, 'resign');

        console.log(`[GAME_RESIGN ⬆ GAME_OVER] broadcasting to room=${room.roomId} winner=${winnerColor} reason=resign`);
        this.server.to(room.roomId).emit(SOCKET_EVENTS.GAME_OVER, {
            winner: winnerColor,
            reason: 'resign',
            gameState,
        });

        this.roomService.setRoomStatus(room.roomId, 'finished');
        this.gameStateService.removeGame(room.roomId);
        console.log(`[GAME_RESIGN ⬆ ROOM_LIST_UPDATED] broadcasting to all`);
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    // ---- Reconnection helpers ----

    private async forfeitDisconnectedPlayer(roomId: string, chessProfileId: string): Promise<void> {
        console.log(`\n[FORFEIT_DISCONNECT] roomId=${roomId} chessProfileId=${chessProfileId}`);
        const timerKey = `${roomId}:${chessProfileId}`;
        this.disconnectTimers.delete(timerKey);

        const room = this.roomService.getRoom(roomId);
        if (!room || room.status !== 'playing') {
            console.log(`[FORFEIT_DISCONNECT ✗] room not found or not playing`);
            return;
        }

        const gameState = this.gameStateService.getGameState(roomId);
        if (!gameState) {
            console.log(`[FORFEIT_DISCONNECT ✗] no game state`);
            return;
        }

        const winner = room.players.find(p => p.chessProfileId !== chessProfileId);
        if (!winner?.color) {
            console.log(`[FORFEIT_DISCONNECT ✗] no winner found`);
            return;
        }

        console.log(`[FORFEIT_DISCONNECT] winner=${winner.displayName} color=${winner.color}`);
        await this.finalizeGame(roomId, winner.color, 'disconnect');

        console.log(`[FORFEIT_DISCONNECT ⬆ GAME_OVER] broadcasting to room=${roomId} winner=${winner.color} reason=disconnect`);
        this.server.to(roomId).emit(SOCKET_EVENTS.GAME_OVER, {
            winner: winner.color,
            reason: 'disconnect',
            gameState,
        });

        this.gameStateService.removeGame(roomId);
        this.roomService.setRoomStatus(roomId, 'finished');
        console.log(`[FORFEIT_DISCONNECT ⬆ ROOM_LIST_UPDATED] broadcasting to all`);
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    private clearDisconnectTimersForRoom(roomId: string): void {
        for (const [key, timer] of this.disconnectTimers.entries()) {
            if (key.startsWith(`${roomId}:`)) {
                clearTimeout(timer);
                this.disconnectTimers.delete(key);
            }
        }
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

        console.log(`[PERSIST_MOVE] notation=${notation} ply=${ply} fen=${fen}`);

        this.movesService.create({
            gameId: gameState.dbGameId,
            ply,
            playerId: player.chessProfileId,
            notation,
            fenAfter: fen,
        }).catch(err => console.error('[PERSIST_MOVE ✗] Failed:', err));
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

        console.log(`[PERSIST_CASTLING] notation=${notation} ply=${ply} fen=${fen}`);

        this.movesService.create({
            gameId: gameState.dbGameId,
            ply,
            playerId: player.chessProfileId,
            notation,
            fenAfter: fen,
        }).catch(err => console.error('[PERSIST_CASTLING ✗] Failed:', err));
    }

    private async finalizeGame(
        roomId: string,
        winnerColor: colorType | null,
        reason: 'checkmate' | 'resign' | 'disconnect',
    ): Promise<void> {
        console.log(`[FINALIZE_GAME] roomId=${roomId} winner=${winnerColor} reason=${reason}`);
        const gameState = this.gameStateService.getGameState(roomId);
        const room = this.roomService.getRoom(roomId);
        if (!gameState?.dbGameId || !room) {
            console.log(`[FINALIZE_GAME ✗] no gameState or room`);
            return;
        }

        const whitePlayer = room.players.find(p => p.color === 'light');
        const blackPlayer = room.players.find(p => p.color === 'dark');
        if (!whitePlayer?.chessProfileId || !blackPlayer?.chessProfileId) {
            console.log(`[FINALIZE_GAME ✗] missing chess profile IDs`);
            return;
        }

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

        console.log(`[FINALIZE_GAME] result=${result} winnerId=${winnerId} duration=${durationSeconds}s totalMoves=${gameState.moveHistory.length} fen=${finalFen}`);

        try {
            await this.gamesService.endGame(gameState.dbGameId, {
                result,
                endReason: reason,
                winnerId,
                finalFen,
                durationSeconds,
                totalMoves: gameState.moveHistory.length,
            });
            console.log(`[FINALIZE_GAME ✓] game ended in DB`);

            // Update stats for both players
            if (result === 'white_win') {
                await Promise.all([
                    this.chessProfilesService.incrementStats(whitePlayer.chessProfileId, 'win'),
                    this.chessProfilesService.incrementStats(blackPlayer.chessProfileId, 'loss'),
                ]);
                console.log(`[FINALIZE_GAME] stats updated: white=win black=loss`);
            } else if (result === 'black_win') {
                await Promise.all([
                    this.chessProfilesService.incrementStats(whitePlayer.chessProfileId, 'loss'),
                    this.chessProfilesService.incrementStats(blackPlayer.chessProfileId, 'win'),
                ]);
                console.log(`[FINALIZE_GAME] stats updated: white=loss black=win`);
            } else {
                await Promise.all([
                    this.chessProfilesService.incrementStats(whitePlayer.chessProfileId, 'draw'),
                    this.chessProfilesService.incrementStats(blackPlayer.chessProfileId, 'draw'),
                ]);
                console.log(`[FINALIZE_GAME] stats updated: both=draw`);
            }
        } catch (err) {
            console.error('[FINALIZE_GAME ✗] Failed:', err);
        }
    }
}
