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
} from '@myproject/shared';
import { RoomService } from './room.service';
import { GameStateService } from './game-state.service';

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
    ) {}

    handleConnection(client: Socket): void {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket): void {
        console.log(`Client disconnected: ${client.id}`);
        const result = this.roomService.leaveRoom(client.id);
        if (result) {
            const { room, player } = result;
            if (room.status === 'playing') {
                // Game was active — declare other player winner
                const winner = room.players[0];
                if (winner?.color) {
                    const gameState = this.gameStateService.getGameState(room.roomId);
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

    @SubscribeMessage(SOCKET_EVENTS.ROOM_CREATE)
    handleCreateRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: ICreateRoomPayload,
    ): void {
        const player: IPlayer = {
            id: client.id,
            displayName: payload.playerName,
        };
        const room = this.roomService.createRoom(payload.roomName, player);
        client.join(room.roomId);
        client.emit(SOCKET_EVENTS.ROOM_CREATED, { room });
        // Broadcast updated room list to all
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }

    @SubscribeMessage(SOCKET_EVENTS.ROOM_JOIN)
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: IJoinRoomPayload,
    ): void {
        const player: IPlayer = {
            id: client.id,
            displayName: payload.playerName,
        };
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
    handleStartGame(@ConnectedSocket() client: Socket): void {
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

        // Emit to each player individually with their color
        const updatedRoom = this.roomService.getRoom(room.roomId);
        if (updatedRoom) {
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
    handleMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: IMovePayload,
    ): void {
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

        // Check for checkmate
        if (result.gameState?.checkmate) {
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
    handleCastlingMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: ICastlingMovePayload,
    ): void {
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

        if (result.gameState?.checkmate) {
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
    handleResign(@ConnectedSocket() client: Socket): void {
        const room = this.roomService.getRoomBySocketId(client.id);
        if (!room) return;

        const playerColor = this.roomService.getPlayerColor(room.roomId, client.id);
        if (!playerColor) return;

        const winnerColor = playerColor === 'light' ? 'dark' : 'light';
        const gameState = this.gameStateService.getGameState(room.roomId);

        this.server.to(room.roomId).emit(SOCKET_EVENTS.GAME_OVER, {
            winner: winnerColor,
            reason: 'resign',
            gameState,
        });

        this.roomService.setRoomStatus(room.roomId, 'finished');
        this.gameStateService.removeGame(room.roomId);
        this.server.emit(SOCKET_EVENTS.ROOM_LIST_UPDATED, this.roomService.listRooms());
    }
}
